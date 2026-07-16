import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  TrendingUp,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────

interface WealthBusiness {
  id: string
  source: string
  title: string
  description: string | null
  asking_price_cents: number | null
  cash_flow_cents: number | null
  revenue_cents: number | null
  industry: string | null
  location: string | null
  listing_url: string
  is_passive_eligible: boolean
  first_seen_at: string
}

interface WealthCapital {
  id: string
  source: string
  company_name: string
  description: string | null
  amount_seeking_cents: number | null
  industry: string | null
  location: string | null
  listing_url: string
  first_seen_at: string
}

interface WealthJob {
  id: string
  source: string
  job_title: string
  company: string | null
  salary_min_cents: number | null
  salary_max_cents: number | null
  location: string | null
  listing_url: string
  first_seen_at: string
}

// ─── Helpers ──────────────────────────────────────────────────

function fmt(cents: number | null): string {
  if (cents === null) return '—'
  const d = cents / 100
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`
  if (d >= 1_000) return `$${(d / 1_000).toFixed(0)}K`
  return `$${d.toFixed(0)}`
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

// ─── Sub-components ───────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  count,
  color,
}: {
  icon: React.ElementType
  title: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        <Icon size={15} />
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <span className="ml-auto text-xs text-slate-500">{count} listing{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

function BusinessCard({ b }: { b: WealthBusiness }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              {b.source}
            </span>
            {b.is_passive_eligible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 px-2 py-0.5 text-[10px] font-semibold text-green-400 border border-green-800/50">
                <ShieldCheck size={10} />
                Passive-eligible
              </span>
            )}
            <span className="ml-auto text-[10px] text-slate-600">{timeAgo(b.first_seen_at)}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{b.title}</p>
          {b.location && <p className="mt-0.5 text-xs text-slate-500">{b.location}</p>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Asking', value: fmt(b.asking_price_cents) },
          { label: 'Cash Flow', value: fmt(b.cash_flow_cents) },
          { label: 'Revenue', value: fmt(b.revenue_cents) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-slate-800/60 px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-white font-mono">{value}</p>
          </div>
        ))}
      </div>

      {b.description && (
        <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">{b.description}</p>
      )}

      <div className="mt-4">
        <Link
          href={b.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View listing <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}

function CapitalCard({ c }: { c: WealthCapital }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{c.source}</span>
        <span className="text-[10px] text-slate-600">{timeAgo(c.first_seen_at)}</span>
      </div>
      <p className="text-sm font-semibold text-white leading-snug">{c.company_name}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {c.industry && (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {c.industry}
          </span>
        )}
        {c.location && (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {c.location}
          </span>
        )}
      </div>

      <div className="mt-3 rounded-lg bg-slate-800/60 px-3 py-2 inline-block">
        <p className="text-[10px] text-slate-500 mb-0.5">Amount Seeking</p>
        <p className="text-sm font-semibold text-white font-mono">{fmt(c.amount_seeking_cents)}</p>
      </div>

      {c.description && (
        <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">{c.description}</p>
      )}

      <div className="mt-4">
        <Link
          href={c.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View listing <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}

function JobCard({ j }: { j: WealthJob }) {
  const salMin = fmt(j.salary_min_cents)
  const salMax = fmt(j.salary_max_cents)
  const salRange =
    j.salary_min_cents && j.salary_max_cents
      ? `${salMin}–${salMax}`
      : j.salary_max_cents
        ? `up to ${salMax}`
        : '—'

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{j.source}</span>
        <span className="text-[10px] text-slate-600">{timeAgo(j.first_seen_at)}</span>
      </div>
      <p className="text-sm font-semibold text-white leading-snug">{j.job_title}</p>
      {j.company && <p className="mt-0.5 text-xs text-slate-400">{j.company}</p>}

      <div className="mt-3 flex items-center gap-3">
        <div className="rounded-lg bg-green-900/30 border border-green-800/40 px-3 py-2">
          <p className="text-[10px] text-green-600 mb-0.5">Salary</p>
          <p className="text-sm font-semibold text-green-400 font-mono">{salRange}</p>
        </div>
        {j.location && (
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Location</p>
            <p className="text-xs font-medium text-white">{j.location}</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link
          href={j.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View job <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default async function WealthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Feature flag: only available when the operator is enabled
  const enabled = process.env.WEALTH_OPERATOR_ENABLED === 'true'

  let businesses: WealthBusiness[] = []
  let capital: WealthCapital[] = []
  let jobs: WealthJob[] = []

  if (enabled) {
    const [bRes, cRes, jRes] = await Promise.all([
      supabase
        .from('wealth_businesses')
        .select('*')
        .order('first_seen_at', { ascending: false })
        .limit(50),
      supabase
        .from('wealth_capital_opportunities')
        .select('*')
        .order('first_seen_at', { ascending: false })
        .limit(50),
      supabase
        .from('wealth_jobs')
        .select('*')
        .order('salary_max_cents', { ascending: false, nullsFirst: false })
        .limit(50),
    ])

    businesses = (bRes.data ?? []) as WealthBusiness[]
    capital = (cRes.data ?? []) as WealthCapital[]
    jobs = (jRes.data ?? []) as WealthJob[]
  }

  // Paused state
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
          <Lock size={28} className="text-slate-500" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Wealth Operator — Paused</h1>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          The autonomous wealth-building system is currently inactive. Set{' '}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-blue-400">
            WEALTH_OPERATOR_ENABLED=true
          </code>{' '}
          in your environment to activate opportunity tracking.
        </p>
        <p className="mt-4 text-xs text-slate-600">
          Tracks: business acquisitions · capital injection · NYC $250k+ jobs
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Wealth Operator</h1>
        <p className="mt-1 text-sm text-slate-400">
          Autonomous opportunity tracker — business acquisitions, equity plays, and high-salary NYC jobs.
          All outreach is draft only.
        </p>
      </div>

      {/* Businesses for sale */}
      <section>
        <SectionHeader
          icon={Building2}
          title="Businesses for Sale"
          count={businesses.length}
          color="border border-blue-500/20 bg-blue-500/10 text-blue-400"
        />
        {businesses.length === 0 ? (
          <EmptyState message="No listings discovered yet — the scraper runs daily at 7 AM UTC." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.map((b) => (
              <BusinessCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </section>

      {/* Capital / equity */}
      <section>
        <SectionHeader
          icon={TrendingUp}
          title="Capital &amp; Equity Opportunities"
          count={capital.length}
          color="border border-purple-500/20 bg-purple-500/10 text-purple-400"
        />
        {capital.length === 0 ? (
          <EmptyState message="No capital opportunities discovered yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {capital.map((c) => (
              <CapitalCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      {/* Jobs */}
      <section>
        <SectionHeader
          icon={Briefcase}
          title="NYC Jobs — $250k+"
          count={jobs.length}
          color="border border-green-500/20 bg-green-500/10 text-green-400"
        />
        {jobs.length === 0 ? (
          <EmptyState message="No $250k+ NYC jobs discovered yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((j) => (
              <JobCard key={j.id} j={j} />
            ))}
          </div>
        )}
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-800 pt-6">
        This system is for personal informational use only. All outreach emails are generated as drafts and
        must be sent manually. Consult a qualified immigration attorney before acquiring any business or
        making any investment while on an H1B visa.
      </p>
    </div>
  )
}
