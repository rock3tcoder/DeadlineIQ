import db from '../db.js'

// ─── Types ───────────────────────────────────────────────────

export interface WealthBusiness {
  source: string
  title: string
  description: string | null
  asking_price_cents: number | null
  revenue_cents: number | null
  cash_flow_cents: number | null
  industry: string | null
  location: string | null
  listing_url: string
  is_passive_eligible: boolean
  raw_snippet: string | null
}

export interface WealthCapital {
  source: string
  company_name: string
  description: string | null
  amount_seeking_cents: number | null
  equity_pct: number | null
  industry: string | null
  location: string | null
  listing_url: string
  raw_snippet: string | null
}

export interface WealthJob {
  source: string
  job_title: string
  company: string | null
  salary_min_cents: number | null
  salary_max_cents: number | null
  location: string | null
  description: string | null
  listing_url: string
  posted_at: string | null
  raw_snippet: string | null
}

// ─── Upsert helpers ──────────────────────────────────────────

export async function upsertBusiness(
  b: WealthBusiness
): Promise<{ id: string; isNew: boolean } | null> {
  const { data: existing } = await db
    .from('wealth_businesses')
    .select('id')
    .eq('source', b.source)
    .eq('listing_url', b.listing_url)
    .maybeSingle()

  if (existing) {
    await db
      .from('wealth_businesses')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
    return { id: existing.id, isNew: false }
  }

  const { data, error } = await db
    .from('wealth_businesses')
    .insert(b)
    .select('id')
    .single()

  if (error) {
    console.error('[wealth/db] Insert business failed:', error.message)
    return null
  }

  return { id: data.id, isNew: true }
}

export async function upsertCapital(
  c: WealthCapital
): Promise<{ id: string; isNew: boolean } | null> {
  const { data: existing } = await db
    .from('wealth_capital_opportunities')
    .select('id')
    .eq('source', c.source)
    .eq('listing_url', c.listing_url)
    .maybeSingle()

  if (existing) {
    await db
      .from('wealth_capital_opportunities')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
    return { id: existing.id, isNew: false }
  }

  const { data, error } = await db
    .from('wealth_capital_opportunities')
    .insert(c)
    .select('id')
    .single()

  if (error) {
    console.error('[wealth/db] Insert capital opp failed:', error.message)
    return null
  }

  return { id: data.id, isNew: true }
}

export async function upsertJob(
  j: WealthJob
): Promise<{ id: string; isNew: boolean } | null> {
  const { data: existing } = await db
    .from('wealth_jobs')
    .select('id')
    .eq('source', j.source)
    .eq('listing_url', j.listing_url)
    .maybeSingle()

  if (existing) return { id: existing.id, isNew: false }

  const { data, error } = await db
    .from('wealth_jobs')
    .insert(j)
    .select('id')
    .single()

  if (error) {
    console.error('[wealth/db] Insert job failed:', error.message)
    return null
  }

  return { id: data.id, isNew: true }
}

// Record a draft alert and mark the source row as alerted
export async function recordAlert(
  category: 'business' | 'capital' | 'job',
  referenceId: string,
  draftSubject: string,
  draftBodyText: string
): Promise<void> {
  const { error } = await db.from('wealth_alerts').insert({
    category,
    reference_id: referenceId,
    draft_subject: draftSubject,
    draft_body_text: draftBodyText,
  })

  if (error) {
    console.error('[wealth/db] recordAlert failed:', error.message)
    return
  }

  const table =
    category === 'business'
      ? 'wealth_businesses'
      : category === 'capital'
        ? 'wealth_capital_opportunities'
        : 'wealth_jobs'

  await db
    .from(table)
    .update({ alerted_at: new Date().toISOString() })
    .eq('id', referenceId)
}
