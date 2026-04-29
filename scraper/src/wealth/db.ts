import { createClient } from '@supabase/supabase-js'
import type { RawListing, UnderwritingResult, WealthOpportunity } from './types.js'

// Use dedicated wealth Supabase project if configured, otherwise fall back to main project
const WEALTH_URL = process.env.WEALTH_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const WEALTH_KEY = process.env.WEALTH_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const db = createClient(WEALTH_URL, WEALTH_KEY, {
  auth: { persistSession: false },
})

// ─── Check if a listing already exists (dedup) ───────────────────────────────

export async function exists(platform: string, externalId: string): Promise<boolean> {
  const { count } = await db
    .from('wealth_opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('source_platform', platform)
    .eq('external_id', externalId)
  return (count ?? 0) > 0
}

// ─── Save a new opportunity with its underwriting result ─────────────────────

export async function saveOpportunity(
  listing: RawListing,
  underwriting: UnderwritingResult,
): Promise<string | null> {
  const base = {
    opportunity_type: listing.opportunity_type,
    name: listing.name,
    description: listing.description,
    location: listing.location,
    source_url: listing.source_url,
    source_platform: listing.source_platform,
    external_id: listing.external_id,
    listing_date: listing.listing_date ?? null,
    grade: underwriting.grade,
    ai_summary: underwriting.ai_summary,
    ai_rationale: underwriting.ai_rationale,
    ai_risks: underwriting.ai_risks,
    ai_action_items: underwriting.ai_action_items,
    ai_next_step: underwriting.ai_next_step,
  }

  let extra: Record<string, unknown> = {}

  if (listing.opportunity_type === 'acquisition' || listing.opportunity_type === 'capital_injection') {
    extra = {
      asking_price: listing.asking_price ?? null,
      revenue_annual: listing.revenue_annual ?? null,
      cash_flow_annual: listing.cash_flow_annual ?? null,
      staff_count: listing.staff_count ?? null,
      business_type: listing.business_type ?? null,
      passive_possible: underwriting.passive_possible ?? null,
      owner_hours_per_week: underwriting.owner_hours_per_week ?? null,
      equity_needed: underwriting.equity_needed ?? null,
      financing_options: underwriting.financing_options ?? [],
      debt_service_annual: underwriting.debt_service_annual ?? null,
      cash_on_cash_return: underwriting.cash_on_cash_return ?? null,
      risk_score: underwriting.risk_score ?? null,
      seller_motivation: underwriting.seller_motivation ?? null,
    }
  } else {
    extra = {
      firm_name: (listing as { firm_name?: string }).firm_name ?? null,
      job_title: (listing as { job_title?: string }).job_title ?? null,
      estimated_comp_low: underwriting.estimated_comp_low ?? (listing as { estimated_comp_low?: number }).estimated_comp_low ?? null,
      estimated_comp_high: underwriting.estimated_comp_high ?? (listing as { estimated_comp_high?: number }).estimated_comp_high ?? null,
      fit_score: underwriting.fit_score ?? null,
      difficulty_score: underwriting.difficulty_score ?? null,
      warm_outreach: underwriting.warm_outreach ?? null,
    }
  }

  const { data, error } = await db
    .from('wealth_opportunities')
    .insert({ ...base, ...extra })
    .select('id')
    .single()

  if (error) {
    // Ignore duplicate violations silently
    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      console.error('[wealth:db] Insert failed:', error.message)
    }
    return null
  }

  return data.id
}

// ─── Mark that we sent an alert ───────────────────────────────────────────────

export async function markAlertSent(id: string): Promise<void> {
  await db
    .from('wealth_opportunities')
    .update({ alert_sent_at: new Date().toISOString() })
    .eq('id', id)
}

// ─── Fetch top opportunities for digest ───────────────────────────────────────

export async function fetchDigestOpportunities(since: Date): Promise<WealthOpportunity[]> {
  const { data, error } = await db
    .from('wealth_opportunities')
    .select('*')
    .gte('found_at', since.toISOString())
    .in('grade', ['A+', 'A', 'B'])
    .order('found_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[wealth:db] Digest query failed:', error.message)
    return []
  }

  return (data ?? []) as WealthOpportunity[]
}

// ─── Save outreach draft ──────────────────────────────────────────────────────

export async function saveOutreachDraft(draft: {
  opportunity_id: string
  outreach_type: 'broker' | 'owner' | 'job'
  recipient_name?: string
  recipient_email?: string
  subject: string
  body: string
  follow_up_due_at?: string
}): Promise<void> {
  const { error } = await db.from('wealth_outreach').insert(draft)
  if (error) {
    console.error('[wealth:db] Outreach insert failed:', error.message)
  }
}

// ─── Log digest send ─────────────────────────────────────────────────────────

export async function logDigest(params: {
  recipient_email: string
  subject: string
  total_opps: number
  a_plus_count: number
  a_count: number
  b_count: number
}): Promise<void> {
  await db.from('wealth_digest_log').insert(params)
}
