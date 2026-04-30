/**
 * Capital injection opportunity finder
 *
 * Searches for authentic business owners seeking equity partners,
 * silent partners, growth capital, or buy-in partners.
 *
 * Sources:
 *  - Craigslist business-for-sale (NY, NJ, CT)
 *  - BizBuySell capital-seeking listings
 *  - Selected public search results
 */

import * as cheerio from 'cheerio'
import type { RawBusinessListing } from './types.js'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Craigslist business-for-sale searches with investor/partner keywords
const CRAIGSLIST_SEARCHES = [
  {
    url: 'https://newyork.craigslist.org/search/bfs?query=investor+wanted&sort=date',
    query: 'investor wanted',
  },
  {
    url: 'https://newyork.craigslist.org/search/bfs?query=silent+partner&sort=date',
    query: 'silent partner',
  },
  {
    url: 'https://newyork.craigslist.org/search/bfs?query=equity+partner&sort=date',
    query: 'equity partner',
  },
  {
    url: 'https://newyork.craigslist.org/search/bfs?query=looking+for+investor&sort=date',
    query: 'looking for investor',
  },
  {
    url: 'https://newyork.craigslist.org/search/bfs?query=business+partner+wanted&sort=date',
    query: 'business partner',
  },
  // NJ
  {
    url: 'https://newjersey.craigslist.org/search/bfs?query=investor+wanted&sort=date',
    query: 'investor wanted NJ',
  },
  {
    url: 'https://newjersey.craigslist.org/search/bfs?query=silent+partner&sort=date',
    query: 'silent partner NJ',
  },
]

// BizBuySell owner-seeking-partner / partial sale listings
const BIZBUYSELL_CAPITAL_SEARCHES = [
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=silent+partner&l=New+York',
    type: 'silent_partner',
  },
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=investor+wanted&l=New+York',
    type: 'investor_wanted',
  },
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=equity+partner&l=New+York',
    type: 'equity_partner',
  },
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=growth+capital&l=New+York',
    type: 'growth_capital',
  },
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=silent+partner&l=New+Jersey',
    type: 'silent_partner_nj',
  },
]

// ─── Authenticity filter keywords (red flags → skip) ─────────────────────────

const RED_FLAG_KEYWORDS = [
  'crypto', 'bitcoin', 'mlm', 'network marketing', 'forex', 'dropshipping',
  'nft', 'pyramid', 'unlimited income', 'get rich', 'passive $10k', 'work from home unlimited',
  'guaranteed returns', 'no experience needed unlimited', 'be your own boss unlimited',
]

function isAuthentic(text: string): boolean {
  const lower = text.toLowerCase()
  return !RED_FLAG_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      console.warn(`  [capital] HTTP ${res.status} — ${url}`)
      return null
    }
    return await res.text()
  } catch (err) {
    console.warn(`  [capital] Fetch error: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

function parseNumber(text: string | undefined): number | undefined {
  if (!text) return undefined
  const clean = text.replace(/[$,\s]/g, '').replace(/[Kk]$/, '000').replace(/[Mm]$/, '000000')
  const n = parseFloat(clean)
  return isNaN(n) ? undefined : n
}

// ─── Craigslist parser ────────────────────────────────────────────────────────

function parseCraigslistListings(html: string, query: string): RawBusinessListing[] {
  const $ = cheerio.load(html)
  const results: RawBusinessListing[] = []

  // Craigslist 2024+ structure: ol.cl-static-search-result > li.cl-search-result
  // Fallback to older selectors for compatibility
  const items = $('li.cl-search-result').length > 0
    ? $('li.cl-search-result')
    : $('.result-row, li[data-pid]')

  items.each((_: number, el: unknown) => {
    try {
      const item = $(el)

      // New structure: anchor with data-id, title in .label or direct text
      const anchor = item.find('a.cl-app-anchor, a[data-id], .result-title, a.titlestring').first()
      const name = (item.find('.label, .result-title').first().text() || anchor.text()).trim()
      if (!name || name.length < 5) return

      const href = anchor.attr('href') ?? item.find('a').first().attr('href') ?? ''
      if (!href) return

      const sourceUrl = href.startsWith('http') ? href : `https://newyork.craigslist.org${href}`

      // New structure: location in .meta, old: .result-hood
      const location = item.find('.meta, .result-hood, [class*="location"]').first()
        .text().replace(/[()·]/g, '').trim().split('\n')[0].trim() || 'New York area'

      const allText = item.text()
      if (!isAuthentic(allText + name)) return

      const priceEl = item.find('.priceinfo, .result-price, [class*="price"]').first()
      const askingPrice = parseNumber(priceEl.text().trim())

      // Use data-id or derive from href
      const externalId = anchor.attr('data-id') ?? item.attr('data-pid')
        ?? href.replace(/[^a-z0-9]/gi, '_').slice(-80)

      results.push({
        opportunity_type: 'capital_injection',
        name,
        description: `Capital/equity partner sought — "${query}". Craigslist listing in ${location}.`,
        location,
        source_url: sourceUrl,
        source_platform: 'craigslist',
        external_id: externalId,
        asking_price: askingPrice,
        business_type: 'unknown',
      })
    } catch {
      // Skip
    }
  })

  return results.slice(0, 10)
}

// ─── BizBuySell capital-injection parser ─────────────────────────────────────

function parseBizBuySellCapital(html: string, type: string): RawBusinessListing[] {
  const $ = cheerio.load(html)
  const results: RawBusinessListing[] = []

  const cardSelectors = ['.listing-item', '[class*="listing-item"]', '.result', 'article']
  let cards = $()
  for (const sel of cardSelectors) {
    const found = $(sel)
    if (found.length > 0) { cards = found; break }
  }

  cards.each((_: number, el: unknown) => {
    try {
      const card = $(el)
      const titleEl = card.find('h3, h4, [class*="title"], a[href*="/business/"]').first()
      const name = titleEl.text().trim()
      if (!name || name.length < 3) return

      const href = card.find('a[href*="/business/"]').first().attr('href') ?? ''
      if (!href) return

      const sourceUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`
      const externalId = href.replace(/[^a-z0-9]/gi, '_').slice(-80)
      const location = card.find('[class*="location"], [class*="city"]').first().text().trim() || 'New York / NJ'
      const allText = card.text()

      if (!isAuthentic(allText + name)) return

      const askingMatch = allText.match(/(?:asking|price)[:\s]*\$?([\d,]+[KkMm]?)/i)
      const cfMatch = allText.match(/(?:cash\s*flow|sde|profit)[:\s]*\$?([\d,]+[KkMm]?)/i)

      const askingPrice = parseNumber(askingMatch?.[1])
      const cashFlow = parseNumber(cfMatch?.[1])

      // For capital injection, filter to smaller deals ($20k–$200k equity needed)
      if (askingPrice && askingPrice > 1_000_000) return

      const description = card.find('p, [class*="description"]').first().text().trim().slice(0, 400)
        || `${name} — seeking equity partner / capital injection`

      results.push({
        opportunity_type: 'capital_injection',
        name,
        description,
        location,
        source_url: sourceUrl,
        source_platform: 'bizbuysell_capital',
        external_id: externalId,
        asking_price: askingPrice,
        cash_flow_annual: cashFlow,
        business_type: type,
      })
    } catch {
      // Skip
    }
  })

  return results.slice(0, 10)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeCapitalOpportunities(): Promise<RawBusinessListing[]> {
  console.log('[wealth:capital] Starting capital injection scan...')
  const all: RawBusinessListing[] = []

  // 1. Craigslist partner/investor searches
  for (const search of CRAIGSLIST_SEARCHES) {
    const html = await fetchPage(search.url)
    if (html) {
      const results = parseCraigslistListings(html, search.query)
      console.log(`  → Craigslist [${search.query}]: ${results.length} listings`)
      all.push(...results)
    }
    await delay(1000 + Math.random() * 500)
  }

  // 2. BizBuySell partner/capital keyword searches
  for (const search of BIZBUYSELL_CAPITAL_SEARCHES) {
    const html = await fetchPage(search.url)
    if (html) {
      const results = parseBizBuySellCapital(html, search.type)
      console.log(`  → BizBuySell capital [${search.type}]: ${results.length} listings`)
      all.push(...results)
    }
    await delay(1500 + Math.random() * 500)
  }

  // Dedup
  const seen = new Set<string>()
  const unique = all.filter((l) => {
    const key = `${l.source_platform}::${l.external_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`[wealth:capital] Done — ${unique.length} capital opportunities found`)
  return unique
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
