/**
 * AI Underwriter
 *
 * Uses GPT-4o to evaluate each opportunity against the owner's criteria:
 *  - H1B visa (must be passive/investor ownership)
 *  - $50k liquid capital ($20k–$50k equity preferred)
 *  - $250k+ comp target
 *  - No daily operator role
 *  - Prefers cash-flowing, boring, manager-run businesses
 */

import OpenAI from 'openai'
import type { RawListing, UnderwritingResult } from './types.js'

if (!process.env.OPENAI_API_KEY) {
  console.warn('[wealth:underwriter] OPENAI_API_KEY not set — AI grading will be skipped.')
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ─── Investor profile (injected into every prompt) ────────────────────────────

const INVESTOR_PROFILE = `
INVESTOR PROFILE:
- Background: Private Equity Associate, prior Investment Banking experience
- Strong financial modeling, diligence, and deal execution skills
- Location: U.S.-based, open to New York opportunities
- Liquid capital: $50,000
- Equity capacity: $20k–$50k preferred, can stretch to $50k
- Can use leverage: SBA loans, seller financing, earnouts, partner capital
- Compensation goal: $250k minimum, ideal $275k+, stretch $300k+

IMMIGRATION CONSTRAINT — CRITICAL:
- On H1B visa
- CANNOT work at or operate any acquired business as an employee or daily operator
- MUST be passive ownership, investor ownership, board/advisory, or silent partner
- Existing manager/operator MUST remain in place
- Flag any H1B risk in every analysis

PREFERRED BUSINESS TYPES:
Car washes, laundromats, vending routes, ATM routes, self-storage, parking lots,
home services with a manager, B2B services, franchise resales with staff,
subscription businesses, e-commerce with operators, property maintenance,
boring recession-resistant businesses.

AVOID:
Restaurants (unless exceptional), trendy/fad businesses, owner-dependent operations,
turnarounds with no clear fix, high customer concentration, MLM/crypto/scams.
`

// ─── Business underwriting prompt ─────────────────────────────────────────────

function buildBusinessPrompt(listing: RawListing): string {
  const l = listing as {
    name: string
    description: string
    location: string
    opportunity_type: string
    asking_price?: number
    revenue_annual?: number
    cash_flow_annual?: number
    staff_count?: number
    business_type?: string
    source_platform?: string
    source_url?: string
  }

  return `You are an elite private equity analyst underwriting a potential business ${l.opportunity_type === 'capital_injection' ? 'capital injection / equity buy-in' : 'acquisition'} opportunity.

${INVESTOR_PROFILE}

LISTING DATA:
- Name: ${l.name}
- Type: ${l.business_type ?? 'unknown'}
- Location: ${l.location}
- Source: ${l.source_platform} — ${l.source_url}
- Asking Price: ${l.asking_price ? `$${l.asking_price.toLocaleString()}` : 'Not listed'}
- Annual Revenue: ${l.revenue_annual ? `$${l.revenue_annual.toLocaleString()}` : 'Not listed'}
- Annual Cash Flow / SDE: ${l.cash_flow_annual ? `$${l.cash_flow_annual.toLocaleString()}` : 'Not listed'}
- Staff Count: ${l.staff_count ?? 'Unknown'}
- Description: ${l.description.slice(0, 800)}

TASK:
Underwrite this opportunity for the investor above. Return a JSON object with EXACTLY these fields:

{
  "grade": "A+" | "A" | "B" | "C",
  "ai_summary": "2-3 sentence executive summary of the opportunity and its fit",
  "ai_rationale": "Why this grade? What makes it attractive or unattractive?",
  "ai_risks": "Top 2-3 risks, including any H1B/immigration concerns",
  "ai_action_items": ["Array of 2-4 specific next steps"],
  "ai_next_step": "The single most important thing to do right now",
  "passive_possible": true | false,
  "owner_hours_per_week": number (estimated hours/week required from investor),
  "equity_needed": number (estimated equity investment in dollars, e.g. 35000),
  "financing_options": ["SBA" | "seller_note" | "earnout" | "partner" | "none"],
  "debt_service_annual": number | null (estimated annual debt service in dollars),
  "cash_on_cash_return": number | null (estimated CoC return as a percentage, e.g. 22.5),
  "risk_score": number (1=very safe, 10=very risky),
  "seller_motivation": "Brief guess at why seller is listing/seeking capital"
}

GRADING GUIDE:
- A+: Exceptional passive cash flow, strong team, clear path to close, H1B safe, ideal price/CF ratio
- A:  Strong opportunity, minor concerns, worth pursuing immediately
- B:  Decent opportunity, notable risks or unknowns, put on watchlist
- C:  Not a fit — skip (owner-dependent, H1B risk, low CF, scam signals, price too high)

If key financial data is missing, make conservative estimates based on business type and location.
If H1B compliance is a concern, grade no higher than B and flag it clearly.

Return ONLY the JSON object — no markdown, no explanation.`
}

// ─── Job underwriting prompt ──────────────────────────────────────────────────

function buildJobPrompt(listing: RawListing): string {
  const l = listing as {
    name: string
    firm_name?: string
    job_title?: string
    description: string
    location: string
    source_url?: string
    estimated_comp_low?: number
    estimated_comp_high?: number
  }

  return `You are an elite executive recruiter evaluating a job opportunity for a private equity / investment banking professional.

${INVESTOR_PROFILE}

JOB LISTING:
- Firm: ${l.firm_name ?? 'Unknown'}
- Title: ${l.job_title ?? 'Unknown'}
- Location: ${l.location}
- Estimated Comp: $${l.estimated_comp_low?.toLocaleString() ?? '?'} – $${l.estimated_comp_high?.toLocaleString() ?? '?'} total
- Source: ${l.source_url}
- Description: ${l.description.slice(0, 600)}

TASK:
Evaluate this role for the investor above. Return a JSON object with EXACTLY these fields:

{
  "grade": "A+" | "A" | "B" | "C",
  "ai_summary": "2-3 sentence summary of the role and fit",
  "ai_rationale": "Why this grade? What makes it a strong or weak fit?",
  "ai_risks": "Top 1-2 risks or concerns (H1B sponsorship availability, competition, cultural fit)",
  "ai_action_items": ["Array of 2-3 specific actions to pursue this role"],
  "ai_next_step": "The single most important action right now",
  "estimated_comp_low": number (refined estimate of total comp low, in dollars),
  "estimated_comp_high": number (refined estimate of total comp high, in dollars),
  "fit_score": number (1=terrible fit, 10=perfect fit),
  "difficulty_score": number (1=easy to land, 10=extremely competitive),
  "warm_outreach": true | false (is a warm intro strongly recommended?)
}

GRADING GUIDE:
- A+: $275k+ comp, strong fit with PE/IB background, realistic to land, NYC-based
- A:  $250k+ comp, good fit, worth applying immediately
- B:  $200k-$250k comp, decent fit, or some uncertainty on comp/sponsorship
- C:  Below $200k comp, poor fit, or very unlikely to get H1B sponsorship

Consider whether the firm typically sponsors H1B visas and note it.
Return ONLY the JSON object — no markdown, no explanation.`
}

// ─── JSON parser + validator ──────────────────────────────────────────────────

function parseUnderwriting(raw: string, type: 'business' | 'job'): UnderwritingResult | null {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned) as UnderwritingResult

    // Validate grade
    const validGrades = ['A+', 'A', 'B', 'C']
    if (!validGrades.includes(parsed.grade)) parsed.grade = 'B'

    // Validate arrays
    if (!Array.isArray(parsed.ai_action_items)) parsed.ai_action_items = []

    // Clamp scores
    if (parsed.risk_score !== undefined) {
      parsed.risk_score = Math.min(10, Math.max(1, Math.round(parsed.risk_score)))
    }
    if (parsed.fit_score !== undefined) {
      parsed.fit_score = Math.min(10, Math.max(1, Math.round(parsed.fit_score)))
    }
    if (parsed.difficulty_score !== undefined) {
      parsed.difficulty_score = Math.min(10, Math.max(1, Math.round(parsed.difficulty_score)))
    }

    return parsed
  } catch {
    console.error('[wealth:underwriter] Failed to parse AI response as JSON')
    return null
  }
}

// ─── Main underwriter ─────────────────────────────────────────────────────────

export async function underwrite(listing: RawListing): Promise<UnderwritingResult | null> {
  if (!openai) {
    // Return a placeholder grade so the listing is saved (ungraded)
    return {
      grade: 'B',
      ai_summary: 'AI underwriting skipped — OPENAI_API_KEY not configured.',
      ai_rationale: 'Manual review required.',
      ai_risks: 'Unknown — review manually.',
      ai_action_items: ['Review listing manually', 'Verify financials with broker/owner'],
      ai_next_step: 'Review this listing manually.',
    }
  }

  const isJob = listing.opportunity_type === 'job'
  const prompt = isJob ? buildJobPrompt(listing) : buildBusinessPrompt(listing)

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1000,
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const result = parseUnderwriting(raw, isJob ? 'job' : 'business')

    if (!result) return null

    console.log(
      `  [underwriter] ${listing.name} → ${result.grade} (${isJob ? `fit:${result.fit_score}` : `risk:${result.risk_score}`})`
    )
    return result
  } catch (err) {
    console.error(
      `  [underwriter] OpenAI error for "${listing.name}":`,
      err instanceof Error ? err.message : err
    )
    return null
  }
}

// ─── Batch underwrite with rate-limit protection ──────────────────────────────

export async function underwriteBatch(
  listings: RawListing[],
  delayMs = 500
): Promise<Array<{ listing: RawListing; result: UnderwritingResult | null }>> {
  const results: Array<{ listing: RawListing; result: UnderwritingResult | null }> = []

  for (const listing of listings) {
    const result = await underwrite(listing)
    results.push({ listing, result })
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return results
}
