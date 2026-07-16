import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, Globe, CalendarClock, TrendingUp, Plus, ScanSearch } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UpdateCard } from '@/components/dashboard/update-card'
import { Button } from '@/components/ui/button'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import type { Update } from '@/types'

// ─────────────────────────────────────────────
// STAT CARD — Apple glass surface with sys-* accent
// ─────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: number
  accent: 'blue' | 'orange' | 'red' | 'green'
}) {
  const accentStyles = {
    blue:   { icon: '#0A84FF', bg: 'rgba(10,132,255,0.12)',  border: 'rgba(10,132,255,0.25)' },
    orange: { icon: '#FF9F0A', bg: 'rgba(255,159,10,0.12)',  border: 'rgba(255,159,10,0.25)' },
    red:    { icon: '#FF453A', bg: 'rgba(255,69,58,0.12)',   border: 'rgba(255,69,58,0.25)'  },
    green:  { icon: '#30D158', bg: 'rgba(48,209,88,0.12)',   border: 'rgba(48,209,88,0.25)'  },
  }
  const a = accentStyles[accent]

  return (
    <div className="glass rounded-2xl p-5 shadow-apple-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-label-secondary">{label}</p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: a.bg, border: `1px solid ${a.border}` }}
        >
          <Icon size={15} style={{ color: a.icon }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white heading-tighter tabular-nums">{value}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// EMPTY STATE — no sources
// ─────────────────────────────────────────────
function NoSourcesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-20 px-8 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl glass-sm shadow-apple-sm">
        <Globe size={28} className="text-label-quaternary" />
      </div>
      <h3 className="text-lg font-semibold text-white heading-tight mb-2">No sources added yet</h3>
      <p className="text-sm text-label-secondary max-w-sm mb-6 leading-relaxed">
        Add the platforms and tax jurisdictions you operate in to start receiving
        policy and deadline updates.
      </p>
      <Button asChild className="bg-sys-blue hover:bg-sys-blue/80 text-white border-0">
        <Link href="/markets">
          <Plus size={16} className="mr-2" />
          Add your first source
        </Link>
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// EMPTY STATE — has sources, monitoring
// ─────────────────────────────────────────────
function MonitoringEmpty({ sourceCount }: { sourceCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-20 px-8 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl glass-sm shadow-apple-sm">
        <ScanSearch size={28} className="text-sys-blue/60" />
      </div>
      <h3 className="text-lg font-semibold text-white heading-tight mb-2">
        Monitoring {sourceCount} source{sourceCount !== 1 ? 's' : ''}…
      </h3>
      <p className="text-sm text-label-secondary max-w-sm leading-relaxed">
        Our system checks your sources every 6 hours. You&apos;ll be notified here
        and by email as soon as a relevant change is detected.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userSources } = await supabase
    .from('user_sources')
    .select('source_id')
    .eq('user_id', user.id)

  const sourceIds = (userSources ?? []).map((r: { source_id: string }) => r.source_id)
  const sourceCount = sourceIds.length

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  if (sourceCount === 0) {
    return (
      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white heading-tighter">
            {firstName ? `Welcome, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="text-label-secondary text-sm mt-1">
            Get started by adding the sources you want to monitor.
          </p>
        </header>
        <DisclaimerBanner compact />
        <NoSourcesEmpty />
      </div>
    )
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const today = now.toISOString().split('T')[0]
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [
    { data: recentUpdates },
    { count: weekCount },
    { data: readRecords },
    { count: deadlineCount },
  ] = await Promise.all([
    supabase
      .from('updates')
      .select('*, source:sources(name, platform_tag, jurisdiction)')
      .in('source_id', sourceIds)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('updates')
      .select('id', { count: 'exact', head: true })
      .in('source_id', sourceIds)
      .gte('created_at', sevenDaysAgo),

    supabase
      .from('user_update_reads')
      .select('update_id')
      .eq('user_id', user.id),

    supabase
      .from('updates')
      .select('id', { count: 'exact', head: true })
      .in('source_id', sourceIds)
      .gte('deadline_date', today)
      .lte('deadline_date', thirtyDaysOut),
  ])

  const readIds = new Set((readRecords ?? []).map((r: { update_id: string }) => r.update_id))
  const updates = (recentUpdates ?? []) as Update[]
  const unreadCount = updates.filter((u) => !readIds.has(u.id)).length

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white heading-tighter">
            {firstName ? `Good to see you, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="text-label-secondary text-sm mt-1">
            Here&apos;s what&apos;s changed across your monitored sources.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="border border-white/[0.08] text-label-secondary hover:bg-white/[0.06] hover:text-white bg-transparent shrink-0"
          variant="outline"
        >
          <Link href="/markets">
            <Plus size={14} className="mr-1.5" />
            Add source
          </Link>
        </Button>
      </header>

      {/* Disclaimer */}
      <DisclaimerBanner compact />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}    label="Updates this week"   value={weekCount ?? 0}    accent="blue"   />
        <StatCard icon={Bell}          label="Unread updates"      value={unreadCount}        accent="red"    />
        <StatCard icon={CalendarClock} label="Upcoming deadlines"  value={deadlineCount ?? 0} accent="orange" />
        <StatCard icon={Globe}         label="Sources monitored"   value={sourceCount}        accent="green"  />
      </div>

      {/* Updates feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent updates</h2>
          {updates.length > 0 && (
            <Link href="/alerts" className="text-sm text-sys-blue hover:text-sys-blue/70 transition-colors">
              View all →
            </Link>
          )}
        </div>

        {updates.length === 0 ? (
          <MonitoringEmpty sourceCount={sourceCount} />
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
      </section>
    </div>
  )
}
