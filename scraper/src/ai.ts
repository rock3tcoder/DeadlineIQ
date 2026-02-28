import OpenAI from 'openai'
import db from './db.js'
import { sendInstantAlert } from './email.js'

if (!process.env.OPENAI_API_KEY) {
  console.warn('[ai] OPENAI_API_KEY not set — AI analysis will be skipped.')
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Source {
  id: string
  name: string
  source_type: string
  platform_tag: string
  jurisdiction: string
}

interface UpdateAnalysis {
  is_relevant: boolean           // false = skip (e.g. only a nav or style change)
  title: string
  summary: string                // Informational only — cites source
  urgency_level: 'informational' | 'policy_change' | 'deadline_based' | 'high_urgency'
  urgency_reason: string
  action_items: string[]         // Non-directive language only
  industry_tag: 'amazon' | 'shopify' | 'tiktok' | 'tax_federal' | 'tax_state' | 'general'
  effective_date: string | null  // ISO date YYYY-MM-DD or null
  deadline_date: string | null
  publication_date: string | null
  relevance_score: number        // 0.00 – 1.00
}

// ─────────────────────────────────────────────
// Industry tag mapping (source platform_tag → update industry_tag)
// ─────────────────────────────────────────────
const INDUSTRY_TAG_MAP: Record<string, string> = {
  amazon: 'amazon',
  shopify: 'shopify',
  tiktok: 'tiktok',
  irs: 'tax_federal',
  state_tax: 'tax_state',
  general: 'general',
}

// ─────────────────────────────────────────────
// Build the prompt
// ─────────────────────────────────────────────
function buildPrompt(source: Source, newContent: string, previousContent: string | null): string {
  const today = new Date().toISOString().split('T')[0]
  const contentPreview = newContent.slice(0, 6000) // keep tokens reasonable
  const prevPreview = previousContent ? previousContent.slice(0, 3000) : null

  return `You are an analyst for DeadlineIQ, a service that monitors e-commerce platform policies and tax regulatory pages on behalf of online sellers and small businesses.

Today's date: ${today}
Source name: ${source.name}
Source type: ${source.source_type}
Platform/tag: ${source.platform_tag}
Jurisdiction: ${source.jurisdiction}

LEGAL REQUIREMENT — CRITICAL:
- This platform is INFORMATIONAL ONLY. It does not provide legal or tax advice.
- Every summary MUST use non-directive language: "According to [source]..." or "The page indicates..."
- NEVER say "you must", "you are required to", "you need to", or any directive phrasing.
- Action items must be framed as things to be AWARE OF, not instructions.

---
CURRENT PAGE CONTENT (new):
${contentPreview}
---
${prevPreview ? `PREVIOUS PAGE CONTENT (for comparison):\n${prevPreview}\n---` : 'No previous version available (first snapshot).'}

Analyze this content and return a JSON object with EXACTLY these fields:

{
  "is_relevant": true or false,
  "title": "Short descriptive title (max 12 words)",
  "summary": "2–3 sentences. Must start with 'According to [source name],...'. Informational only.",
  "urgency_level": one of: "informational" | "policy_change" | "deadline_based" | "high_urgency",
  "urgency_reason": "One sentence explaining the urgency classification.",
  "action_items": ["Array of 1–4 items. Use 'Sellers may want to review...', 'It may be worth noting...', etc. Non-directive."],
  "industry_tag": one of: "amazon" | "shopify" | "tiktok" | "tax_federal" | "tax_state" | "general",
  "effective_date": "YYYY-MM-DD or null",
  "deadline_date": "YYYY-MM-DD or null",
  "publication_date": "YYYY-MM-DD or null",
  "relevance_score": number between 0.00 and 1.00
}

Urgency guide:
- "informational": General info, no action needed, no date sensitivity
- "policy_change": Platform or tax rule has changed or is changing
- "deadline_based": Filing deadline or compliance date is involved
- "high_urgency": Immediate or very near-term deadline (within 30 days), or significant fee/penalty change

Set is_relevant to false ONLY if the change is trivially cosmetic (cookie banner, nav restructure, typo fix) with zero policy or tax content.

Return ONLY the JSON object — no markdown, no explanation.`
}

// ─────────────────────────────────────────────
// Parse + validate OpenAI response
// ─────────────────────────────────────────────
function parseAnalysis(raw: string): UpdateAnalysis | null {
  try {
    const parsed = JSON.parse(raw) as UpdateAnalysis

    // Basic validation
    const validUrgency = ['informational', 'policy_change', 'deadline_based', 'high_urgency']
    const validIndustry = ['amazon', 'shopify', 'tiktok', 'tax_federal', 'tax_state', 'general']

    if (!validUrgency.includes(parsed.urgency_level)) {
      parsed.urgency_level = 'informational'
    }
    if (!validIndustry.includes(parsed.industry_tag)) {
      parsed.industry_tag = 'general'
    }
    if (typeof parsed.relevance_score !== 'number') {
      parsed.relevance_score = 0.5
    }
    parsed.relevance_score = Math.min(1, Math.max(0, parsed.relevance_score))
    if (!Array.isArray(parsed.action_items)) {
      parsed.action_items = []
    }

    return parsed
  } catch {
    console.error('[ai] Failed to parse OpenAI response as JSON')
    return null
  }
}

// ─────────────────────────────────────────────
// Save an update to the DB
// ─────────────────────────────────────────────
async function saveUpdate(
  source: Source,
  snapshotId: string,
  analysis: UpdateAnalysis,
  sourceUrl: string,
  fullTextSnapshot: string,
): Promise<void> {
  const industryTag = INDUSTRY_TAG_MAP[source.platform_tag] ?? 'general'

  const { error } = await db.from('updates').insert({
    source_id: source.id,
    snapshot_id: snapshotId,
    title: analysis.title,
    summary: analysis.summary,
    full_text_snapshot: fullTextSnapshot.slice(0, 50_000), // cap storage
    action_items: analysis.action_items,
    urgency_level: analysis.urgency_level,
    urgency_reason: analysis.urgency_reason,
    jurisdiction: source.jurisdiction,
    industry_tag: industryTag,
    effective_date: analysis.effective_date ?? null,
    deadline_date: analysis.deadline_date ?? null,
    publication_date: analysis.publication_date ?? null,
    source_url: sourceUrl,
    relevance_score: analysis.relevance_score,
  })

  if (error) {
    console.error(`  [ai] Failed to save update:`, error.message)
    return
  }

  console.log(`  [ai] Update saved — "${analysis.title}" (${analysis.urgency_level})`)

  // Send instant email alert to subscribers
  await sendInstantAlert(
    {
      id: '',
      title: analysis.title,
      summary: analysis.summary,
      urgency_level: analysis.urgency_level,
      action_items: analysis.action_items,
      source_url: sourceUrl,
      deadline_date: analysis.deadline_date ?? null,
      effective_date: analysis.effective_date ?? null,
    },
    source
  )
}

// ─────────────────────────────────────────────
// Main export — analyze a snapshot
// ─────────────────────────────────────────────
export async function analyzeSnapshot(
  source: Source,
  snapshotId: string,
  newContent: string,
  previousContent: string | null,
  sourceUrl: string,
): Promise<void> {
  if (!openai) {
    console.log('  [ai] Skipped — OPENAI_API_KEY not configured')
    return
  }

  console.log(`  [ai] Analyzing with gpt-4o-mini...`)

  const prompt = buildPrompt(source, newContent, previousContent)

  let raw: string
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2, // low temperature = consistent, factual output
      max_tokens: 800,
    })
    raw = response.choices[0]?.message?.content ?? ''
  } catch (err) {
    console.error('  [ai] OpenAI API error:', err instanceof Error ? err.message : err)
    return
  }

  const analysis = parseAnalysis(raw)
  if (!analysis) return

  if (!analysis.is_relevant) {
    console.log(`  [ai] Not relevant (cosmetic change) — skipped`)
    return
  }

  await saveUpdate(source, snapshotId, analysis, sourceUrl, newContent)
}
