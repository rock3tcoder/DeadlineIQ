/**
 * Wealth Operator — Main Orchestrator
 *
 * Runs all scrapers, deduplicates against DB, underwrites new listings,
 * saves results, sends instant alerts for A+ deals, and generates outreach drafts.
 */

import { scrapeBizBuySell } from './bizbuysell.js'
import { scrapeJobs } from './jobs.js'
import { scrapeCapitalOpportunities } from './capital.js'
import { underwrite } from './underwriter.js'
import { sendInstantWealthAlert } from './notifier.js'
import { generateOutreach } from './outreach.js'
import { exists, saveOpportunity, markAlertSent } from './db.js'
import type { RawListing, WealthOpportunity } from './types.js'

// ─── Process a batch of raw listings ─────────────────────────────────────────

async function processListings(listings: RawListing[]): Promise<{
  saved: number
  alerted: number
  aPlus: number
}> {
  let saved = 0
  let alerted = 0
  let aPlus = 0

  for (const listing of listings) {
    try {
      // Skip if already in DB
      const alreadyExists = await exists(listing.source_platform, listing.external_id)
      if (alreadyExists) continue

      console.log(`  → Underwriting: "${listing.name}"`)

      // AI underwrite
      const result = await underwrite(listing)
      if (!result) continue

      // Skip C-grade — not worth storing
      if (result.grade === 'C') {
        console.log(`    Skipped (C grade): ${listing.name}`)
        continue
      }

      // Save to DB
      const id = await saveOpportunity(listing, result)
      if (!id) continue

      saved++

      if (result.grade === 'A+') aPlus++

      // Build the full opportunity object for notification/outreach
      const opp: WealthOpportunity = {
        id,
        ...listing,
        ...result,
        status: 'new',
        found_at: new Date().toISOString(),
      } as WealthOpportunity

      // Generate outreach draft for A+ and A opportunities
      if (result.grade === 'A+' || result.grade === 'A') {
        await generateOutreach(opp)
      }

      // Send instant alert for A+ and A
      if (result.grade === 'A+' || result.grade === 'A') {
        await sendInstantWealthAlert(opp)
        await markAlertSent(id)
        alerted++
      }

      // Small delay to respect API rate limits
      await delay(300)
    } catch (err) {
      console.error(
        `  [wealth] Error processing "${listing.name}":`,
        err instanceof Error ? err.message : err
      )
    }
  }

  return { saved, alerted, aPlus }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function runWealthOperator(): Promise<void> {
  const startTime = Date.now()
  console.log('\n══════════════════════════════════════════')
  console.log('[wealth] Starting Wealth Operator scan...')
  console.log('══════════════════════════════════════════')

  let totalSaved = 0
  let totalAlerted = 0
  let totalAPlus = 0

  // ── 1. Business Acquisitions (BizBuySell + Empire Flippers) ────────────────
  console.log('\n[wealth] Phase 1: Business acquisition scan')
  try {
    const bizListings = await scrapeBizBuySell()
    const bizResult = await processListings(bizListings)
    totalSaved += bizResult.saved
    totalAlerted += bizResult.alerted
    totalAPlus += bizResult.aPlus
    console.log(
      `  ✓ Acquisitions: ${bizResult.saved} new saved, ${bizResult.aPlus} A+ found`
    )
  } catch (err) {
    console.error('[wealth] Acquisition scan failed:', err instanceof Error ? err.message : err)
  }

  // ── 2. Capital Injection Opportunities ─────────────────────────────────────
  console.log('\n[wealth] Phase 2: Capital injection scan')
  try {
    const capitalListings = await scrapeCapitalOpportunities()
    const capResult = await processListings(capitalListings)
    totalSaved += capResult.saved
    totalAlerted += capResult.alerted
    totalAPlus += capResult.aPlus
    console.log(
      `  ✓ Capital deals: ${capResult.saved} new saved, ${capResult.aPlus} A+ found`
    )
  } catch (err) {
    console.error('[wealth] Capital scan failed:', err instanceof Error ? err.message : err)
  }

  // ── 3. NYC Jobs ────────────────────────────────────────────────────────────
  console.log('\n[wealth] Phase 3: NYC job scan')
  try {
    const jobListings = await scrapeJobs()
    const jobResult = await processListings(jobListings)
    totalSaved += jobResult.saved
    totalAlerted += jobResult.alerted
    totalAPlus += jobResult.aPlus
    console.log(
      `  ✓ Jobs: ${jobResult.saved} new saved, ${jobResult.aPlus} A+ found`
    )
  } catch (err) {
    console.error('[wealth] Job scan failed:', err instanceof Error ? err.message : err)
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n══════════════════════════════════════════')
  console.log(`[wealth] Scan complete in ${elapsed}s`)
  console.log(`  Total new opportunities saved: ${totalSaved}`)
  console.log(`  A+ opportunities found:        ${totalAPlus}`)
  console.log(`  Instant alerts sent:           ${totalAlerted}`)
  console.log('══════════════════════════════════════════\n')
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
