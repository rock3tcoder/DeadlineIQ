import cron from 'node-cron'
import { runScraper } from './scraper.js'
import { sendWeeklyDigest } from './email.js'
import { runWealthOperator } from './wealth/index.js'

console.log('[deadlineiq-scraper] Starting...')
console.log(`[deadlineiq-scraper] Supabase URL: ${process.env.SUPABASE_URL ?? '(not set)'}`)
console.log(`[deadlineiq-scraper] Wealth Operator: ${process.env.WEALTH_OPERATOR_ENABLED === 'true' ? 'ENABLED' : 'disabled'}`)

// Run immediately on startup so we don't wait 6 hours for the first scrape
await runScraper()
await runWealthOperator()

// Scrape every 6 hours: 12 AM, 6 AM, 12 PM, 6 PM UTC
cron.schedule('0 0,6,12,18 * * *', async () => {
  await runScraper()
})

// Wealth Operator runs daily at 7 AM UTC
cron.schedule('0 7 * * *', async () => {
  await runWealthOperator()
})

// Weekly digest every Monday at 8 AM UTC
cron.schedule('0 8 * * 1', async () => {
  await sendWeeklyDigest()
})

console.log('[deadlineiq-scraper] Scheduler running.')
console.log('  → Scraping every 6 hours (12 AM / 6 AM / 12 PM / 6 PM UTC)')
console.log('  → Wealth Operator daily at 7 AM UTC (requires WEALTH_OPERATOR_ENABLED=true)')
console.log('  → Weekly digest every Monday at 8 AM UTC')
