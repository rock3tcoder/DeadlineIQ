/**
 * BizBuySell scraper
 *
 * Scrapes business-for-sale listings that match our acquisition criteria:
 *  - Asking price ≤ $500k
 *  - Preferred types: car washes, laundromats, vending, self-storage,
 *    home services, B2B services, parking, ATM routes
 *  - Locations: New York, New Jersey, Connecticut
 */

import * as cheerio from 'cheerio'
import type { RawBusinessListing } from './types.js'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const SEARCH_CONFIGS = [
  // General small businesses — NY, NJ, CT under $500k
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=&l=New+York%2C+NY&price_max=500000&cf_min=30000&p=1',
    type: 'general',
  },
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=&l=New+Jersey&price_max=500000&cf_min=30000&p=1',
    type: 'general',
  },
  {
    url: 'https://www.bizbuysell.com/businesses-for-sale/?q=&l=Connecticut&price_max=500000&cf_min=30000&p=1',
    type: 'general',
  },
  // Preferred category searches
  {
    url: 'https://www.bizbuysell.com/car-washes-for-sale/?l=New+York&price_max=500000',
    type: 'car_wash',
  },
  {
    url: 'https://www.bizbuysell.com/laundromats-for-sale/?l=New+York&price_max=500000',
    type: 'laundromat',
  },
  {
    url: 'https://www.bizbuysell.com/vending-businesses-for-sale/?l=New+York&price_max=500000',
    type: 'vending',
  },
  {
    url: 'https://www.bizbuysell.com/self-storage-businesses-for-sale/?l=New+York',
    type: 'self_storage',
  },
  {
    url: 'https://www.bizbuysell.com/parking-lots-for-sale/?l=New+York',
    type: 'parking',
  },
  {
    url: 'https://www.bizbuysell.com/home-services-businesses-for-sale/?l=New+York&price_max=500000',
    type: 'home_services',
  },
  // Empire Flippers — online/ecommerce cash-flowing businesses
  {
    url: 'https://empireflippers.com/marketplace/?business_type=content&business_type=ecommerce&monetization_type=display_ads&monetization_type=affiliate&monetization_type=ecommerce&minimum_monthly_net_profit=2500&maximum_listing_price=500000',
    type: 'online_business',
    platform: 'empireflippers',
  },
]

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      console.warn(`  [bizbuysell] HTTP ${res.status} — ${url}`)
      return null
    }
    return await res.text()
  } catch (err) {
    console.warn(`  [bizbuysell] Fetch error: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

// ─── Price / number parser ────────────────────────────────────────────────────

function parseNumber(text: string | undefined): number | undefined {
  if (!text) return undefined
  const clean = text.replace(/[$,\s]/g, '').replace(/[KkMm]$/, (s) =>
    s.toLowerCase() === 'k' ? '000' : '000000'
  )
  const n = parseFloat(clean)
  return isNaN(n) ? undefined : n
}

// ─── BizBuySell listing parser ────────────────────────────────────────────────

function parseBizBuySellListings(
  html: string,
  businessType: string,
  pageUrl: string
): RawBusinessListing[] {
  const $ = cheerio.load(html)
  const results: RawBusinessListing[] = []

  // BizBuySell listing cards — selector patterns (robust to minor HTML changes)
  const cardSelectors = [
    '.listing-item',
    '[class*="listing-item"]',
    '.result',
    '[data-testid="listing-card"]',
  ]

  let cards = $()
  for (const sel of cardSelectors) {
    const found = $(sel)
    if (found.length > 0) {
      cards = found
      break
    }
  }

  if (cards.length === 0) {
    // Fallback: try to find any anchor with /business/ in href
    $('a[href*="/business/"]').each((_: number, el: unknown) => {
      const href = $(el).attr('href')
      if (!href) return
      const absoluteUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`
      const nameEl = $(el).find('h3, h4, .title').first()
      const name = nameEl.text().trim() || $(el).text().trim()
      if (!name || name.length < 3) return

      const externalId = href.replace(/[^a-z0-9]/gi, '_').slice(0, 80)

      results.push({
        opportunity_type: 'acquisition',
        name,
        description: '',
        location: 'New York / NJ area',
        source_url: absoluteUrl,
        source_platform: 'bizbuysell',
        external_id: externalId,
        business_type: businessType,
      })
    })
    return results.slice(0, 20)
  }

  cards.each((_: number, el: unknown) => {
    try {
      const card = $(el)

      // Title / name
      const titleEl = card.find('h3, h4, .listing-name, [class*="title"], a[href*="/business/"]').first()
      const name = titleEl.text().trim()
      if (!name || name.length < 3) return

      // URL
      const linkEl = card.find('a[href*="/business/"], a[href*="/listing/"]').first()
      const href = linkEl.attr('href') ?? ''
      const sourceUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`
      if (!href) return

      // External ID from URL slug
      const externalId = href.replace(/[^a-z0-9]/gi, '_').slice(-80)

      // Location
      const locationEl = card
        .find('[class*="location"], [class*="city"], [class*="region"], .location')
        .first()
      const location = locationEl.text().trim() || 'NY / NJ area'

      // Financials — BizBuySell shows them in labeled stat blocks
      const allText = card.text()

      // Try labeled values first
      const askingMatch = allText.match(/(?:asking|price|listed)[:\s]*\$?([\d,]+(?:\.\d+)?[KkMm]?)/i)
      const revenueMatch = allText.match(/(?:revenue|gross)[:\s]*\$?([\d,]+(?:\.\d+)?[KkMm]?)/i)
      const cfMatch = allText.match(/(?:cash\s*flow|sde|ebitda|cf|profit)[:\s]*\$?([\d,]+(?:\.\d+)?[KkMm]?)/i)
      const staffMatch = allText.match(/(?:employees|staff|workers)[:\s]*(\d+)/i)

      const askingPrice = parseNumber(askingMatch?.[1])
      const revenue = parseNumber(revenueMatch?.[1])
      const cashFlow = parseNumber(cfMatch?.[1])
      const staffCount = staffMatch ? parseInt(staffMatch[1], 10) : undefined

      // Skip if asking price is wildly over budget
      if (askingPrice && askingPrice > 600_000) return

      // Description
      const descEl = card.find('[class*="description"], [class*="summary"], p').first()
      const description = descEl.text().trim().slice(0, 500) || `${name} — available for acquisition`

      results.push({
        opportunity_type: 'acquisition',
        name,
        description,
        location,
        source_url: sourceUrl,
        source_platform: 'bizbuysell',
        external_id: externalId,
        asking_price: askingPrice,
        revenue_annual: revenue,
        cash_flow_annual: cashFlow,
        staff_count: staffCount,
        business_type: businessType,
      })
    } catch {
      // Skip malformed cards
    }
  })

  return results.slice(0, 20)
}

// ─── Empire Flippers parser ───────────────────────────────────────────────────

function parseEmpireFlippersListings(html: string): RawBusinessListing[] {
  const $ = cheerio.load(html)
  const results: RawBusinessListing[] = []

  $('[class*="listing"], [class*="marketplace-item"], article').each((_: number, el: unknown) => {
    try {
      const card = $(el)
      const name = card.find('[class*="title"], h3, h4').first().text().trim()
      if (!name || name.length < 3) return

      const href = card.find('a').first().attr('href') ?? ''
      if (!href) return
      const sourceUrl = href.startsWith('http') ? href : `https://empireflippers.com${href}`
      const externalId = href.replace(/[^a-z0-9]/gi, '_').slice(-80)

      const allText = card.text()
      const priceMatch = allText.match(/(?:listing price|asking)[:\s]*\$?([\d,]+(?:\.\d+)?[KkMm]?)/i)
      const netMatch = allText.match(/(?:monthly\s*net|monthly\s*profit|net\s*profit)[:\s]*\$?([\d,]+(?:\.\d+)?[KkMm]?)/i)

      const askingPrice = parseNumber(priceMatch?.[1])
      const monthlyNet = parseNumber(netMatch?.[1])

      if (askingPrice && askingPrice > 600_000) return

      const description = card.find('p, [class*="description"]').first().text().trim().slice(0, 400)
        || `${name} — online business`

      results.push({
        opportunity_type: 'acquisition',
        name,
        description,
        location: 'Remote / Online',
        source_url: sourceUrl,
        source_platform: 'empireflippers',
        external_id: externalId,
        asking_price: askingPrice,
        cash_flow_annual: monthlyNet ? monthlyNet * 12 : undefined,
        business_type: 'online_business',
      })
    } catch {
      // Skip
    }
  })

  return results.slice(0, 15)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeBizBuySell(): Promise<RawBusinessListing[]> {
  console.log('[wealth:bizbuysell] Starting business listing scan...')
  const allListings: RawBusinessListing[] = []

  for (const config of SEARCH_CONFIGS) {
    const platform = (config as { platform?: string }).platform ?? 'bizbuysell'
    console.log(`  → Fetching ${platform}: ${config.type}`)

    const html = await fetchPage(config.url)
    if (!html) {
      await delay(2000)
      continue
    }

    const listings =
      platform === 'empireflippers'
        ? parseEmpireFlippersListings(html)
        : parseBizBuySellListings(html, config.type, config.url)

    // Override platform for empire flippers
    if (platform === 'empireflippers') {
      listings.forEach((l) => (l.source_platform = 'empireflippers'))
    }

    console.log(`    Found ${listings.length} listings`)
    allListings.push(...listings)

    // Polite delay between requests
    await delay(1500 + Math.random() * 1000)
  }

  // Deduplicate by external_id within this batch
  const seen = new Set<string>()
  const unique = allListings.filter((l) => {
    const key = `${l.source_platform}::${l.external_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`[wealth:bizbuysell] Done — ${unique.length} unique listings found`)
  return unique
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
