import * as cheerio from 'cheerio'
import { upsertBusiness, type WealthBusiness } from './db.js'

// Keywords that indicate a business can be run without daily owner presence —
// critical for H1B passive-ownership eligibility.
const PASSIVE_KEYWORDS = [
  'absentee',
  'passive',
  'semi-absentee',
  'turnkey',
  'turn-key',
  'manager run',
  'manager-run',
  'managed',
  'online',
  'ecommerce',
  'e-commerce',
  'saas',
  'digital',
  'remote',
  'recurring revenue',
  'subscription',
  'automated',
  'no owner involvement',
  'low owner',
  'owner not required',
  'investor friendly',
]

const SEARCH_URLS = [
  // Absentee / passive ownership nationally — best fit for H1B
  'https://www.bizbuysell.com/businesses-for-sale/?q=absentee+owner&p=1',
  'https://www.bizbuysell.com/businesses-for-sale/?q=semi-absentee&p=1',
  'https://www.bizbuysell.com/businesses-for-sale/?q=passive+income&p=1',
  // Online / SaaS — geographically flexible, typically absentee
  'https://www.bizbuysell.com/internet-businesses-for-sale/?p=1',
  // NY metro, affordable asking price (≤ $500k reachable with $50k down + SBA)
  'https://www.bizbuysell.com/new-york-businesses-for-sale/?max_asking_price=500000&p=1',
]

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; DeadlineIQ-Bot/1.0; +https://deadlineiq.com/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function parseDollars(text: string): number | null {
  if (!text) return null
  const lower = text.toLowerCase().trim()
  const clean = lower.replace(/[$,\s]/g, '')
  const num = parseFloat(clean)
  if (isNaN(num) || num <= 0) return null
  if (lower.includes('m') || lower.endsWith('m')) return Math.round(num * 1_000_000 * 100)
  if (lower.includes('k') || lower.endsWith('k')) return Math.round(num * 1_000 * 100)
  return Math.round(num * 100)
}

function isPassiveEligible(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  return PASSIVE_KEYWORDS.some((kw) => text.includes(kw))
}

function scrapePage(html: string): WealthBusiness[] {
  const $ = cheerio.load(html)
  const results: WealthBusiness[] = []

  // BizBuySell uses several class names across versions — match all
  const selectors = [
    '[data-testid="listing-card"]',
    '.listings article',
    '.listing-card',
    '.bfs-listing',
    'article.listing',
    '.serp-card',
  ]

  $(selectors.join(', ')).each((_, el) => {
    const $el = $(el)

    const title = $el
      .find('[data-testid="listing-title"], .listing-title, h3, h2')
      .first()
      .text()
      .trim()
    if (!title || title.length < 3) return

    const href = $el.find('a').first().attr('href') ?? ''
    if (!href) return
    const listingUrl = href.startsWith('http')
      ? href
      : `https://www.bizbuysell.com${href}`

    const description = $el
      .find('[data-testid="listing-description"], .listing-description, .description, p')
      .first()
      .text()
      .trim()

    const location = $el
      .find('[data-testid="listing-location"], .location, .city, .state')
      .first()
      .text()
      .trim()

    const askingText = $el
      .find('[data-testid="asking-price"], .asking-price, .price, [class*="price"]')
      .first()
      .text()
      .trim()

    const revenueText = $el
      .find('[data-testid="revenue"], .revenue, .gross-revenue, [class*="revenue"]')
      .first()
      .text()
      .trim()

    const cashFlowText = $el
      .find('[data-testid="cash-flow"], .cash-flow, .sde, [class*="cash"]')
      .first()
      .text()
      .trim()

    const industry = $el
      .find('[data-testid="industry"], .industry, .category, [class*="industry"]')
      .first()
      .text()
      .trim()

    results.push({
      source: 'bizbuysell',
      title,
      description: description || null,
      asking_price_cents: parseDollars(askingText),
      revenue_cents: parseDollars(revenueText),
      cash_flow_cents: parseDollars(cashFlowText),
      industry: industry || null,
      location: location || null,
      listing_url: listingUrl,
      is_passive_eligible: isPassiveEligible(title, description),
      raw_snippet: $el.text().trim().slice(0, 500),
    })
  })

  return results
}

export interface ScrapedBusiness {
  id: string
  listing: WealthBusiness
}

export async function scrapeBizBuySell(): Promise<ScrapedBusiness[]> {
  console.log('[wealth/bizbuysell] Starting BizBuySell scrape...')
  const newListings: ScrapedBusiness[] = []

  for (const url of SEARCH_URLS) {
    console.log(`  → ${url}`)
    const html = await fetchPage(url)

    if (!html) {
      console.warn('    [skip] Failed to fetch page')
      await new Promise((r) => setTimeout(r, 3_000))
      continue
    }

    const listings = scrapePage(html)
    console.log(`    found ${listings.length} listing(s)`)

    for (const listing of listings) {
      const result = await upsertBusiness(listing)
      if (result?.isNew) {
        newListings.push({ id: result.id, listing })
        console.log(`    [new] ${listing.title}${listing.is_passive_eligible ? ' ★ passive' : ''}`)
      }
    }

    await new Promise((r) => setTimeout(r, 3_000))
  }

  console.log(`[wealth/bizbuysell] Done — ${newListings.length} new listing(s)`)
  return newListings
}
