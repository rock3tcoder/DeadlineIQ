import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, Globe, CalendarClock, TrendingUp, Plus, ScanSearch } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UpdateCard } from '@/components/dashboard/update-card'
import { Button } from '@/components/ui/button'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import type { Update } from '@/types'

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: 'blue' | 'amber' | 'red' | 'green'
}) {
  const colors = {
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    red: 'border-red-500/20 bg-red-500/5 text-red-400',
    green: 'border-green-500/20 bg-green-500/5 text-green-400',
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colors[color]}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// EMPTY STATE — no sources added yet
// ─────────────────────────────────────────────
function NoSourcesEmpty() {
  return (
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
  )
}

// ─────────────────────────────────────────────
// EMPTY STATE — has sources, no updates detected yet
// ─────────────────────────────────────────────
function MonitoringEmpty({ sourceCount }: { sourceCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 px-8 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
        <ScanSearch size={28} className="text-blue-500/70" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Monitoring {sourceCount} source{sourceCount !== 1 ? 's' : ''}…</h3>
      <p className="text-sm text-slate-400 max-w-sm">
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

  // Fetch user's subscribed source IDs
  const { data: userSources } = await supabase
    .from('user_sources')
    .select('source_id')
    .eq('user_id', user.id)

  const sourceIds = (userSources ?? []).map((r: { source_id: string }) => r.source_id)
  const sourceCount = sourceIds.length

  // Fetch profile for greeting
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  // If no sources, skip expensive queries
  if (sourceCount === 0) {
    return (
      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">
            {firstName ? `Welcome, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Get started by adding the sources you want to monitor.
          </p>
        </header>
        <DisclaimerBanner compact />
        <NoSourcesEmpty />
      </div>
    )
  }

  // Fetch stats + recent updates in parallel
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
          <h1 className="text-2xl font-bold text-white">
            {firstName ? `Good to see you, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here&apos;s what&apos;s changed across your monitored sources.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0">
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
        <StatCard icon={TrendingUp} label="Updates this week" value={weekCount ?? 0} color="blue" />
        <StatCard icon={Bell} label="Unread updates" value={unreadCount} color="red" />
        <StatCard icon={CalendarClock} label="Upcoming deadlines" value={deadlineCount ?? 0} color="amber" />
        <StatCard icon={Globe} label="Sources monitored" value={sourceCount} color="green" />
      </div>

      {/* Updates feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent updates</h2>
          {updates.length > 0 && (
            <Link href="/alerts" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
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
