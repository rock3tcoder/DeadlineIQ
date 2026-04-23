/**
 * NYC job listings scraper
 *
 * Targets roles paying $250k+ total comp:
 *  - Private Equity Associate / Senior Associate
 *  - Growth Equity, Private Credit, IB Associate
 *  - Family Office, Corp Dev, Strategic Finance
 *  - Search fund / acquisition roles
 *
 * Sources: Indeed RSS, LinkedIn Jobs (public), Greenhouse job boards
 */

import * as cheerio from 'cheerio'
import type { RawJobListing } from './types.js'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Indeed RSS feeds — public and parseable
const INDEED_RSS_FEEDS = [
  {
    url: 'https://rss.indeed.com/rss?q=private+equity+associate&l=New+York+City%2C+NY&sort=date',
    role_type: 'PE Associate',
  },
  {
    url: 'https://rss.indeed.com/rss?q=private+equity+senior+associate&l=New+York+City%2C+NY&sort=date',
    role_type: 'PE Senior Associate',
  },
  {
    url: 'https://rss.indeed.com/rss?q=growth+equity+associate&l=New+York+City%2C+NY&sort=date',
    role_type: 'Growth Equity',
  },
  {
    url: 'https://rss.indeed.com/rss?q=private+credit+associate&l=New+York+City%2C+NY&sort=date',
    role_type: 'Private Credit',
  },
  {
    url: 'https://rss.indeed.com/rss?q=investment+banking+associate&l=New+York+City%2C+NY&sort=date',
    role_type: 'IB Associate',
  },
  {
    url: 'https://rss.indeed.com/rss?q=corporate+development+associate&l=New+York+City%2C+NY&sort=date',
    role_type: 'Corp Dev',
  },
  {
    url: 'https://rss.indeed.com/rss?q=family+office+investment&l=New+York+City%2C+NY&sort=date',
    role_type: 'Family Office',
  },
  {
    url: 'https://rss.indeed.com/rss?q=venture+capital+associate&l=New+York+City%2C+NY&sort=date',
    role_type: 'VC Associate',
  },
  {
    url: 'https://rss.indeed.com/rss?q=hedge+fund+analyst+investment&l=New+York+City%2C+NY&sort=date',
    role_type: 'Hedge Fund',
  },
]

// LinkedIn public job search pages (no auth required for basic results)
const LINKEDIN_SEARCHES = [
  {
    url: 'https://www.linkedin.com/jobs/search/?keywords=private%20equity%20associate&location=New%20York%20City%20Metropolitan%20Area&f_TPR=r86400&f_SB2=2',
    role_type: 'PE Associate',
  },
  {
    url: 'https://www.linkedin.com/jobs/search/?keywords=investment%20banking%20associate&location=New%20York%20City%20Metropolitan%20Area&f_TPR=r86400',
    role_type: 'IB Associate',
  },
  {
    url: 'https://www.linkedin.com/jobs/search/?keywords=private%20credit%20associate&location=New%20York%20City%20Metropolitan%20Area&f_TPR=r604800',
    role_type: 'Private Credit',
  },
]

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function fetchUrl(url: string): Promise<string | null> {
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
      console.warn(`  [jobs] HTTP ${res.status} — ${url}`)
      return null
    }
    return await res.text()
  } catch (err) {
    console.warn(`  [jobs] Fetch error: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

// ─── Comp range estimator based on role type and seniority ───────────────────

function estimateComp(
  title: string,
  roleType: string
): { low: number; high: number } {
  const t = (title + ' ' + roleType).toLowerCase()

  if (t.includes('managing director') || t.includes(' md ')) return { low: 500_000, high: 1_000_000 }
  if (t.includes('vp') || t.includes('vice president')) return { low: 350_000, high: 600_000 }
  if (t.includes('senior') && (t.includes('associate') || t.includes('analyst'))) return { low: 250_000, high: 400_000 }
  if (t.includes('principal')) return { low: 300_000, high: 500_000 }
  if (t.includes('associate') && (t.includes('private equity') || t.includes('growth equity') || t.includes('private credit'))) return { low: 200_000, high: 350_000 }
  if (t.includes('associate') && t.includes('investment banking')) return { low: 175_000, high: 300_000 }
  if (t.includes('associate') && t.includes('corporate development')) return { low: 150_000, high: 250_000 }
  if (t.includes('family office')) return { low: 175_000, high: 350_000 }
  if (t.includes('hedge fund') || t.includes('asset management')) return { low: 200_000, high: 400_000 }
  if (t.includes('analyst')) return { low: 120_000, high: 200_000 }

  // Default for finance roles
  return { low: 175_000, high: 300_000 }
}

// ─── Parse Indeed RSS feed ────────────────────────────────────────────────────

function parseIndeedRSS(xml: string, roleType: string): RawJobListing[] {
  const $ = cheerio.load(xml, { xmlMode: true })
  const results: RawJobListing[] = []

  $('item').each((_: number, el: unknown) => {
    try {
      const item = $(el)
      const title = item.find('title').first().text().trim()
      const link = item.find('link').first().text().trim() || item.find('guid').text().trim()
      const description = item.find('description').text().replace(/<[^>]+>/g, ' ').trim()
      const pubDate = item.find('pubDate').text().trim()

      if (!title || !link) return

      // Skip clearly junior roles (intern, coordinator, etc.)
      const lower = title.toLowerCase()
      if (
        lower.includes('intern') ||
        lower.includes('coordinator') ||
        lower.includes('assistant') ||
        lower.includes('receptionist')
      ) return

      // Extract firm from title ("Title at Firm" or "Firm - Title")
      let firm = 'Unknown Firm'
      let jobTitle = title
      const atMatch = title.match(/^(.+?)\s+at\s+(.+)$/i)
      const dashMatch = title.match(/^(.+?)\s+[-–]\s+(.+)$/)
      if (atMatch) {
        jobTitle = atMatch[1].trim()
        firm = atMatch[2].trim()
      } else if (dashMatch) {
        firm = dashMatch[1].trim()
        jobTitle = dashMatch[2].trim()
      }

      const comp = estimateComp(jobTitle, roleType)
      const externalId = link.replace(/[^a-z0-9]/gi, '_').slice(-100)

      const listingDate = pubDate
        ? new Date(pubDate).toISOString().split('T')[0]
        : undefined

      results.push({
        opportunity_type: 'job',
        name: `${firm} — ${jobTitle}`,
        firm_name: firm,
        job_title: jobTitle,
        description: description.slice(0, 600),
        location: 'New York, NY',
        source_url: link,
        source_platform: 'indeed',
        external_id: externalId,
        estimated_comp_low: comp.low,
        estimated_comp_high: comp.high,
        listing_date: listingDate,
      })
    } catch {
      // Skip malformed items
    }
  })

  return results.slice(0, 10)
}

// ─── Parse LinkedIn job listings (HTML) ──────────────────────────────────────

function parseLinkedInJobs(html: string, roleType: string): RawJobListing[] {
  const $ = cheerio.load(html)
  const results: RawJobListing[] = []

  // LinkedIn renders results in <li> job cards
  $('li.jobs-search-results__list-item, li[class*="job-result"], [class*="job-card"]').each((_: number, el: unknown) => {
    try {
      const card = $(el)
      const jobTitle = card.find('[class*="job-card-list__title"], [class*="job-title"], h3').first().text().trim()
      const firm = card.find('[class*="job-card-container__company-name"], [class*="company-name"], h4').first().text().trim()
      const location = card.find('[class*="job-card-container__metadata-item"], [class*="location"]').first().text().trim()
      const link = card.find('a[href*="/jobs/view/"]').first().attr('href') ?? ''

      if (!jobTitle || !link) return

      const lower = jobTitle.toLowerCase()
      if (lower.includes('intern') || lower.includes('coordinator') || lower.includes('assistant')) return

      const absoluteUrl = link.startsWith('http') ? link : `https://www.linkedin.com${link}`
      const externalId = link.replace(/[^a-z0-9]/gi, '_').slice(-100)
      const comp = estimateComp(jobTitle, roleType)

      results.push({
        opportunity_type: 'job',
        name: `${firm || 'Unknown Firm'} — ${jobTitle}`,
        firm_name: firm || 'Unknown Firm',
        job_title: jobTitle,
        description: `${roleType} role at ${firm || 'a leading firm'} in NYC. ${location}`.trim(),
        location: location || 'New York, NY',
        source_url: absoluteUrl,
        source_platform: 'linkedin',
        external_id: externalId,
        estimated_comp_low: comp.low,
        estimated_comp_high: comp.high,
      })
    } catch {
      // Skip
    }
  })

  return results.slice(0, 10)
}

// ─── High-target firm direct career pages ────────────────────────────────────

const TARGET_FIRMS = [
  { name: 'KKR', url: 'https://jobs.lever.co/kkr', platform: 'lever' },
  { name: 'Apollo', url: 'https://careers.apollo.com/jobs', platform: 'greenhouse' },
  { name: 'Blackstone', url: 'https://careers.blackstone.com/jobs', platform: 'greenhouse' },
  { name: 'Carlyle', url: 'https://jobs.carlyle.com/jobs', platform: 'greenhouse' },
  { name: 'TPG', url: 'https://jobs.lever.co/tpg', platform: 'lever' },
  { name: 'Warburg Pincus', url: 'https://www.warburgpincus.com/careers/', platform: 'custom' },
  { name: 'General Atlantic', url: 'https://www.generalatlantic.com/careers/', platform: 'custom' },
]

async function scrapeTargetFirm(firm: {
  name: string
  url: string
  platform: string
}): Promise<RawJobListing[]> {
  const html = await fetchUrl(firm.url)
  if (!html) return []

  const $ = cheerio.load(html)
  const results: RawJobListing[] = []

  // Generic job listing parser — works across Lever, Greenhouse, and custom pages
  const jobSelectors = [
    '.posting-title',
    '[class*="job-title"]',
    '[class*="position-title"]',
    'h3 a',
    '.jobs-list li a',
    '[data-qa="job-link"]',
  ]

  for (const sel of jobSelectors) {
    const elements = $(sel)
    if (elements.length === 0) continue

    elements.each((_: number, el: unknown) => {
      try {
        const jobTitle = $(el).text().trim()
        if (!jobTitle || jobTitle.length < 3) return

        const lower = jobTitle.toLowerCase()
        if (
          lower.includes('intern') ||
          lower.includes('software') ||
          lower.includes('engineer') ||
          lower.includes('marketing') ||
          lower.includes('hr') ||
          lower.includes('legal')
        ) return

        // We only care about investing / finance roles
        const isRelevant =
          lower.includes('associat') ||
          lower.includes('analyst') ||
          lower.includes('principal') ||
          lower.includes('director') ||
          lower.includes('vice president') ||
          lower.includes('invest') ||
          lower.includes('deal') ||
          lower.includes('origination') ||
          lower.includes('portfolio')

        if (!isRelevant) return

        const href = $(el).attr('href') ?? $(el).closest('a').attr('href') ?? ''
        const sourceUrl = href.startsWith('http') ? href : `${new URL(firm.url).origin}${href}`
        const externalId = (`${firm.name}_${jobTitle}`).replace(/[^a-z0-9]/gi, '_').slice(0, 100)
        const comp = estimateComp(jobTitle, 'PE Associate')

        results.push({
          opportunity_type: 'job',
          name: `${firm.name} — ${jobTitle}`,
          firm_name: firm.name,
          job_title: jobTitle,
          description: `Investment role at ${firm.name} (NYC). Sourced from firm career page.`,
          location: 'New York, NY',
          source_url: sourceUrl || firm.url,
          source_platform: `firm_${firm.platform}`,
          external_id: externalId,
          estimated_comp_low: comp.low,
          estimated_comp_high: comp.high,
        })
      } catch {
        // Skip
      }
    })
    break // Use first selector that worked
  }

  return results.slice(0, 5)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeJobs(): Promise<RawJobListing[]> {
  console.log('[wealth:jobs] Starting NYC job scan...')
  const all: RawJobListing[] = []

  // 1. Indeed RSS (most reliable)
  for (const feed of INDEED_RSS_FEEDS) {
    const xml = await fetchUrl(feed.url)
    if (xml) {
      const results = parseIndeedRSS(xml, feed.role_type)
      console.log(`  → Indeed [${feed.role_type}]: ${results.length} jobs`)
      all.push(...results)
    }
    await delay(800)
  }

  // 2. LinkedIn (may be blocked, graceful fallback)
  for (const search of LINKEDIN_SEARCHES) {
    const html = await fetchUrl(search.url)
    if (html) {
      const results = parseLinkedInJobs(html, search.role_type)
      if (results.length > 0) {
        console.log(`  → LinkedIn [${search.role_type}]: ${results.length} jobs`)
        all.push(...results)
      }
    }
    await delay(1200)
  }

  // 3. Target firm career pages
  for (const firm of TARGET_FIRMS) {
    const results = await scrapeTargetFirm(firm)
    if (results.length > 0) {
      console.log(`  → ${firm.name}: ${results.length} roles`)
      all.push(...results)
    }
    await delay(1000)
  }

  // Deduplicate by external_id
  const seen = new Set<string>()
  const unique = all.filter((j) => {
    const key = `${j.source_platform}::${j.external_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Only keep roles where estimated comp >= $200k
  const highComp = unique.filter((j) => (j.estimated_comp_high ?? 0) >= 200_000)

  console.log(`[wealth:jobs] Done — ${highComp.length} high-comp roles found`)
  return highComp
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
