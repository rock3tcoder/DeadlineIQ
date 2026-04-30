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

// ─── Greenhouse JSON API — public, no auth, returns structured data ───────────

const GREENHOUSE_FIRMS = [
  { slug: 'blackstone', name: 'Blackstone' },
  { slug: 'apolloglobalmanagement', name: 'Apollo Global Management' },
  { slug: 'carlyle', name: 'The Carlyle Group' },
  { slug: 'generalatlantic', name: 'General Atlantic' },
  { slug: 'warburgpincus', name: 'Warburg Pincus' },
  { slug: 'baincapital', name: 'Bain Capital' },
  { slug: 'tpg', name: 'TPG' },
  { slug: 'brookfield', name: 'Brookfield Asset Management' },
  { slug: 'vistaequitypartners', name: 'Vista Equity Partners' },
  { slug: 'hgcapital', name: 'HG Capital' },
  { slug: 'silverlakegroup', name: 'Silver Lake' },
  { slug: 'advent', name: 'Advent International' },
  { slug: 'ares', name: 'Ares Management' },
  { slug: 'blueowl', name: 'Blue Owl Capital' },
]

const INVEST_KEYWORDS = ['associat', 'analyst', 'principal', 'vice president', 'vp', 'director', 'invest', 'deal', 'origination', 'portfolio', 'credit', 'equity', 'capital']
const SKIP_KEYWORDS = ['intern', 'software', 'engineer', 'marketing', ' hr ', 'legal', 'accountant', 'administrative', 'receptionist', 'coordinator', 'facilities']

function isFinanceRole(title: string): boolean {
  const lower = title.toLowerCase()
  return (
    !SKIP_KEYWORDS.some((k) => lower.includes(k)) &&
    INVEST_KEYWORDS.some((k) => lower.includes(k))
  )
}

async function scrapeGreenhouseJobs(slug: string, firmName: string): Promise<RawJobListing[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return []

    const data = await res.json() as { jobs?: Array<{ id: number; title: string; location: { name: string }; absolute_url: string; updated_at: string }> }
    const jobs = data.jobs ?? []

    return jobs
      .filter((j) => isFinanceRole(j.title) && j.location.name.toLowerCase().includes('new york'))
      .slice(0, 8)
      .map((j) => {
        const comp = estimateComp(j.title, 'PE Associate')
        return {
          opportunity_type: 'job' as const,
          name: `${firmName} — ${j.title}`,
          firm_name: firmName,
          job_title: j.title,
          description: `Investment role at ${firmName}, New York. Apply via Greenhouse.`,
          location: j.location.name || 'New York, NY',
          source_url: j.absolute_url,
          source_platform: 'greenhouse',
          external_id: `greenhouse_${j.id}`,
          estimated_comp_low: comp.low,
          estimated_comp_high: comp.high,
          listing_date: j.updated_at ? new Date(j.updated_at).toISOString().split('T')[0] : undefined,
        }
      })
  } catch {
    return []
  }
}

// ─── Lever JSON API — also public ────────────────────────────────────────────

const LEVER_FIRMS = [
  { slug: 'kkr', name: 'KKR' },
  { slug: 'golub-capital', name: 'Golub Capital' },
  { slug: 'hps-investment-partners', name: 'HPS Investment Partners' },
  { slug: 'starwood-capital-group', name: 'Starwood Capital' },
]

async function scrapeLeverJobs(slug: string, firmName: string): Promise<RawJobListing[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return []

    const jobs = await res.json() as Array<{ id: string; text: string; categories: { location?: string }; hostedUrl: string; createdAt: number }>

    return jobs
      .filter((j) => isFinanceRole(j.text) && (j.categories.location ?? '').toLowerCase().includes('new york'))
      .slice(0, 8)
      .map((j) => {
        const comp = estimateComp(j.text, 'PE Associate')
        return {
          opportunity_type: 'job' as const,
          name: `${firmName} — ${j.text}`,
          firm_name: firmName,
          job_title: j.text,
          description: `Investment role at ${firmName}, New York. Apply via Lever.`,
          location: j.categories.location || 'New York, NY',
          source_url: j.hostedUrl,
          source_platform: 'lever',
          external_id: `lever_${j.id}`,
          estimated_comp_low: comp.low,
          estimated_comp_high: comp.high,
          listing_date: j.createdAt ? new Date(j.createdAt).toISOString().split('T')[0] : undefined,
        }
      })
  } catch {
    return []
  }
}

// ─── eFinancialCareers HTML scraper ──────────────────────────────────────────

const EFINANCIAL_SEARCHES = [
  { url: 'https://www.efinancialcareers.com/search?q=private+equity+associate&location=New+York%2C+NY%2C+USA', role: 'PE Associate' },
  { url: 'https://www.efinancialcareers.com/search?q=investment+banking+associate&location=New+York%2C+NY%2C+USA', role: 'IB Associate' },
  { url: 'https://www.efinancialcareers.com/search?q=private+credit+associate&location=New+York%2C+NY%2C+USA', role: 'Private Credit' },
  { url: 'https://www.efinancialcareers.com/search?q=growth+equity+associate&location=New+York%2C+NY%2C+USA', role: 'Growth Equity' },
]

function parseEFinancialCareers(html: string, roleType: string): RawJobListing[] {
  const $ = cheerio.load(html)
  const results: RawJobListing[] = []

  $('[data-testid="job-card"], .job-card, [class*="JobCard"], article[class*="job"]').each((_: number, el: unknown) => {
    try {
      const card = $(el)
      const jobTitle = card.find('[data-testid="job-title"], [class*="job-title"], h2, h3').first().text().trim()
      const firm = card.find('[data-testid="company-name"], [class*="company"], [class*="employer"]').first().text().trim()
      const href = card.find('a').first().attr('href') ?? ''
      if (!jobTitle || !href) return
      if (!isFinanceRole(jobTitle)) return

      const sourceUrl = href.startsWith('http') ? href : `https://www.efinancialcareers.com${href}`
      const externalId = href.replace(/[^a-z0-9]/gi, '_').slice(-100)
      const comp = estimateComp(jobTitle, roleType)

      results.push({
        opportunity_type: 'job',
        name: `${firm || 'Finance Firm'} — ${jobTitle}`,
        firm_name: firm || 'Unknown Firm',
        job_title: jobTitle,
        description: `${roleType} opportunity in New York sourced from eFinancialCareers.`,
        location: 'New York, NY',
        source_url: sourceUrl,
        source_platform: 'efinancialcareers',
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

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeJobs(): Promise<RawJobListing[]> {
  console.log('[wealth:jobs] Starting NYC job scan...')
  const all: RawJobListing[] = []

  // 1. Greenhouse JSON API — most reliable, public, structured
  for (const firm of GREENHOUSE_FIRMS) {
    const results = await scrapeGreenhouseJobs(firm.slug, firm.name)
    if (results.length > 0) console.log(`  → Greenhouse [${firm.name}]: ${results.length} roles`)
    all.push(...results)
    await delay(500)
  }

  // 2. Lever JSON API — also public
  for (const firm of LEVER_FIRMS) {
    const results = await scrapeLeverJobs(firm.slug, firm.name)
    if (results.length > 0) console.log(`  → Lever [${firm.name}]: ${results.length} roles`)
    all.push(...results)
    await delay(500)
  }

  // 3. eFinancialCareers — finance-specific job board
  for (const search of EFINANCIAL_SEARCHES) {
    const html = await fetchUrl(search.url)
    if (html) {
      const results = parseEFinancialCareers(html, search.role)
      if (results.length > 0) console.log(`  → eFinancialCareers [${search.role}]: ${results.length} jobs`)
      all.push(...results)
    }
    await delay(1000)
  }

  // 4. Indeed RSS (try — may be blocked from cloud IPs)
  for (const feed of INDEED_RSS_FEEDS) {
    const xml = await fetchUrl(feed.url)
    if (xml) {
      const results = parseIndeedRSS(xml, feed.role_type)
      if (results.length > 0) console.log(`  → Indeed [${feed.role_type}]: ${results.length} jobs`)
      all.push(...results)
    }
    await delay(800)
  }

  // 5. LinkedIn (may be blocked, graceful fallback)
  for (const search of LINKEDIN_SEARCHES) {
    const html = await fetchUrl(search.url)
    if (html) {
      const results = parseLinkedInJobs(html, search.role_type)
      if (results.length > 0) console.log(`  → LinkedIn [${search.role_type}]: ${results.length} jobs`)
      all.push(...results)
    }
    await delay(1200)
  }

  // Deduplicate by external_id
  const seen = new Set<string>()
  const unique = all.filter((j) => {
    const key = `${j.source_platform}::${j.external_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const highComp = unique.filter((j) => (j.estimated_comp_high ?? 0) >= 200_000)
  console.log(`[wealth:jobs] Done — ${highComp.length} high-comp roles found`)
  return highComp
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
