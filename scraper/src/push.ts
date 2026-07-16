// DeadlineIQ scraper — mobile push notifications via Firebase Cloud Messaging.
//
// Sends urgent policy alerts to the native mobile apps (mobile/ project).
// Configure with FIREBASE_SERVICE_ACCOUNT — the raw JSON of a Firebase
// service account key (Project settings → Service accounts → Generate key).
// When unset, push is skipped and the scraper works exactly as before.
//
// Uses FCM's HTTP v1 API with a self-signed OAuth2 JWT (Node crypto),
// so no Firebase SDK dependency is needed.

import { createSign } from 'crypto'
import db from './db.js'
import { canReceiveForTag, type BillingUser } from './entitlements.js'

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
  token_uri: string
}

let serviceAccount: ServiceAccount | null = null
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount
  }
} catch {
  console.warn('[push] FIREBASE_SERVICE_ACCOUNT is not valid JSON — push disabled.')
}

if (!serviceAccount) {
  console.warn('[push] FIREBASE_SERVICE_ACCOUNT not set — mobile push will be skipped.')
}

// ─────────────────────────────────────────────
// OAuth2 access token (cached until ~5 min before expiry)
// ─────────────────────────────────────────────
let cachedToken: { value: string; expiresAt: number } | null = null

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.value
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    })
  )

  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = signer.sign(sa.private_key).toString('base64url')
  const assertion = `${header}.${claims}.${signature}`

  try {
    const res = await fetch(sa.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    })

    if (!res.ok) {
      console.error(`  [push] OAuth token request failed: ${res.status} ${await res.text()}`)
      return null
    }

    const data = (await res.json()) as { access_token: string; expires_in: number }
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
    return cachedToken.value
  } catch (err) {
    console.error('  [push] OAuth token request error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─────────────────────────────────────────────
// Send one FCM message. Returns 'ok' | 'unregistered' | 'error'.
// ─────────────────────────────────────────────
async function sendFcmMessage(
  sa: ServiceAccount,
  accessToken: string,
  token: string,
  title: string,
  body: string
): Promise<'ok' | 'unregistered' | 'error'> {
  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: { url: '/dashboard' },
          },
        }),
      }
    )

    if (res.ok) return 'ok'

    const text = await res.text()
    // 404 UNREGISTERED / 400 invalid token → stale token, clean it up
    if (res.status === 404 || text.includes('UNREGISTERED') || text.includes('INVALID_ARGUMENT')) {
      return 'unregistered'
    }
    console.error(`  [push] FCM send failed: ${res.status} ${text.slice(0, 200)}`)
    return 'error'
  } catch (err) {
    console.error('  [push] FCM send error:', err instanceof Error ? err.message : err)
    return 'error'
  }
}

// ─────────────────────────────────────────────
// Main export — push an urgent update to entitled subscribers
// ─────────────────────────────────────────────
export async function sendPushAlert(
  update: { title: string; summary: string; urgency_level: string },
  source: { id: string; name: string; platform_tag: string }
): Promise<void> {
  if (!serviceAccount) return

  // Same urgency bar as instant email alerts
  const alertableUrgency = ['policy_change', 'deadline_based', 'high_urgency']
  if (!alertableUrgency.includes(update.urgency_level)) return

  // Entitled subscribers of this source
  const { data: subs, error } = await db
    .from('user_sources')
    .select('users(id, plan, subscription_status, trial_ends_at)')
    .eq('source_id', source.id)

  if (error) {
    console.error('  [push] Failed to fetch subscribers:', error.message)
    return
  }

  const entitledUserIds = (subs ?? [])
    .map((s) => s.users as unknown as ({ id: string } & BillingUser) | null)
    .filter((u): u is { id: string } & BillingUser => !!u && canReceiveForTag(u, source.platform_tag))
    .map((u) => u.id)

  if (entitledUserIds.length === 0) return

  // Their registered devices
  const { data: devices, error: devError } = await db
    .from('device_tokens')
    .select('id, token')
    .in('user_id', entitledUserIds)

  if (devError) {
    console.error('  [push] Failed to fetch device tokens:', devError.message)
    return
  }
  if (!devices || devices.length === 0) return

  const accessToken = await getAccessToken(serviceAccount)
  if (!accessToken) return

  const title = `${source.name}: ${update.title}`.slice(0, 120)
  const body = update.summary.slice(0, 200)

  let sent = 0
  const staleIds: string[] = []

  for (const device of devices) {
    const result = await sendFcmMessage(serviceAccount, accessToken, device.token as string, title, body)
    if (result === 'ok') sent++
    if (result === 'unregistered') staleIds.push(device.id as string)
    await new Promise((r) => setTimeout(r, 100))
  }

  if (staleIds.length > 0) {
    await db.from('device_tokens').delete().in('id', staleIds)
    console.log(`  [push] Removed ${staleIds.length} stale device token(s)`)
  }

  console.log(`  [push] Push alert sent to ${sent} device(s)`)
}
