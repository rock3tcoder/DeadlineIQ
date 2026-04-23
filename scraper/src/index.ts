import cron from 'node-cron'
import { runScraper } from './scraper.js'
import { sendWeeklyDigest } from './email.js'
import { runWealthOperator } from './wealth/index.js'
import { sendWealthDigest } from './wealth/digest.js'

console.log('[deadlineiq-scraper] Starting...')
console.log(`[deadlineiq-scraper] Supabase URL: ${process.env.SUPABASE_URL ?? '(not set)'}`)

// Run immediately on startup so we don't wait 6 hours for the first scrape
await runScraper()

// Scrape every 6 hours: 12 AM, 6 AM, 12 PM, 6 PM UTC
cron.schedule('0 0,6,12,18 * * *', async () => {
  await runScraper()
})

// Weekly digest every Monday at 8 AM UTC
cron.schedule('0 8 * * 1', async () => {
  await sendWeeklyDigest()
})

// ── Wealth Operator ────────────────────────────────────────────────────────────

// Run wealth scan immediately on startup
await runWealthOperator()

// Wealth scan every 12 hours: 6 AM and 6 PM UTC
cron.schedule('0 6,18 * * *', async () => {
  await runWealthOperator()
})

// Daily wealth digest every morning at 7 AM UTC (3 AM ET)
cron.schedule('0 7 * * *', async () => {
  await sendWealthDigest()
})

console.log('[deadlineiq-scraper] Scheduler running.')
console.log('  → DeadlineIQ scraping every 6 hours (12 AM / 6 AM / 12 PM / 6 PM UTC)')
console.log('  → DeadlineIQ weekly digest every Monday at 8 AM UTC')
console.log('  → Wealth operator scan every 12 hours (6 AM / 6 PM UTC)')
console.log('  → Wealth daily digest every morning at 7 AM UTC')
