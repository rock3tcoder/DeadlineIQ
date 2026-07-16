import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, ChevronLeft, ChevronRight, Globe, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UpdateCard } from '@/components/dashboard/update-card'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Update, UrgencyLevel, IndustryTag } from '@/types'

const PAGE_SIZE = 20

const URGENCY_FILTERS: { value: UrgencyLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All urgencies' },
  { value: 'high_urgency', label: 'High urgency' },
  { value: 'deadline_based', label: 'Deadline' },
  { value: 'policy_change', label: 'Policy change' },
  { value: 'informational', label: 'Info' },
]

const TAG_FILTERS: { value: IndustryTag | 'all'; label: string }[] = [
  { value: 'all', label: 'All categories' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'tax_federal', label: 'Federal tax' },
  { value: 'tax_state', label: 'State tax' },
]

interface Props {
  searchParams: Promise<{ urgency?: string; tag?: string; page?: string }>
}

function buildUrl(params: { urgency: string; tag: string; page: number }): string {
  const query = new URLSearchParams()
  if (params.urgency !== 'all') query.set('urgency', params.urgency)
  if (params.tag !== 'all') query.set('tag', params.tag)
  if (params.page > 1) query.set('page', String(params.page))
  const qs = query.toString()
  return qs ? `/alerts?${qs}` : '/alerts'
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
      )}
    >
      {label}
    </Link>
  )
}

export default async function AlertsPage({ searchParams }: Props) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const urgency = URGENCY_FILTERS.some((f) => f.value === params.urgency)
    ? (params.urgency as UrgencyLevel)
    : 'all'
  const tag = TAG_FILTERS.some((f) => f.value === params.tag)
    ? (params.tag as IndustryTag)
    : 'all'
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  // The user's subscribed sources
  const { data: userSources } = await supabase
    .from('user_sources')
    .select('source_id')
    .eq('user_id', user.id)

  const sourceIds = (userSources ?? []).map((r: { source_id: string }) => r.source_id)

  if (sourceIds.length === 0) {
    return (
      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white mb-1">Updates</h1>
          <p className="text-slate-400 text-sm">
            All policy and deadline updates across your sources.
          </p>
        </header>
        <DisclaimerBanner compact />
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 px-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
            <Globe size={28} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No sources added yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            Add the platforms and tax jurisdictions you operate in to start receiving
            policy and deadline updates.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white">
            <Link href="/markets">
              <Plus size={16} className="mr-2" />
              Add your first source
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Filtered, paginated updates + the user's read records
  const offset = (page - 1) * PAGE_SIZE

  let updatesQuery = supabase
    .from('updates')
    .select('*, source:sources(name, platform_tag, jurisdiction)', { count: 'exact' })
    .in('source_id', sourceIds)

  if (urgency !== 'all') updatesQuery = updatesQuery.eq('urgency_level', urgency)
  if (tag !== 'all') updatesQuery = updatesQuery.eq('industry_tag', tag)

  const [{ data: updateRows, count }, { data: readRecords }] = await Promise.all([
    updatesQuery.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
    supabase.from('user_update_reads').select('update_id').eq('user_id', user.id),
  ])

  const updates = (updateRows ?? []) as Update[]
  const readIds = new Set((readRecords ?? []).map((r: { update_id: string }) => r.update_id))
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasFilters = urgency !== 'all' || tag !== 'all'

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-white mb-1">Updates</h1>
        <p className="text-slate-400 text-sm">
          All policy and deadline updates across your sources.
          {totalCount > 0 && (
            <span className="text-slate-500"> {totalCount} update{totalCount !== 1 ? 's' : ''} total.</span>
          )}
        </p>
      </header>

      {/* Disclaimer */}
      <DisclaimerBanner compact />

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {URGENCY_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              href={buildUrl({ urgency: f.value, tag, page: 1 })}
              active={urgency === f.value}
              label={f.label}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TAG_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              href={buildUrl({ urgency, tag: f.value, page: 1 })}
              active={tag === f.value}
              label={f.label}
            />
          ))}
        </div>
      </div>

      {/* Feed */}
      {updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 px-8 text-center">
          <Bell size={28} className="text-slate-600 mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">
            {hasFilters ? 'No updates match these filters' : 'No updates yet'}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {hasFilters ? (
              <>
                Try a different filter, or{' '}
                <Link href="/alerts" className="text-blue-400 hover:text-blue-300">
                  clear all filters
                </Link>
                .
              </>
            ) : (
              'Our system checks your sources every 6 hours. Updates will appear here as soon as a relevant change is detected.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <UpdateCard
              key={update.id}
              update={update}
              isRead={readIds.has(update.id)}
              userId={user.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          {page > 1 ? (
            <Link
              href={buildUrl({ urgency, tag, page: page - 1 })}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={15} />
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildUrl({ urgency, tag, page: page + 1 })}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Older
              <ChevronRight size={15} />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}
