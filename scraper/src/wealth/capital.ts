import * as cheerio from 'cheerio'
import { upsertCapital, type WealthCapital } from './db.js'

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; DeadlineIQ-Bot/1.0; +https://deadlineiq.com/bot)',
        Accept: 'text/html,application/xhtml+xml',
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
  const lower = text.toLowerCase().trim().replace(/[$,\s]/g, '')
  const num = parseFloat(lower)
  if (isNaN(num) || num <= 0) return null
  if (lower.includes('m')) return Math.round(num * 1_000_000 * 100)
  if (lower.includes('k')) return Math.round(num * 1_000 * 100)
  return Math.round(num * 100)
}

// ─── Acquire.com — micro-SaaS and online business acquisitions ───

const ACQUIRE_URLS = [
  'https://acquire.com/marketplace?status=active&category=saas',
  'https://acquire.com/marketplace?status=active&category=ecommerce',
  'https://acquire.com/marketplace?status=active&asking_price_max=500000',
]

async function scrapeAcquire(): Promise<WealthCapital[]> {
  const results: WealthCapital[] = []

  for (const url of ACQUIRE_URLS) {
    const html = await fetchPage(url)
    if (!html) continue

    const $ = cheerio.load(html)

    $('[data-testid="listing-card"], .listing-card, article.startup, .startup-card').each(
      (_, el) => {
        const $el = $(el)
        const name = $el
          .find('[data-testid="startup-name"], .startup-name, h2, h3')
          .first()
          .text()
          .trim()
        if (!name) return

        const href = $el.find('a').first().attr('href') ?? ''
        if (!href) return
        const listingUrl = href.startsWith('http')
          ? href
          : `https://acquire.com${href}`

        const description = $el
          .find('[data-testid="description"], .description, p')
          .first()
          .text()
          .trim()

        const askingText = $el
          .find('[data-testid="asking-price"], .asking-price, [class*="price"]')
          .first()
          .text()
          .trim()

        const industryText = $el
          .find('[data-testid="category"], .category, .industry, [class*="tag"]')
          .first()
          .text()
          .trim()

        const locationText = $el
          .find('[data-testid="location"], .location')
          .first()
          .text()
          .trim()

        results.push({
          source: 'acquire',
          company_name: name,
          description: description || null,
          amount_seeking_cents: parseDollars(askingText),
          equity_pct: null,
          industry: industryText || 'SaaS',
          location: locationText || 'Remote',
          listing_url: listingUrl,
          raw_snippet: $el.text().trim().slice(0, 500),
        })
      }
    )

    await new Promise((r) => setTimeout(r, 2_500))
  }

  return results
}

// ─── Flippa — online business marketplace ───────────────────

const FLIPPA_URLS = [
  'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=content&filter%5Bproperty_type%5D%5B%5D=ecommerce&filter%5Bproperty_type%5D%5B%5D=saas&filter%5Bselling_price_max%5D=500000',
]

async function scrapeFlippa(): Promise<WealthCapital[]> {
  const results: WealthCapital[] = []

  for (const url of FLIPPA_URLS) {
    const html = await fetchPage(url)
    if (!html) continue

    const $ = cheerio.load(html)

    $('[data-testid="listing-item"], .listing-item, .auction-item').each((_, el) => {
      const $el = $(el)
      const name = $el.find('.listing-title, h2, h3').first().text().trim()
      if (!name) return

      const href = $el.find('a').first().attr('href') ?? ''
      if (!href) return
      const listingUrl = href.startsWith('http')
        ? href
        : `https://flippa.com${href}`

      const description = $el.find('.listing-description, p').first().text().trim()
      const priceText = $el
        .find('.listing-price, .price, .asking-price, [class*="price"]')
        .first()
        .text()
        .trim()

      results.push({
        source: 'flippa',
        company_name: name,
        description: description || null,
        amount_seeking_cents: parseDollars(priceText),
        equity_pct: null,
        industry: null,
        location: 'Online',
        listing_url: listingUrl,
        raw_snippet: $el.text().trim().slice(0, 500),
      })
    })

    await new Promise((r) => setTimeout(r, 2_500))
  }

  return results
}

// ─── Exported runner ─────────────────────────────────────────

export interface ScrapedCapital {
  id: string
  opportunity: WealthCapital
}

export async function scrapeCapitalOpportunities(): Promise<ScrapedCapital[]> {
  console.log('[wealth/capital] Scraping capital/equity opportunities...')
  const newOpportunities: ScrapedCapital[] = []

  const scrapers = [
    { name: 'Acquire.com', fn: scrapeAcquire },
    { name: 'Flippa', fn: scrapeFlippa },
  ]

  for (const { name, fn } of scrapers) {
    console.log(`  [${name}]`)
    try {
      const listings = await fn()
      console.log(`    found ${listings.length} listing(s)`)

      for (const opp of listings) {
        const result = await upsertCapital(opp)
        if (result?.isNew) {
          newOpportunities.push({ id: result.id, opportunity: opp })
          console.log(`    [new] ${opp.company_name}`)
        }
      }
    } catch (err) {
      console.error(`    [error] ${name}:`, err instanceof Error ? err.message : err)
    }

    await new Promise((r) => setTimeout(r, 2_000))
  }

  console.log(`[wealth/capital] Done — ${newOpportunities.length} new opportunity(ies)`)
  return newOpportunities
}
