import { redirect } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BillingPlans } from '@/components/dashboard/billing-plans'

interface Props {
  searchParams: Promise<{ success?: string; canceled?: string }>
}

export default async function BillingPage({ searchParams }: Props) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan, subscription_status, stripe_customer_id, trial_ends_at')
    .eq('id', user.id)
    .single()

  const params = await searchParams

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-white heading-tighter mb-1">Billing</h1>
        <p className="text-label-secondary text-sm">
          Manage your subscription and payment method.
        </p>
      </header>

      {/* Post-checkout banners */}
      {params.success && (
        <div className="flex items-center gap-3 rounded-2xl border border-sys-green/20 bg-sys-green/5 px-4 py-3">
          <CheckCircle size={15} className="shrink-0 text-sys-green" />
          <p className="text-sm" style={{ color: 'rgba(48,209,88,0.9)' }}>
            <span className="font-semibold">Subscription activated!</span> Welcome aboard — you
            now have full access to your plan.
          </p>
        </div>
      )}
      {params.canceled && (
        <div className="flex items-center gap-3 rounded-2xl glass px-4 py-3">
          <XCircle size={15} className="shrink-0 text-label-quaternary" />
          <p className="text-sm text-label-secondary">
            Checkout was canceled. You can subscribe any time below.
          </p>
        </div>
      )}

      {/* Plan cards + portal */}
      <BillingPlans
        currentPlan={profile?.plan ?? null}
        subscriptionStatus={profile?.subscription_status ?? null}
        hasStripeCustomer={!!profile?.stripe_customer_id}
        trialEndsAt={profile?.trial_ends_at ?? null}
      />
    </div>
  )
}
