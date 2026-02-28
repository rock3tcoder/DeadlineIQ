// DeadlineIQ — shared TypeScript types (E-commerce Policy & Tax Monitoring)

export type Plan = 'starter' | 'pro' | 'business'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'

// How urgent/important is this update
export type UrgencyLevel = 'informational' | 'policy_change' | 'deadline_based' | 'high_urgency'

// What kind of source is being monitored
export type SourceType = 'platform' | 'federal' | 'state'

// Which platform or tax category this source belongs to
export type PlatformTag = 'amazon' | 'shopify' | 'tiktok' | 'irs' | 'state_tax' | 'general'

// Industry/category tag on an update (used for filtering in dashboard)
export type IndustryTag = 'amazon' | 'shopify' | 'tiktok' | 'tax_federal' | 'tax_state' | 'general'

export interface User {
  id: string
  email: string
  full_name: string | null
  plan: Plan | null
  subscription_status: SubscriptionStatus | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

// A monitored source: an Amazon policy page, IRS page, state tax page, etc.
export interface Source {
  id: string
  name: string
  source_type: SourceType
  platform_tag: PlatformTag
  jurisdiction: string   // "Federal", "CA", "NY", "Platform"
  scrape_urls: string[]
  is_active: boolean
  created_at: string
}

// Which sources a user has chosen to monitor
export interface UserSource {
  id: string
  user_id: string
  source_id: string
  created_at: string
  source?: Source
}

// Stored content snapshot from each scrape run
export interface ScrapeSnapshot {
  id: string
  source_id: string
  url: string
  content_hash: string
  raw_content: string
  version_number: number
  scraped_at: string
}

// An AI-analyzed policy or regulatory change
// NOTE: All summaries are informational only — not legal/tax advice
export interface Update {
  id: string
  source_id: string
  snapshot_id: string | null
  title: string
  summary: string              // AI-generated, always prefixed with disclaimer
  full_text_snapshot: string | null
  action_items: string[]       // Informational only — non-directive language
  urgency_level: UrgencyLevel
  urgency_reason: string
  jurisdiction: string
  industry_tag: IndustryTag
  effective_date: string | null
  deadline_date: string | null
  publication_date: string | null
  source_url: string
  relevance_score: number
  raw_diff: string | null
  created_at: string
  source?: Source
}

// Tracks which updates a user has already read
export interface UserUpdateRead {
  id: string
  user_id: string
  update_id: string
  read_at: string
}

// Shape of what OpenAI returns after analyzing a diff
export interface AIAnalysisResult {
  is_relevant: boolean
  relevance_score: number
  title: string
  summary: string           // Must begin with "According to [source]..."
  action_items: string[]    // Must use non-directive language
  urgency_level: UrgencyLevel
  urgency_reason: string
  industry_tag: IndustryTag
  effective_date: string | null
  deadline_date: string | null
  publication_date: string | null
}

// Mandatory disclaimer — rendered in every email footer and dashboard footer
export const PLATFORM_DISCLAIMER =
  'This platform provides informational summaries of publicly available regulatory and platform updates. ' +
  'It does not provide legal, tax, or compliance advice. Users are responsible for verifying all information ' +
  'with official sources and consulting qualified professionals before taking action.'
