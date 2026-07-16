import db from './db.js'
import { sendDeadlineReminderEmail } from './email.js'
import { canReceiveForTag, type BillingUser } from './entitlements.js'

// The product promise: reminder emails at 14 days and 3 days before every
// tracked filing deadline. The deadline_reminders table (migration 005)
// records every send, so restarts and overlapping runs never double-send.
const REMINDER_WINDOWS = [
  { type: '14_day', days: 14 },
  { type: '3_day', days: 3 },
] as const

interface ReminderUpdate {
  id: string
  title: string
  summary: string
  deadline_date: string
  source_url: string
  source_id: string
  sources: { name: string; platform_tag: string } | null
}

/** YYYY-MM-DD in UTC, `days` days from now. */
function utcDatePlusDays(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return d.toISOString().split('T')[0]
}

async function processWindow(type: '14_day' | '3_day', days: number): Promise<number> {
  const targetDate = utcDatePlusDays(days)

  const { data: updates, error } = await db
    .from('updates')
    .select('id, title, summary, deadline_date, source_url, source_id, sources(name, platform_tag)')
    .eq('deadline_date', targetDate)

  if (error) {
    console.error(`  [reminder] Failed to load updates for ${targetDate}:`, error.message)
    return 0
  }

  if (!updates || updates.length === 0) return 0

  let sent = 0

  for (const raw of updates) {
    const update = raw as unknown as ReminderUpdate
    const sourceName = update.sources?.name ?? 'Unknown source'
    const platformTag = update.sources?.platform_tag ?? ''

    // Subscribers of this update's source, with billing info
    const { data: subs, error: subsError } = await db
      .from('user_sources')
      .select('users(id, email, full_name, plan, subscription_status, trial_ends_at)')
      .eq('source_id', update.source_id)

    if (subsError) {
      console.error(`  [reminder] Failed to load subscribers:`, subsError.message)
      continue
    }
    if (!subs || subs.length === 0) continue

    // Users already reminded for this update + window
    const { data: alreadySent, error: sentError } = await db
      .from('deadline_reminders')
      .select('user_id')
      .eq('update_id', update.id)
      .eq('reminder_type', type)

    if (sentError) {
      console.error(`  [reminder] Failed to load sent records:`, sentError.message)
      continue
    }

    const sentUserIds = new Set((alreadySent ?? []).map((r) => r.user_id as string))

    for (const sub of subs) {
      const user = sub.users as unknown as
        | ({ id: string; email: string; full_name: string | null } & BillingUser)
        | null
      if (!user?.email) continue
      if (sentUserIds.has(user.id)) continue
      if (!canReceiveForTag(user, platformTag)) continue

      const ok = await sendDeadlineReminderEmail(
        user.email,
        user.full_name,
        {
          title: update.title,
          summary: update.summary,
          deadline_date: update.deadline_date,
          source_url: update.source_url,
        },
        sourceName,
        days
      )

      if (ok) {
        // Record the send — ignoreDuplicates guards against concurrent runs
        const { error: insertError } = await db
          .from('deadline_reminders')
          .upsert(
            { update_id: update.id, user_id: user.id, reminder_type: type },
            { onConflict: 'update_id,user_id,reminder_type', ignoreDuplicates: true }
          )

        if (insertError) {
          console.error(`  [reminder] Failed to record send:`, insertError.message)
        }
        sent++
      }

      // Small delay to stay within Resend rate limits
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return sent
}

// ─────────────────────────────────────────────
// Main export — run both reminder windows
// ─────────────────────────────────────────────
export async function sendDeadlineReminders(): Promise<void> {
  console.log(`\n[reminder] Deadline reminder run started at ${new Date().toISOString()}`)

  let total = 0
  for (const { type, days } of REMINDER_WINDOWS) {
    total += await processWindow(type, days)
  }

  console.log(`[reminder] Run complete — ${total} reminder(s) sent`)
}
