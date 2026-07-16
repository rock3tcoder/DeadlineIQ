// ─── Opportunity classification ───────────────────────────────────────────────

export type OpportunityType = 'acquisition' | 'capital_injection' | 'job'
export type OpportunityGrade = 'A+' | 'A' | 'B' | 'C'
export type OpportunityStatus = 'new' | 'reviewed' | 'contacted' | 'passed' | 'pursuing'

// ─── Raw listings returned by scrapers (before AI underwriting) ───────────────

export interface RawBusinessListing {
  opportunity_type: 'acquisition' | 'capital_injection'
  name: string
  description: string
  location: string
  source_url: string
  source_platform: string
  external_id: string
  asking_price?: number
  revenue_annual?: number
  cash_flow_annual?: number
  staff_count?: number
  business_type?: string
  listing_date?: string
}

export interface RawJobListing {
  opportunity_type: 'job'
  name: string                // full "Firm – Title" label
  firm_name: string
  job_title: string
  description: string
  location: string
  source_url: string
  source_platform: string
  external_id: string
  estimated_comp_low?: number
  estimated_comp_high?: number
  listing_date?: string
}

export type RawListing = RawBusinessListing | RawJobListing

// ─── AI underwriting result ───────────────────────────────────────────────────

export interface UnderwritingResult {
  grade: OpportunityGrade
  ai_summary: string
  ai_rationale: string
  ai_risks: string
  ai_action_items: string[]
  ai_next_step: string
  // Business fields (populated for acquisitions / capital injections)
  passive_possible?: boolean
  owner_hours_per_week?: number
  equity_needed?: number
  financing_options?: string[]
  debt_service_annual?: number
  cash_on_cash_return?: number
  risk_score?: number
  seller_motivation?: string
  // Job fields
  estimated_comp_low?: number
  estimated_comp_high?: number
  fit_score?: number
  difficulty_score?: number
  warm_outreach?: boolean
}

// ─── Stored opportunity (DB row) ──────────────────────────────────────────────

export interface WealthOpportunity extends UnderwritingResult {
  id: string
  opportunity_type: OpportunityType
  name: string
  description: string
  location: string
  source_url: string
  source_platform: string
  external_id: string
  status: OpportunityStatus
  listing_date?: string
  found_at: string
  alert_sent_at?: string
  // Business
  asking_price?: number
  revenue_annual?: number
  cash_flow_annual?: number
  staff_count?: number
  business_type?: string
  // Job
  firm_name?: string
  job_title?: string
}
