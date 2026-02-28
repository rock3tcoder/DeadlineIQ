import { createHash } from 'crypto'
import * as cheerio from 'cheerio'
import db from './db.js'
import { analyzeSnapshot } from './ai.js'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Source {
  id: string
  name: string
  source_type: string
  platform_tag: string
  jurisdiction: string
  scrape_urls: string[]
}

interface Snapshot {
  id: string
  content_hash: string
  raw_content: string
  version_number: number
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Download a page and return its raw HTML. */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; DeadlineIQ-Bot/1.0; +https://deadlineiq.com/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(30_000), // 30s timeout
    })

    if (!res.ok) {
      console.warn(`  [fetch] ${res.status} ${res.statusText} — ${url}`)
      return null
    }

    return await res.text()
  } catch (err) {
    console.warn(`  [fetch] Error fetching ${url}:`, err instanceof Error ? err.message : err)
    return null
  }
}

/** Extract meaningful text from HTML — strips nav, scripts, styles. */
function extractText(html: string): string {
  const $ = cheerio.load(html)

  // Remove noise elements
  $('script, style, nav, header, footer, noscript, iframe').remove()

  // Get body text, collapse whitespace
  const text = $('body').text().replace(/\s+/g, ' ').trim()
  return text
}

/** SHA-256 hash of a string. */
function hashContent(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/** Get the most recent snapshot for a source + URL pair. */
async function getLastSnapshot(sourceId: string, url: string): Promise<Snapshot | null> {
  const { data, error } = await db
    .from('scrape_snapshots')
    .select('id, content_hash, raw_content, version_number')
    .eq('source_id', sourceId)
    .eq('url', url)
    .order('scraped_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`  [db] Failed to fetch last snapshot for ${url}:`, error.message)
    return null
  }

  return data
}

/** Save a new snapshot to the DB and return its ID. */
async function saveSnapshot(
  sourceId: string,
  url: string,
  contentHash: string,
  rawContent: string,
  versionNumber: number
): Promise<string | null> {
  const { data, error } = await db
    .from('scrape_snapshots')
    .insert({
      source_id: sourceId,
      url,
      content_hash: contentHash,
      raw_content: rawContent,
      version_number: versionNumber,
    })
    .select('id')
    .single()

  if (error) {
    console.error(`  [db] Failed to save snapshot for ${url}:`, error.message)
    return null
  }

  return data.id
}

// ─────────────────────────────────────────────
// Main scrape function — one URL
// ─────────────────────────────────────────────
async function scrapeUrl(source: Source, url: string): Promise<void> {
  console.log(`  → ${url}`)

  const html = await fetchPage(url)
  if (!html) return

  const text = extractText(html)
  if (!text || text.length < 100) {
    console.warn(`  [skip] Content too short or empty — ${url}`)
    return
  }

  const hash = hashContent(text)
  const last = await getLastSnapshot(source.id, url)

  if (last && last.content_hash === hash) {
    console.log(`  [unchanged] ${source.name}`)
    return
  }

  // Content is new or changed — save a snapshot
  const nextVersion = last ? last.version_number + 1 : 1
  const snapshotId = await saveSnapshot(source.id, url, hash, text, nextVersion)

  if (!snapshotId) return

  if (last) {
    console.log(`  [changed] v${nextVersion} saved — ${source.name}`)
  } else {
    console.log(`  [new] First snapshot saved — ${source.name}`)
  }

  // Only run AI analysis on genuine changes (not first snapshots)
  // First snapshots establish a baseline — no "change" to summarize yet
  if (last) {
    await analyzeSnapshot(
      source,
      snapshotId,
      text,
      last.raw_content,
      url,
    )
  }
}

// ─────────────────────────────────────────────
// Scrape one source (all its URLs)
// ─────────────────────────────────────────────
export async function scrapeSource(source: Source): Promise<void> {
  console.log(`\n[source] ${source.name} (${source.scrape_urls.length} URL(s))`)

  if (source.scrape_urls.length === 0) {
    console.log(`  [skip] No URLs configured`)
    return
  }

  for (const url of source.scrape_urls) {
    await scrapeUrl(source, url)
    // Small delay between URLs on the same source to be polite
    await new Promise((r) => setTimeout(r, 1_500))
  }
}

// ─────────────────────────────────────────────
// Run all active sources
// ─────────────────────────────────────────────
export async function runScraper(): Promise<void> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[scraper] Run started at ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  const { data: sources, error } = await db
    .from('sources')
    .select('id, name, source_type, platform_tag, jurisdiction, scrape_urls')
    .eq('is_active', true)
    .order('source_type')
    .order('name')

  if (error) {
    console.error('[scraper] Failed to load sources:', error.message)
    return
  }

  if (!sources || sources.length === 0) {
    console.log('[scraper] No active sources found — nothing to do.')
    return
  }

  console.log(`[scraper] Found ${sources.length} active source(s)`)

  for (const source of sources as Source[]) {
    await scrapeSource(source)
    // Polite delay between sources
    await new Promise((r) => setTimeout(r, 2_000))
  }

  console.log(`\n[scraper] Run complete at ${new Date().toISOString()}`)
}
