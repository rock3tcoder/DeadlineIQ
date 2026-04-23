'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  Briefcase,
  DollarSign,
  Building2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

type Grade = 'A+' | 'A' | 'B' | 'C'
type OppType = 'acquisition' | 'capital_injection' | 'job'
type Status = 'new' | 'reviewed' | 'contacted' | 'passed' | 'pursuing'

interface Opportunity {
  id: string
  opportunity_type: OppType
  name: string
  description: string
  location: string
  source_url: string
  source_platform: string
  status: Status
  grade: Grade
  // Business
  asking_price?: number
  revenue_annual?: number
  cash_flow_annual?: number
  staff_count?: number
  business_type?: string
  passive_possible?: boolean
  equity_needed?: number
  cash_on_cash_return?: number
  risk_score?: number
  financing_options?: string[]
  // Job
  firm_name?: string
  job_title?: string
  estimated_comp_low?: number
  estimated_comp_high?: number
  fit_score?: number
  difficulty_score?: number
  warm_outreach?: boolean
  // AI
  ai_summary?: string
  ai_rationale?: string
  ai_risks?: string
  ai_action_items?: string[]
  ai_next_step?: string
  found_at: string
}

interface OutreachDraft {
  id: string
  opportunity_id: string
  outreach_type: 'broker' | 'owner' | 'job'
  subject: string
  body: string
  sent_at?: string
  follow_up_due_at?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADE_STYLES: Record<Grade, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'A':  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'B':  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'C':  'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const TYPE_ICON: Record<OppType, React.ElementType> = {
  acquisition:       Building2,
  capital_injection: DollarSign,
  job:               Briefcase,
}

const TYPE_LABEL: Record<OppType, string> = {
  acquisition:       'Acquisition',
  capital_injection: 'Capital Injection',
  job:               'NYC Job',
}

function fmt(n?: number): string {
  if (!n) return '—'
  return '$' + n.toLocaleString()
}

function pct(n?: number): string {
  if (!n) return '—'
  return n.toFixed(1) + '%'
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color: 'emerald' | 'blue' | 'amber' | 'slate'
}) {
  const colors = {
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    blue:    'border-blue-500/20 bg-blue-500/5 text-blue-400',
    amber:   'border-amber-500/20 bg-amber-500/5 text-amber-400',
    slate:   'border-slate-500/20 bg-slate-500/5 text-slate-400',
  }
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {sub && <p className={`mt-1 text-xs ${colors[color]}`}>{sub}</p>}
    </div>
  )
}

// ─── Grade badge ──────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${GRADE_STYLES[grade]}`}>
      {grade}
    </span>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="text-slate-500 hover:text-slate-300 transition-colors"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  )
}

// ─── Opportunity card ─────────────────────────────────────────────────────────

function OpportunityCard({
  opp,
  outreach,
}: {
  opp: Opportunity
  outreach?: OutreachDraft
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = TYPE_ICON[opp.opportunity_type]

  const mainMetric =
    opp.opportunity_type === 'job'
      ? `${fmt(opp.estimated_comp_low)} – ${fmt(opp.estimated_comp_high)}`
      : opp.cash_flow_annual
        ? `${fmt(opp.cash_flow_annual)} CF/yr`
        : fmt(opp.asking_price) + ' ask'

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left px-5 py-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800">
            <Icon size={15} className="text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <GradeBadge grade={opp.grade} />
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                {TYPE_LABEL[opp.opportunity_type]}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white truncate">{opp.name}</p>
            <p className="text-xs text-slate-500">{opp.location} · {opp.source_platform}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-emerald-400">{mainMetric}</p>
            {opp.opportunity_type !== 'job' && opp.cash_on_cash_return && (
              <p className="text-xs text-slate-400">{pct(opp.cash_on_cash_return)} CoC</p>
            )}
            {opp.opportunity_type === 'job' && opp.fit_score && (
              <p className="text-xs text-slate-400">Fit {opp.fit_score}/10</p>
            )}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4 space-y-4">

          {/* AI Summary */}
          {opp.ai_summary && (
            <p className="text-sm text-slate-300 leading-relaxed">{opp.ai_summary}</p>
          )}

          {/* Metrics grid */}
          {opp.opportunity_type !== 'job' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {opp.asking_price && <Metric label="Ask" value={fmt(opp.asking_price)} />}
              {opp.cash_flow_annual && <Metric label="Cash Flow" value={fmt(opp.cash_flow_annual)} highlight />}
              {opp.revenue_annual && <Metric label="Revenue" value={fmt(opp.revenue_annual)} />}
              {opp.equity_needed && <Metric label="Equity Needed" value={fmt(opp.equity_needed)} />}
              {opp.cash_on_cash_return && <Metric label="CoC Return" value={pct(opp.cash_on_cash_return)} highlight />}
              {opp.risk_score && <Metric label="Risk Score" value={`${opp.risk_score}/10`} />}
              {opp.staff_count && <Metric label="Staff" value={opp.staff_count.toString()} />}
              {opp.passive_possible !== undefined && (
                <Metric
                  label="Passive OK"
                  value={opp.passive_possible ? 'YES ✓' : 'NO ⚠️'}
                  highlight={opp.passive_possible}
                  warn={!opp.passive_possible}
                />
              )}
              {opp.financing_options && opp.financing_options.length > 0 && (
                <Metric label="Financing" value={opp.financing_options.join(', ')} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {opp.estimated_comp_low && opp.estimated_comp_high && (
                <Metric label="Comp Range" value={`${fmt(opp.estimated_comp_low)} – ${fmt(opp.estimated_comp_high)}`} highlight />
              )}
              {opp.fit_score && <Metric label="Fit Score" value={`${opp.fit_score}/10`} highlight />}
              {opp.difficulty_score && <Metric label="Difficulty" value={`${opp.difficulty_score}/10`} />}
              {opp.warm_outreach !== undefined && (
                <Metric
                  label="Warm Outreach"
                  value={opp.warm_outreach ? 'Recommended' : 'Cold OK'}
                  warn={opp.warm_outreach}
                />
              )}
            </div>
          )}

          {/* Rationale + Risks */}
          {opp.ai_rationale && (
            <div className="rounded-lg bg-slate-800/50 border border-slate-700 px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Why this grade</p>
              <p className="text-sm text-slate-300 leading-relaxed">{opp.ai_rationale}</p>
            </div>
          )}
          {opp.ai_risks && (
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Risks</p>
              <p className="text-sm text-slate-300 leading-relaxed">{opp.ai_risks}</p>
            </div>
          )}

          {/* Next step */}
          {opp.ai_next_step && (
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">Next Step</p>
              <p className="text-sm font-medium text-emerald-300">{opp.ai_next_step}</p>
            </div>
          )}

          {/* Action items */}
          {opp.ai_action_items && opp.ai_action_items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Action Items</p>
              <ul className="space-y-1.5">
                {opp.ai_action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-blue-400 font-bold text-xs shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Outreach draft */}
          {outreach && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Outreach Draft Ready</p>
                <CopyButton text={`Subject: ${outreach.subject}\n\n${outreach.body}`} />
              </div>
              <p className="text-xs text-slate-400 font-mono mb-1">Subject: {outreach.subject}</p>
              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{outreach.body.slice(0, 300)}…</p>
            </div>
          )}

          {/* Links */}
          <div className="flex items-center gap-3 pt-1">
            {opp.source_url && (
              <a
                href={opp.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink size={11} />
                View listing
              </a>
            )}
            <span className="text-xs text-slate-600">
              Found {new Date(opp.found_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  highlight,
  warn,
}: {
  label: string
  value: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-400' : warn ? 'text-amber-400' : 'text-slate-200'}`}>
        {value}
      </p>
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterType = OppType | 'all'
type FilterGrade = Grade | 'all'

function FilterBar({
  typeFilter, setTypeFilter,
  gradeFilter, setGradeFilter,
}: {
  typeFilter: FilterType
  setTypeFilter: (v: FilterType) => void
  gradeFilter: FilterGrade
  setGradeFilter: (v: FilterGrade) => void
}) {
  const types: Array<{ val: FilterType; label: string }> = [
    { val: 'all', label: 'All' },
    { val: 'acquisition', label: 'Acquisitions' },
    { val: 'capital_injection', label: 'Capital Deals' },
    { val: 'job', label: 'Jobs' },
  ]
  const grades: Array<{ val: FilterGrade; label: string }> = [
    { val: 'all', label: 'All grades' },
    { val: 'A+', label: 'A+' },
    { val: 'A', label: 'A' },
    { val: 'B', label: 'B' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter size={13} className="text-slate-500 shrink-0" />
      {types.map(({ val, label }) => (
        <button
          key={val}
          onClick={() => setTypeFilter(val)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            typeFilter === val
              ? 'bg-blue-600 text-white'
              : 'border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          }`}
        >
          {label}
        </button>
      ))}
      <span className="text-slate-700">|</span>
      {grades.map(({ val, label }) => (
        <button
          key={val}
          onClick={() => setGradeFilter(val)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            gradeFilter === val
              ? 'bg-blue-600 text-white'
              : 'border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WealthPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [outreachMap, setOutreachMap] = useState<Record<string, OutreachDraft>>({})
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [gradeFilter, setGradeFilter] = useState<FilterGrade>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wealth/opportunities')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { opportunities: Opportunity[]; outreach: OutreachDraft[] }
      setOpportunities(data.opportunities ?? [])
      // Index outreach by opportunity_id (first draft per opp)
      const map: Record<string, OutreachDraft> = {}
      for (const d of (data.outreach ?? [])) {
        if (!map[d.opportunity_id]) map[d.opportunity_id] = d
      }
      setOutreachMap(map)
    } catch {
      // Silently fail — empty state shows
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = opportunities.filter((o) => {
    if (typeFilter !== 'all' && o.opportunity_type !== typeFilter) return false
    if (gradeFilter !== 'all' && o.grade !== gradeFilter) return false
    return true
  })

  // Stats
  const aPlus = opportunities.filter((o) => o.grade === 'A+').length
  const totalAcq = opportunities.filter((o) => o.opportunity_type === 'acquisition').length
  const totalJobs = opportunities.filter((o) => o.opportunity_type === 'job').length
  const topCF = Math.max(0, ...opportunities.filter((o) => o.cash_flow_annual).map((o) => o.cash_flow_annual!))

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Wealth Operator</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Autonomous deal pipeline — acquisitions, equity investments, and high-comp NYC roles.
          </p>
        </div>
        <Button
          onClick={() => void load()}
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0"
          disabled={loading}
        >
          <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {/* H1B reminder */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <span className="text-amber-400 text-base mt-0.5">⚠️</span>
        <p className="text-sm text-amber-200/70 leading-relaxed">
          <strong className="text-amber-300">H1B Reminder:</strong> Always consult an immigration attorney
          before closing any deal. Only pursue passive ownership, investor roles, or board/advisory positions.
          Never take on a daily operating role at an acquired business.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total opportunities" value={opportunities.length} sub={`${aPlus} rated A+`} color="emerald" />
        <StatCard label="Acquisition targets" value={totalAcq} sub="businesses to buy" color="blue" />
        <StatCard label="NYC Jobs found" value={totalJobs} sub="$250k+ roles" color="amber" />
        <StatCard
          label="Best deal CF"
          value={topCF > 0 ? `$${(topCF / 1000).toFixed(0)}k/yr` : '—'}
          sub="annual cash flow"
          color="emerald"
        />
      </div>

      {/* Filter bar */}
      <FilterBar
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        gradeFilter={gradeFilter}
        setGradeFilter={setGradeFilter}
      />

      {/* Opportunities list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={20} className="animate-spin text-slate-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 px-8 text-center">
          <TrendingUp size={28} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No opportunities yet</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            The wealth operator scans BizBuySell, Craigslist, job boards, and firm career pages
            every 12 hours. Check back soon — or adjust your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              outreach={outreachMap[opp.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
