'use client'

import { useState } from 'react'
import { Check, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/stripe'
import type { PlanKey } from '@/lib/stripe'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────
function PlanCard({
  planKey,
  currentPlan,
  onUpgrade,
  loadingPlan,
}: {
  planKey: PlanKey
  currentPlan: string | null
  onUpgrade: (plan: PlanKey) => void
  loadingPlan: PlanKey | null
}) {
  const plan = PLANS[planKey]
  const isActive = currentPlan === planKey
  const isLoading = loadingPlan === planKey

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-5 transition-colors',
        isActive
          ? 'border-blue-500/40 bg-blue-500/5'
          : 'border-slate-800 bg-slate-900'
      )}
    >
      {isActive && (
        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-blue-600/20 px-2.5 py-1">
          <Check size={11} className="text-blue-400" />
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">
            Current plan
          </span>
        </div>
      )}

      <div className="mb-4 pr-24">
        <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
      </div>

      <div className="mb-4">
        <span className="text-2xl font-bold text-white">{plan.price}</span>
        <span className="text-slate-500 text-sm ml-1">/mo</span>
      </div>

      <ul className="flex-1 space-y-2 mb-5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-slate-400">
            <Check size={12} className="mt-0.5 shrink-0 text-blue-400" />
            {feature}
          </li>
        ))}
      </ul>

      {isActive ? (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-slate-700 text-slate-400 cursor-default"
          disabled
        >
          Active
        </Button>
      ) : (
        <Button
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white"
          onClick={() => onUpgrade(planKey)}
          disabled={isLoading || loadingPlan !== null}
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : currentPlan ? (
            'Switch plan'
          ) : (
            'Subscribe'
          )}
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
interface BillingPlansProps {
  currentPlan: string | null
  subscriptionStatus: string | null
  hasStripeCustomer: boolean
  trialEndsAt: string | null
}

export function BillingPlans({
  currentPlan,
  subscriptionStatus,
  hasStripeCustomer,
  trialEndsAt,
}: BillingPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleUpgrade = async (planKey: PlanKey) => {
    setLoadingPlan(planKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Something went wrong. Please try again.')
        setLoadingPlan(null)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setLoadingPlan(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Something went wrong. Please try again.')
        setPortalLoading(false)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setPortalLoading(false)
    }
  }

  const isTrialing =
    !currentPlan || subscriptionStatus === 'trialing' || subscriptionStatus === null

  const trialEndFormatted = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {isTrialing ? (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">Free trial active.</span>{' '}
            {trialEndFormatted
              ? `Full access until ${trialEndFormatted}. Subscribe before then to keep monitoring.`
              : 'Full access during your trial. Subscribe to keep monitoring after it ends.'}
          </p>
        </div>
      ) : subscriptionStatus === 'past_due' ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-300">
            <span className="font-semibold">Payment past due.</span> Update your payment method
            to restore access.
          </p>
        </div>
      ) : subscriptionStatus === 'active' ? (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
          <p className="text-sm text-green-300">
            <span className="font-semibold">Subscription active.</span> You have full access to
            all features in your plan.
          </p>
        </div>
      ) : null}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(PLANS) as PlanKey[]).map((key) => (
          <PlanCard
            key={key}
            planKey={key}
            currentPlan={currentPlan}
            onUpgrade={handleUpgrade}
            loadingPlan={loadingPlan}
          />
        ))}
      </div>

      {/* Manage billing portal */}
      {hasStripeCustomer && (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-200">Billing portal</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your payment method, view invoices, or cancel your subscription.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-slate-700 text-slate-300 hover:text-white ml-4"
            onClick={handlePortal}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <ExternalLink size={13} className="mr-1.5" />
                Manage
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
