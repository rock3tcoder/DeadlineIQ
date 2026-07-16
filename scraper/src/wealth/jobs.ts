import * as cheerio from 'cheerio'
import { upsertJob, type WealthJob } from './db.js'

const SALARY_THRESHOLD_CENTS = 250_000 * 100

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

function parseSalaryCents(raw: string): number | null {
  if (!raw) return null
  const clean = raw.replace(/[$,\s]/g, '').toLowerCase()
  const num = parseFloat(clean)
  if (isNaN(num) || num <= 0) return null
  if (clean.endsWith('m') || clean.includes('million')) return Math.round(num * 1_000_000 * 100)
  if (clean.endsWith('k') || clean.includes('thousand')) return Math.round(num * 1_000 * 100)
  // Raw dollar figure (e.g. "300000")
  return num < 10_000 ? null : Math.round(num * 100)
}

function parseSalaryRange(text: string): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null }
  // Strip currency symbols and whitespace, then split on dash/en-dash/em-dash/to
  const clean = text.replace(/[$,\s]/g, '').toLowerCase()
  const parts = clean.split(/[-–—]|to/)
  if (parts.length >= 2) {
    return { min: parseSalaryCents(parts[0]), max: parseSalaryCents(parts[1]) }
  }
  const single = parseSalaryCents(clean)
  return { min: single, max: single }
}

// ─── BuiltIn NYC ─────────────────────────────────────────────

const BUILTIN_URLS = [
  'https://builtin.com/jobs/nyc?salaryMin=250000',
  'https://builtin.com/jobs/nyc/data/machine-learning?salaryMin=250000',
  'https://builtin.com/jobs/nyc/tech?salaryMin=250000',
  'https://builtin.com/jobs/nyc/finance?salaryMin=250000',
]

async function scrapeBuiltInNYC(): Promise<WealthJob[]> {
  const results: WealthJob[] = []

  for (const url of BUILTIN_URLS) {
    const html = await fetchPage(url)
    if (!html) continue

    const $ = cheerio.load(html)

    // BuiltIn uses several selectors across versions
    $('[data-id], .job-card, article.job, [class*="JobCard"]').each((_, el) => {
      const $el = $(el)

      const title = $el
        .find('[data-testid="job-title"], .job-title, [class*="title"], h2, h3')
        .first()
        .text()
        .trim()
      if (!title) return

      const company = $el
        .find('[data-testid="company-name"], .company-name, [class*="company"]')
        .first()
        .text()
        .trim()

      const salaryText = $el
        .find('[data-testid="salary"], .salary, .compensation, [class*="salary"]')
        .first()
        .text()
        .trim()

      const location = $el
        .find('[data-testid="location"], .location, [class*="location"]')
        .first()
        .text()
        .trim()

      const href = $el.find('a').first().attr('href') ?? ''
      if (!href) return
      const listingUrl = href.startsWith('http')
        ? href
        : `https://builtin.com${href}`

      const { min, max } = parseSalaryRange(salaryText)
      // Skip if max salary is disclosed but below threshold
      if (max !== null && max < SALARY_THRESHOLD_CENTS) return

      results.push({
        source: 'builtin_nyc',
        job_title: title,
        company: company || null,
        salary_min_cents: min,
        salary_max_cents: max,
        location: location || 'New York, NY',
        description: null,
        listing_url: listingUrl,
        posted_at: null,
        raw_snippet: $el.text().trim().slice(0, 500),
      })
    })

    await new Promise((r) => setTimeout(r, 2_500))
  }

  return results
}

// ─── The Ladders — $100k+ job board, filter NYC + $250k ──────

const LADDERS_URLS = [
  'https://www.theladders.com/jobs/search-jobs?location=New+York%2C+NY&salaryRequirement=250000',
  'https://www.theladders.com/jobs/search-jobs?location=New+York+City%2C+NY&salaryRequirement=250000',
]

async function scrapeLadders(): Promise<WealthJob[]> {
  const results: WealthJob[] = []

  for (const url of LADDERS_URLS) {
    const html = await fetchPage(url)
    if (!html) continue

    const $ = cheerio.load(html)

    $('[data-testid="job-listing"], .job-listing, article.job, [class*="JobCard"]').each(
      (_, el) => {
        const $el = $(el)

        const title = $el.find('.job-title, h2, h3').first().text().trim()
        if (!title) return

        const company = $el.find('.company-name, [class*="company"]').first().text().trim()
        const salaryText = $el.find('.salary, .compensation, [class*="salary"]').first().text().trim()
        const location = $el.find('.location, [class*="location"]').first().text().trim()

        const href = $el.find('a').first().attr('href') ?? ''
        if (!href) return
        const listingUrl = href.startsWith('http')
          ? href
          : `https://www.theladders.com${href}`

        const { min, max } = parseSalaryRange(salaryText)
        if (max !== null && max < SALARY_THRESHOLD_CENTS) return

        results.push({
          source: 'ladders',
          job_title: title,
          company: company || null,
          salary_min_cents: min,
          salary_max_cents: max,
          location: location || 'New York, NY',
          description: null,
          listing_url: listingUrl,
          posted_at: null,
          raw_snippet: $el.text().trim().slice(0, 500),
        })
      }
    )

    await new Promise((r) => setTimeout(r, 2_500))
  }

  return results
}

// ─── Exported runner ─────────────────────────────────────────

export interface ScrapedJob {
  id: string
  job: WealthJob
}

export async function scrapeJobs(): Promise<ScrapedJob[]> {
  console.log('[wealth/jobs] Scraping NYC $250k+ jobs...')
  const newJobs: ScrapedJob[] = []

  const scrapers = [
    { name: 'BuiltIn NYC', fn: scrapeBuiltInNYC },
    { name: 'The Ladders', fn: scrapeLadders },
  ]

  for (const { name, fn } of scrapers) {
    console.log(`  [${name}]`)
    try {
      const jobs = await fn()
      console.log(`    found ${jobs.length} job(s) above $250k threshold`)

      for (const job of jobs) {
        const result = await upsertJob(job)
        if (result?.isNew) {
          newJobs.push({ id: result.id, job })
          console.log(`    [new] ${job.job_title}${job.company ? ` @ ${job.company}` : ''}`)
        }
      }
    } catch (err) {
      console.error(`    [error] ${name}:`, err instanceof Error ? err.message : err)
    }

    await new Promise((r) => setTimeout(r, 2_000))
  }

  console.log(`[wealth/jobs] Done — ${newJobs.length} new job(s)`)
  return newJobs
}
