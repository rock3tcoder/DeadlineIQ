import { scrapeBizBuySell } from './bizbuysell.js'
import { scrapeCapitalOpportunities } from './capital.js'
import { scrapeJobs } from './jobs.js'
import { notifyBusiness, notifyCapital, notifyJob } from './notifier.js'

export async function runWealthOperator(): Promise<void> {
  if (process.env.WEALTH_OPERATOR_ENABLED !== 'true') {
    console.log(
      '[wealth] Disabled — set WEALTH_OPERATOR_ENABLED=true to activate.'
    )
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('[wealth] Wealth Operator run started')
  console.log('='.repeat(60))

  // ── A: Businesses for sale ────────────────────────────────
  try {
    const businesses = await scrapeBizBuySell()
    for (const b of businesses) {
      await notifyBusiness(b)
      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (err) {
    console.error(
      '[wealth] BizBuySell error:',
      err instanceof Error ? err.message : err
    )
  }

  // ── B: Capital injection / equity ─────────────────────────
  try {
    const capitals = await scrapeCapitalOpportunities()
    for (const c of capitals) {
      await notifyCapital(c)
      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (err) {
    console.error(
      '[wealth] Capital scrape error:',
      err instanceof Error ? err.message : err
    )
  }

  // ── C: NYC jobs $250k+ ────────────────────────────────────
  try {
    const jobs = await scrapeJobs()
    for (const j of jobs) {
      await notifyJob(j)
      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (err) {
    console.error(
      '[wealth] Jobs scrape error:',
      err instanceof Error ? err.message : err
    )
  }

  console.log('[wealth] Wealth Operator run complete')
}
