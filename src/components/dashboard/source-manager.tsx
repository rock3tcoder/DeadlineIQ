'use client'

import { useState } from 'react'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Source, PlatformTag } from '@/types'

// ─────────────────────────────────────────────
// Platform badge config — Apple system colours
// ─────────────────────────────────────────────
const platformConfig: Record<PlatformTag, { label: string; className: string }> = {
  amazon: {
    label: 'Amazon',
    className: 'text-sys-orange bg-sys-orange/8 border-sys-orange/20',
  },
  shopify: {
    label: 'Shopify',
    className: 'text-sys-green bg-sys-green/8 border-sys-green/20',
  },
  tiktok: {
    label: 'TikTok Shop',
    className: 'text-sys-purple bg-sys-purple/8 border-sys-purple/20',
  },
  irs: {
    label: 'IRS Federal',
    className: 'text-sys-blue bg-sys-blue/8 border-sys-blue/20',
  },
  state_tax: {
    label: 'State Tax',
    className: 'text-sys-indigo bg-sys-indigo/8 border-sys-indigo/20',
  },
  general: {
    label: 'General',
    className: 'text-label-secondary bg-white/[0.05] border-white/[0.08]',
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
    description: 'Seller policy changes, fee announcements, and program requirement updates.',
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
    description: 'State-level sales tax filing deadlines, nexus rule changes, and rate updates.',
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
        'relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200',
        isActive
          ? 'border-sys-blue/25 shadow-glow-blue/20'
          : 'glass-sm hover:bg-white/[0.06]'
      )}
      style={isActive ? { background: 'rgba(10,132,255,0.05)', borderColor: 'rgba(10,132,255,0.25)' } : {}}
    >
      {/* Active checkmark */}
      {isActive && (
        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-sys-blue/15">
          <Check size={11} className="text-sys-blue" />
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 pr-6">
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', platform.className)}>
          {platform.label}
        </span>
        {source.source_type === 'state' && (
          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-label-secondary">
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
            ? 'border-white/[0.08] text-label-secondary hover:border-sys-red/30 hover:text-sys-red hover:bg-sys-red/5 bg-transparent'
            : 'bg-sys-blue hover:bg-sys-blue/80 text-white border-0'
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
// Source manager
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
    setSubscribedIds((prev) => new Set(Array.from(prev).concat(source.id)))

    const supabase = createClient()
    const { error } = await supabase
      .from('user_sources')
      .insert({ user_id: userId, source_id: source.id })

    if (error) {
      setSubscribedIds((prev) => {
        const next = new Set(prev)
        next.delete(source.id)
        return next
      })
      toast({ title: 'Could not add source', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Source added', description: `Now monitoring: ${source.name}` })
    }
    setLoadingId(null)
  }

  const unsubscribe = async (source: Source) => {
    setLoadingId(source.id)
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
      setSubscribedIds((prev) => new Set(Array.from(prev).concat(source.id)))
      toast({ title: 'Could not remove source', description: error.message, variant: 'destructive' })
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
          <span className="rounded-full px-2 py-0.5 text-xs font-medium text-sys-blue bg-sys-blue/10">
            {activeSources.length}
          </span>
        </div>

        {activeSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-10 text-center">
            <p className="text-sm text-label-tertiary">
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
                    <h3 className="text-sm font-semibold text-label-primary">{group.label}</h3>
                    <p className="text-xs text-label-tertiary mt-0.5">{group.description}</p>
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
        <div className="rounded-2xl border border-sys-green/20 bg-sys-green/5 px-5 py-4 text-center">
          <p className="text-sm text-sys-green font-medium">
            You&apos;re monitoring all available sources.
          </p>
          <p className="text-xs text-label-tertiary mt-1">
            We&apos;re regularly adding new sources. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
