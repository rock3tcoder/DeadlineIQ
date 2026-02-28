'use client'

import { useState } from 'react'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Source, PlatformTag } from '@/types'

// ─────────────────────────────────────────────
// Platform badge config
// ─────────────────────────────────────────────
const platformConfig: Record<PlatformTag, { label: string; className: string }> = {
  amazon: {
    label: 'Amazon',
    className: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  shopify: {
    label: 'Shopify',
    className: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  tiktok: {
    label: 'TikTok Shop',
    className: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  },
  irs: {
    label: 'IRS Federal',
    className: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  state_tax: {
    label: 'State Tax',
    className: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  general: {
    label: 'General',
    className: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  },
}

// ─────────────────────────────────────────────
// Source groups
// ─────────────────────────────────────────────
const groups: {
  key: string
  label: string
  description: string
  tags: PlatformTag[]
}[] = [
  {
    key: 'platforms',
    label: 'E-commerce Platforms',
    description:
      'Seller policy changes, fee announcements, and program requirement updates.',
    tags: ['amazon', 'shopify', 'tiktok'],
  },
  {
    key: 'federal',
    label: 'Federal Tax — IRS',
    description: 'IRS guidance for online sellers, e-commerce tax rules, and filing deadlines.',
    tags: ['irs'],
  },
  {
    key: 'state',
    label: 'State Sales Tax',
    description:
      'State-level sales tax filing deadlines, nexus rule changes, and rate updates.',
    tags: ['state_tax'],
  },
]

// ─────────────────────────────────────────────
// Source card
// ─────────────────────────────────────────────
function SourceCard({
  source,
  isActive,
  isLoading,
  onToggle,
}: {
  source: Source
  isActive: boolean
  isLoading: boolean
  onToggle: () => void
}) {
  const platform = platformConfig[source.platform_tag]

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-xl border p-4 transition-colors',
        isActive
          ? 'border-blue-500/30 bg-blue-500/5'
          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
      )}
    >
      {/* Active checkmark */}
      {isActive && (
        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20">
          <Check size={11} className="text-blue-400" />
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 pr-6">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
            platform.className
          )}
        >
          {platform.label}
        </span>
        {source.source_type === 'state' && (
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            {source.jurisdiction}
          </span>
        )}
      </div>

      {/* Name */}
      <h4 className="text-sm font-medium text-white leading-snug line-clamp-2">
        {source.name}
      </h4>

      {/* Button */}
      <Button
        size="sm"
        variant={isActive ? 'outline' : 'default'}
        className={cn(
          'h-8 text-xs w-full mt-auto',
          isActive
            ? 'border-slate-700 text-slate-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        )}
        onClick={onToggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : isActive ? (
          <>
            <X size={12} className="mr-1.5" />
            Remove
          </>
        ) : (
          <>
            <Plus size={12} className="mr-1.5" />
            Add
          </>
        )}
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Source manager (main export)
// ─────────────────────────────────────────────
interface SourceManagerProps {
  sources: Source[]
  subscribedIds: string[]
  userId: string
}

export function SourceManager({ sources, subscribedIds: initialIds, userId }: SourceManagerProps) {
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(() => new Set(initialIds))
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { toast } = useToast()

  const subscribe = async (source: Source) => {
    setLoadingId(source.id)
    // Optimistic
    setSubscribedIds((prev) => new Set(Array.from(prev).concat(source.id)))

    const supabase = createClient()
    const { error } = await supabase
      .from('user_sources')
      .insert({ user_id: userId, source_id: source.id })

    if (error) {
      // Revert
      setSubscribedIds((prev) => {
        const next = new Set(prev)
        next.delete(source.id)
        return next
      })
      toast({
        title: 'Could not add source',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Source added', description: `Now monitoring: ${source.name}` })
    }
    setLoadingId(null)
  }

  const unsubscribe = async (source: Source) => {
    setLoadingId(source.id)
    // Optimistic
    setSubscribedIds((prev) => {
      const next = new Set(prev)
      next.delete(source.id)
      return next
    })

    const supabase = createClient()
    const { error } = await supabase
      .from('user_sources')
      .delete()
      .eq('user_id', userId)
      .eq('source_id', source.id)

    if (error) {
      // Revert
      setSubscribedIds((prev) => new Set(Array.from(prev).concat(source.id)))
      toast({
        title: 'Could not remove source',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Source removed', description: `Stopped monitoring: ${source.name}` })
    }
    setLoadingId(null)
  }

  const activeSources = sources.filter((s) => subscribedIds.has(s.id))
  const availableSources = sources.filter((s) => !subscribedIds.has(s.id))

  return (
    <div className="space-y-10">

      {/* ── Active sources ──────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-white">Active sources</h2>
          <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400">
            {activeSources.length}
          </span>
        </div>

        {activeSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-10 text-center">
            <p className="text-slate-500 text-sm">
              No sources added yet. Pick from the list below to start monitoring.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                isActive
                isLoading={loadingId === source.id}
                onToggle={() => unsubscribe(source)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Available sources ───────────────────── */}
      {availableSources.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-6">Add sources</h2>

          <div className="space-y-8">
            {groups.map((group) => {
              const groupSources = availableSources.filter((s) =>
                (group.tags as string[]).includes(s.platform_tag)
              )
              if (groupSources.length === 0) return null

              return (
                <div key={group.key}>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-200">{group.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groupSources.map((source) => (
                      <SourceCard
                        key={source.id}
                        source={source}
                        isActive={false}
                        isLoading={loadingId === source.id}
                        onToggle={() => subscribe(source)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* All sources active */}
      {availableSources.length === 0 && activeSources.length > 0 && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4 text-center">
          <p className="text-sm text-green-400 font-medium">
            You&apos;re monitoring all available sources.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            We&apos;re regularly adding new sources. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
