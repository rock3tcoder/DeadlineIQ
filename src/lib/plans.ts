// DeadlineIQ — plan entitlement logic (client + server + middleware safe)
//
// Mirrors the database-level rules in
// supabase/migrations/005_trials_plan_gating_reminders.sql:
//   - Paid subscription (active / trialing via Stripe / past_due grace) → purchased plan
//   - In-app free trial still running → 'business' (full access)
//   - Otherwise → no access

import type { Plan, PlatformTag } from '@/types'

export interface BillingProfile {
  plan: Plan | null
  subscription_status: string | null
  trial_ends_at: string | null
}

/** Which source platform tags each plan may subscribe to. */
export const PLAN_ALLOWED_TAGS: Record<Plan, PlatformTag[]> = {
  starter: ['amazon', 'shopify', 'tiktok'],
  pro: ['amazon', 'shopify', 'tiktok', 'irs'],
  business: ['amazon', 'shopify', 'tiktok', 'irs', 'state_tax', 'general'],
}

/** Starter is limited to a single e-commerce platform source. */
export const STARTER_PLATFORM_LIMIT = 1

const PAID_STATUSES = ['active', 'trialing', 'past_due']

/** The plan whose entitlements currently apply, or null if access has lapsed. */
export function getEffectivePlan(profile: BillingProfile): Plan | null {
  if (profile.plan && PAID_STATUSES.includes(profile.subscription_status ?? '')) {
    return profile.plan
  }
  if (profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
    return 'business'
  }
  return null
}

export function hasActiveAccess(profile: BillingProfile): boolean {
  return getEffectivePlan(profile) !== null
}

/** True while the user is on the in-app free trial (no paid subscription yet). */
export function isOnFreeTrial(profile: BillingProfile): boolean {
  return (
    !(profile.plan && PAID_STATUSES.includes(profile.subscription_status ?? '')) &&
    !!profile.trial_ends_at &&
    new Date(profile.trial_ends_at) > new Date()
  )
}

/** Whole days left on the free trial (0 = ends today), or null if not on trial. */
export function trialDaysRemaining(profile: BillingProfile): number | null {
  if (!isOnFreeTrial(profile) || !profile.trial_ends_at) return null
  const ms = new Date(profile.trial_ends_at).getTime() - Date.now()
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)))
}

export function canAccessTag(plan: Plan | null, tag: PlatformTag): boolean {
  if (!plan) return false
  return PLAN_ALLOWED_TAGS[plan].includes(tag)
}
