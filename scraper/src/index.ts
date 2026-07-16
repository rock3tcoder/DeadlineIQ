import cron from 'node-cron'
import { runScraper } from './scraper.js'
import { sendWeeklyDigest } from './email.js'
import { sendDeadlineReminders } from './reminders.js'

console.log('[deadlineiq-scraper] Starting...')
console.log(`[deadlineiq-scraper] Supabase URL: ${process.env.SUPABASE_URL ?? '(not set)'}`)

// Run immediately on startup so we don't wait 6 hours for the first scrape.
// Failures are logged, not fatal — otherwise Railway restart-loops the worker.
try {
  await runScraper()
} catch (err) {
  console.error('[deadlineiq-scraper] Startup scrape failed:', err instanceof Error ? err.message : err)
}

// Deadline reminders are deduplicated in the DB, so running at startup is safe
// and covers deploys/restarts that would otherwise skip a day's cron firing.
try {
  await sendDeadlineReminders()
} catch (err) {
  console.error('[deadlineiq-scraper] Startup reminder run failed:', err instanceof Error ? err.message : err)
}

// Scrape every 6 hours: 12 AM, 6 AM, 12 PM, 6 PM UTC
cron.schedule('0 0,6,12,18 * * *', async () => {
  try {
    await runScraper()
  } catch (err) {
    console.error('[deadlineiq-scraper] Scheduled scrape failed:', err instanceof Error ? err.message : err)
  }
})

// Deadline reminders (14-day + 3-day) every day at 1 PM UTC (morning in the US)
cron.schedule('0 13 * * *', async () => {
  try {
    await sendDeadlineReminders()
  } catch (err) {
    console.error('[deadlineiq-scraper] Scheduled reminder run failed:', err instanceof Error ? err.message : err)
  }
})

// Weekly digest every Monday at 8 AM UTC
cron.schedule('0 8 * * 1', async () => {
  try {
    await sendWeeklyDigest()
  } catch (err) {
    console.error('[deadlineiq-scraper] Scheduled digest failed:', err instanceof Error ? err.message : err)
  }
})

console.log('[deadlineiq-scraper] Scheduler running.')
console.log('  → Scraping every 6 hours (12 AM / 6 AM / 12 PM / 6 PM UTC)')
console.log('  → Deadline reminders daily at 1 PM UTC (14-day + 3-day windows)')
console.log('  → Weekly digest every Monday at 8 AM UTC')
