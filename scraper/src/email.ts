import { Resend } from 'resend'
import db from './db.js'

if (!process.env.RESEND_API_KEY) {
  console.warn('[email] RESEND_API_KEY not set — emails will be skipped.')
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'alerts@deadlineiq.com'
const APP_URL = process.env.APP_URL ?? 'https://deadlineiq.com'

const DISCLAIMER =
  'DeadlineIQ provides informational summaries of publicly available regulatory and platform updates only. This is not legal or tax advice. Always verify with official sources and consult a qualified professional before taking action.'

// ─────────────────────────────────────────────
// Urgency helpers
// ─────────────────────────────────────────────
const URGENCY_LABEL: Record<string, string> = {
  informational: 'Info',
  policy_change: 'Policy Change',
  deadline_based: 'Deadline',
  high_urgency: 'High Urgency',
}

const URGENCY_COLOR: Record<string, string> = {
  informational: '#64748b',
  policy_change: '#3b82f6',
  deadline_based: '#f59e0b',
  high_urgency: '#ef4444',
}

// ─────────────────────────────────────────────
// HTML helpers
// ─────────────────────────────────────────────
function badge(urgency: string): string {
  const label = URGENCY_LABEL[urgency] ?? urgency
  const color = URGENCY_COLOR[urgency] ?? '#64748b'
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;color:#fff;background:${color}">${label}</span>`
}

function actionItemsList(items: string[]): string {
  if (!items || items.length === 0) return ''
  const lis = items
    .map(
      (item) =>
        `<li style="margin-bottom:6px;color:#94a3b8;font-size:14px;line-height:1.5">${item}</li>`
    )
    .join('')
  return `
    <p style="margin:16px 0 6px;font-size:13px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:.05em">What to be aware of</p>
    <ul style="margin:0;padding-left:20px">${lis}</ul>`
}

// ─────────────────────────────────────────────
// Instant alert HTML template
// ─────────────────────────────────────────────
function buildAlertHtml(
  update: {
    title: string
    summary: string
    urgency_level: string
    action_items: string[]
    source_url: string
    deadline_date: string | null
    effective_date: string | null
  },
  sourceName: string,
  userName: string | null
): string {
  const greeting = userName ? `Hi ${userName.split(' ')[0]},` : 'Hi there,'
  const deadlineNote = update.deadline_date
    ? `<p style="margin:12px 0 0;font-size:13px;color:#f59e0b"><strong>Deadline date:</strong> ${update.deadline_date}</p>`
    : ''
  const effectiveNote = update.effective_date
    ? `<p style="margin:4px 0 0;font-size:13px;color:#94a3b8"><strong>Effective date:</strong> ${update.effective_date}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${update.title}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px">
          <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px">Deadline<span style="color:#3b82f6">IQ</span></span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#1e293b;border-radius:12px;padding:28px 32px;border:1px solid #334155">

          <!-- Source + badge -->
          <p style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">${sourceName}</p>
          ${badge(update.urgency_level)}

          <!-- Title -->
          <h1 style="margin:14px 0 12px;font-size:20px;font-weight:700;color:#f1f5f9;line-height:1.3">${update.title}</h1>

          <!-- Greeting -->
          <p style="margin:0 0 16px;font-size:14px;color:#94a3b8">${greeting}</p>

          <!-- Summary -->
          <p style="margin:0;font-size:15px;color:#cbd5e1;line-height:1.6">${update.summary}</p>

          ${deadlineNote}${effectiveNote}

          <!-- Action items -->
          ${actionItemsList(update.action_items)}

          <!-- CTA -->
          <div style="margin-top:24px">
            <a href="${update.source_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-right:10px">View Official Source</a>
            <a href="${APP_URL}/dashboard" style="display:inline-block;padding:10px 20px;background:#1e293b;border:1px solid #334155;color:#94a3b8;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Open Dashboard</a>
          </div>

        </td></tr>

        <!-- Disclaimer -->
        <tr><td style="padding:20px 0 0">
          <p style="margin:0;font-size:11px;color:#475569;line-height:1.5">${DISCLAIMER}</p>
          <p style="margin:8px 0 0;font-size:11px;color:#334155">
            You received this because you subscribed to ${sourceName} on DeadlineIQ.
            <a href="${APP_URL}/markets" style="color:#475569">Manage sources</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─────────────────────────────────────────────
// Weekly digest HTML template
// ─────────────────────────────────────────────
function buildDigestHtml(
  updates: Array<{
    title: string
    summary: string
    urgency_level: string
    source_url: string
    deadline_date: string | null
    source_name: string
  }>,
  userName: string | null
): string {
  const greeting = userName ? `Hi ${userName.split(' ')[0]},` : 'Hi there,'
  const weekOf = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const updateRows = updates
    .map(
      (u) => `
      <tr><td style="padding:16px 0;border-bottom:1px solid #1e293b">
        <p style="margin:0 0 6px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">${u.source_name}</p>
        ${badge(u.urgency_level)}
        ${u.deadline_date ? `<span style="margin-left:8px;font-size:12px;color:#f59e0b">Deadline: ${u.deadline_date}</span>` : ''}
        <p style="margin:8px 0 4px;font-size:15px;font-weight:600;color:#f1f5f9">${u.title}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.5">${u.summary}</p>
        <a href="${u.source_url}" style="font-size:12px;color:#3b82f6;text-decoration:none">View official source →</a>
      </td></tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Weekly DeadlineIQ Digest</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Logo + heading -->
        <tr><td style="padding-bottom:24px">
          <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px">Deadline<span style="color:#3b82f6">IQ</span></span>
          <h2 style="margin:12px 0 4px;font-size:22px;font-weight:700;color:#f1f5f9">Your weekly digest</h2>
          <p style="margin:0;font-size:13px;color:#64748b">Week of ${weekOf} · ${updates.length} update${updates.length !== 1 ? 's' : ''} across your sources</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding-bottom:16px">
          <p style="margin:0;font-size:14px;color:#94a3b8">${greeting} here's what changed across your monitored sources this week.</p>
        </td></tr>

        <!-- Updates -->
        <tr><td style="background:#1e293b;border-radius:12px;padding:4px 28px;border:1px solid #334155">
          <table width="100%" cellpadding="0" cellspacing="0">${updateRows}</table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:20px 0">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:11px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Open Dashboard</a>
        </td></tr>

        <!-- Disclaimer -->
        <tr><td>
          <p style="margin:0;font-size:11px;color:#475569;line-height:1.5">${DISCLAIMER}</p>
          <p style="margin:8px 0 0;font-size:11px;color:#334155">
            You received this weekly digest because you have active sources on DeadlineIQ.
            <a href="${APP_URL}/markets" style="color:#475569">Manage sources</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─────────────────────────────────────────────
// Send instant alert to all subscribers of a source
// ─────────────────────────────────────────────
export async function sendInstantAlert(
  update: {
    id: string
    title: string
    summary: string
    urgency_level: string
    action_items: string[]
    source_url: string
    deadline_date: string | null
    effective_date: string | null
  },
  source: { id: string; name: string }
): Promise<void> {
  if (!resend) {
    console.log('  [email] Skipped — RESEND_API_KEY not configured')
    return
  }

  // Only alert on meaningful urgency levels — skip purely informational
  const alertableUrgency = ['policy_change', 'deadline_based', 'high_urgency']
  if (!alertableUrgency.includes(update.urgency_level)) {
    console.log(`  [email] Skipped instant alert — urgency is "${update.urgency_level}"`)
    return
  }

  // Fetch subscribers for this source
  const { data: subs, error } = await db
    .from('user_sources')
    .select('users(id, email, full_name)')
    .eq('source_id', source.id)

  if (error) {
    console.error('  [email] Failed to fetch subscribers:', error.message)
    return
  }

  if (!subs || subs.length === 0) {
    console.log(`  [email] No subscribers for ${source.name}`)
    return
  }

  const urgencyLabel = URGENCY_LABEL[update.urgency_level] ?? 'Alert'
  const subject = `[${urgencyLabel}] ${update.title}`

  let sent = 0
  for (const sub of subs) {
    const user = sub.users as unknown as { id: string; email: string; full_name: string | null } | null
    if (!user?.email) continue

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: user.email,
      subject,
      html: buildAlertHtml(update, source.name, user.full_name),
    })

    if (sendError) {
      console.error(`  [email] Failed to send to ${user.email}:`, sendError.message)
    } else {
      sent++
    }

    // Small delay to stay within Resend rate limits
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`  [email] Instant alert sent to ${sent} subscriber(s)`)
}

// ─────────────────────────────────────────────
// Send weekly digest to all active users
// ─────────────────────────────────────────────
export async function sendWeeklyDigest(): Promise<void> {
  if (!resend) {
    console.log('[digest] Skipped — RESEND_API_KEY not configured')
    return
  }

  console.log('\n[digest] Sending weekly digest...')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Load all updates from the past 7 days, with source info
  const { data: recentUpdates, error: updatesError } = await db
    .from('updates')
    .select('id, title, summary, urgency_level, source_url, deadline_date, source_id, sources(name)')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })

  if (updatesError) {
    console.error('[digest] Failed to load recent updates:', updatesError.message)
    return
  }

  if (!recentUpdates || recentUpdates.length === 0) {
    console.log('[digest] No updates in the past 7 days — skipping digest.')
    return
  }

  // Load all users who have at least one source subscription
  const { data: activeUsers, error: usersError } = await db
    .from('user_sources')
    .select('user_id, source_id, users(id, email, full_name)')

  if (usersError) {
    console.error('[digest] Failed to load active users:', usersError.message)
    return
  }

  if (!activeUsers || activeUsers.length === 0) {
    console.log('[digest] No active subscribers — skipping digest.')
    return
  }

  // Build a map: userId → Set of subscribed source IDs
  const userSourceMap = new Map<string, Set<string>>()
  const userInfoMap = new Map<string, { email: string; full_name: string | null }>()

  for (const row of activeUsers) {
    const user = row.users as unknown as { id: string; email: string; full_name: string | null } | null
    if (!user?.email) continue

    if (!userSourceMap.has(user.id)) {
      userSourceMap.set(user.id, new Set())
      userInfoMap.set(user.id, { email: user.email, full_name: user.full_name })
    }
    userSourceMap.get(user.id)!.add(row.source_id as string)
  }

  let sent = 0

  for (const [userId, subscribedSourceIds] of userSourceMap) {
    const userInfo = userInfoMap.get(userId)
    if (!userInfo) continue

    // Filter updates to only those for this user's sources
    const relevantUpdates = recentUpdates
      .filter((u) => subscribedSourceIds.has(u.source_id as string))
      .map((u) => ({
        title: u.title as string,
        summary: u.summary as string,
        urgency_level: u.urgency_level as string,
        source_url: u.source_url as string,
        deadline_date: u.deadline_date as string | null,
        source_name: (u.sources as unknown as { name: string } | null)?.name ?? 'Unknown source',
      }))

    if (relevantUpdates.length === 0) continue

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: userInfo.email,
      subject: `Your DeadlineIQ weekly digest — ${relevantUpdates.length} update${relevantUpdates.length !== 1 ? 's' : ''}`,
      html: buildDigestHtml(relevantUpdates, userInfo.full_name),
    })

    if (sendError) {
      console.error(`  [digest] Failed to send to ${userInfo.email}:`, sendError.message)
    } else {
      sent++
    }

    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`[digest] Weekly digest sent to ${sent} user(s)`)
}
