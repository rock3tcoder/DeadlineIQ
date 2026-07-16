import { redirect } from 'next/navigation'
import { Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SourceManager } from '@/components/dashboard/source-manager'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import type { Source } from '@/types'

export default async function MarketsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: allSources }, { data: userSources }, { data: profile }] = await Promise.all([
    supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)
      .order('source_type')
      .order('name'),
    supabase.from('user_sources').select('source_id').eq('user_id', user.id),
    supabase.from('users').select('plan, subscription_status, trial_ends_at').eq('id', user.id).single(),
  ])

  const subscribedIds = (userSources ?? []).map((r: { source_id: string }) => r.source_id)

  const isTrialing =
    !profile?.plan ||
    profile?.subscription_status === 'trialing' ||
    profile?.subscription_status === null

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-white heading-tighter mb-1">My Sources</h1>
        <p className="text-label-secondary text-sm">
          Select the platforms and tax authorities you want to monitor. Changes are
          saved automatically.
        </p>
      </header>

      {/* Trial banner */}
      {isTrialing && (
        <div className="flex items-start gap-3 rounded-2xl border border-sys-blue/20 bg-sys-blue/5 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-sys-blue" />
          <p className="text-sm text-sys-blue/90">
            <span className="font-semibold">Free trial — full access.</span> All 20
            sources are available during your trial. After subscribing, access depends on
            your plan.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <DisclaimerBanner compact />

      {/* Plan reference */}
      <div className="glass rounded-2xl overflow-hidden shadow-apple-sm">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-label-quaternary">
            What&apos;s included per plan
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          {[
            {
              name: 'Single Platform — $49/mo',
              detail: '1 platform (Amazon, Shopify, or TikTok)',
            },
            {
              name: 'Multi-Platform + Federal — $99/mo',
              detail: 'All 3 platforms + IRS federal sources',
            },
            {
              name: 'Full Coverage — $149/mo',
              detail: 'All platforms + federal + all 15 state sources',
            },
          ].map(({ name, detail }) => (
            <div key={name} className="px-4 py-3">
              <p className="text-xs font-medium text-label-primary">{name}</p>
              <p className="text-xs text-label-tertiary mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Source manager */}
      <SourceManager
        sources={(allSources ?? []) as Source[]}
        subscribedIds={subscribedIds}
        userId={user.id}
      />
    </div>
  )
}
