// DeadlineIQ scraper — plan entitlement logic
//
// Mirrors src/lib/plans.ts in the web app and the DB policy in
// supabase/migrations/005_trials_plan_gating_reminders.sql:
//   - Paid subscription (active / trialing via Stripe / past_due grace) → purchased plan
//   - In-app free trial still running → 'business' (full access)
//   - Otherwise → no access (no emails)

export interface BillingUser {
  plan: string | null
  subscription_status: string | null
  trial_ends_at: string | null
}

const PAID_STATUSES = ['active', 'trialing', 'past_due']

const PLAN_ALLOWED_TAGS: Record<string, string[]> = {
  starter: ['amazon', 'shopify', 'tiktok'],
  pro: ['amazon', 'shopify', 'tiktok', 'irs'],
  business: ['amazon', 'shopify', 'tiktok', 'irs', 'state_tax', 'general'],
}

/** The plan whose entitlements currently apply, or null if access has lapsed. */
export function effectivePlan(user: BillingUser): string | null {
  if (user.plan && PAID_STATUSES.includes(user.subscription_status ?? '')) {
    return user.plan
  }
  if (user.trial_ends_at && new Date(user.trial_ends_at) > new Date()) {
    return 'business'
  }
  return null
}

/** Should this user receive emails about a source with the given platform tag? */
export function canReceiveForTag(user: BillingUser, platformTag: string): boolean {
  const plan = effectivePlan(user)
  if (!plan) return false
  return (PLAN_ALLOWED_TAGS[plan] ?? []).includes(platformTag)
}
