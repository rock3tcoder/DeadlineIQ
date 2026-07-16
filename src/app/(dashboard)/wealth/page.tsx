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
  accentColor,
  accentBg,
  accentBorder,
}: {
  icon: React.ElementType
  title: string
  count: number
  accentColor: string
  accentBg: string
  accentBorder: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
      >
        <Icon size={16} style={{ color: accentColor }} />
      </div>
      <h2 className="text-base font-semibold text-white heading-tight">{title}</h2>
      <span className="ml-auto text-xs text-label-tertiary">
        {count} listing{count !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] py-10 text-center">
      <p className="text-sm text-label-tertiary">{message}</p>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <p className="text-[10px] text-label-tertiary mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white font-mono tabular-nums">{value}</p>
    </div>
  )
}

function BusinessCard({ b }: { b: WealthBusiness }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-apple-sm hover:shadow-apple-md transition-shadow duration-200">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[10px] font-medium text-label-tertiary uppercase tracking-wider">
          {b.source}
        </span>
        {b.is_passive_eligible && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-sys-green"
            style={{ background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.22)' }}
          >
            <ShieldCheck size={10} />
            Passive-eligible
          </span>
        )}
        <span className="ml-auto text-[10px] text-label-quaternary">{timeAgo(b.first_seen_at)}</span>
      </div>

      <p className="text-sm font-semibold text-white leading-snug line-clamp-2 heading-tight">{b.title}</p>
      {b.location && <p className="mt-0.5 text-xs text-label-tertiary">{b.location}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile label="Asking"    value={fmt(b.asking_price_cents)} />
        <MetricTile label="Cash Flow" value={fmt(b.cash_flow_cents)}    />
        <MetricTile label="Revenue"   value={fmt(b.revenue_cents)}      />
      </div>

      {b.description && (
        <p className="mt-3 text-xs text-label-secondary line-clamp-2 leading-relaxed">{b.description}</p>
      )}

      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href={b.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-sys-blue hover:text-sys-blue/70 transition-colors"
        >
          View listing <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}

function CapitalCard({ c }: { c: WealthCapital }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-apple-sm hover:shadow-apple-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[10px] font-medium text-label-tertiary uppercase tracking-wider">{c.source}</span>
        <span className="text-[10px] text-label-quaternary">{timeAgo(c.first_seen_at)}</span>
      </div>
      <p className="text-sm font-semibold text-white leading-snug heading-tight">{c.company_name}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {c.industry && (
          <span className="rounded-full px-2 py-0.5 text-[10px] text-label-secondary"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {c.industry}
          </span>
        )}
        {c.location && (
          <span className="rounded-full px-2 py-0.5 text-[10px] text-label-secondary"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {c.location}
          </span>
        )}
      </div>

      <div className="mt-3 inline-block">
        <MetricTile label="Amount Seeking" value={fmt(c.amount_seeking_cents)} />
      </div>

      {c.description && (
        <p className="mt-3 text-xs text-label-secondary line-clamp-2 leading-relaxed">{c.description}</p>
      )}

      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href={c.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-sys-blue hover:text-sys-blue/70 transition-colors"
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
    <div className="glass rounded-2xl p-5 shadow-apple-sm hover:shadow-apple-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[10px] font-medium text-label-tertiary uppercase tracking-wider">{j.source}</span>
        <span className="text-[10px] text-label-quaternary">{timeAgo(j.first_seen_at)}</span>
      </div>
      <p className="text-sm font-semibold text-white leading-snug heading-tight">{j.job_title}</p>
      {j.company && <p className="mt-0.5 text-xs text-label-secondary">{j.company}</p>}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.18)' }}
        >
          <p className="text-[10px] text-sys-green/60 mb-0.5">Salary</p>
          <p className="text-sm font-semibold text-sys-green font-mono tabular-nums">{salRange}</p>
        </div>
        {j.location && (
          <MetricTile label="Location" value={j.location} />
        )}
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href={j.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-sys-blue hover:text-sys-blue/70 transition-colors"
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
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glass shadow-apple-md">
          <Lock size={26} className="text-label-tertiary" />
        </div>
        <h1 className="text-xl font-semibold text-white heading-tight mb-2">
          Wealth Operator — Paused
        </h1>
        <p className="text-sm text-label-secondary max-w-sm leading-relaxed">
          The autonomous wealth-building system is currently inactive. Set{' '}
          <code className="rounded-lg px-1.5 py-0.5 text-xs text-sys-blue font-mono"
            style={{ background: 'rgba(10,132,255,0.10)', border: '1px solid rgba(10,132,255,0.18)' }}>
            WEALTH_OPERATOR_ENABLED=true
          </code>{' '}
          in your environment to activate opportunity tracking.
        </p>
        <p className="mt-4 text-xs text-label-quaternary">
          Tracks: business acquisitions · capital injection · NYC $250k+ jobs
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white heading-tighter">Wealth Operator</h1>
        <p className="mt-1 text-sm text-label-secondary">
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
          accentColor="#0A84FF"
          accentBg="rgba(10,132,255,0.10)"
          accentBorder="rgba(10,132,255,0.22)"
        />
        {businesses.length === 0 ? (
          <EmptyState message="No listings discovered yet — the scraper runs daily at 7 AM UTC." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.map((b) => <BusinessCard key={b.id} b={b} />)}
          </div>
        )}
      </section>

      {/* Capital / equity */}
      <section>
        <SectionHeader
          icon={TrendingUp}
          title="Capital &amp; Equity Opportunities"
          count={capital.length}
          accentColor="#BF5AF2"
          accentBg="rgba(191,90,242,0.10)"
          accentBorder="rgba(191,90,242,0.22)"
        />
        {capital.length === 0 ? (
          <EmptyState message="No capital opportunities discovered yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {capital.map((c) => <CapitalCard key={c.id} c={c} />)}
          </div>
        )}
      </section>

      {/* Jobs */}
      <section>
        <SectionHeader
          icon={Briefcase}
          title="NYC Jobs — $250k+"
          count={jobs.length}
          accentColor="#30D158"
          accentBg="rgba(48,209,88,0.10)"
          accentBorder="rgba(48,209,88,0.22)"
        />
        {jobs.length === 0 ? (
          <EmptyState message="No $250k+ NYC jobs discovered yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((j) => <JobCard key={j.id} j={j} />)}
          </div>
        )}
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-label-quaternary leading-relaxed pt-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        This system is for personal informational use only. All outreach emails are generated as drafts and
        must be sent manually. Consult a qualified immigration attorney before acquiring any business or
        making any investment while on an H1B visa.
      </p>
    </div>
  )
}
