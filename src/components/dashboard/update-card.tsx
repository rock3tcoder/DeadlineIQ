'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { UrgencyBadge } from './urgency-badge'
import { cn } from '@/lib/utils'
import type { Update } from '@/types'

interface UpdateCardProps {
  update: Update
  isRead: boolean
  userId: string
}

export function UpdateCard({ update, isRead: initialRead, userId }: UpdateCardProps) {
  const [isRead, setIsRead] = useState(initialRead)

  const handleMarkRead = async () => {
    if (isRead) return
    setIsRead(true)
    const supabase = createClient()
    await supabase
      .from('user_update_reads')
      .insert({ user_id: userId, update_id: update.id })
      .then(() => {})
  }

  const sourceLabel = update.source
    ? `${update.source.name} · ${update.source.jurisdiction}`
    : update.jurisdiction

  return (
    <div
      onClick={handleMarkRead}
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200 cursor-pointer animate-fade-in-up',
        isRead
          ? 'bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.035]'
          : 'glass shadow-apple-sm hover:shadow-apple-md'
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-sys-blue shadow-[0_0_6px_rgba(10,132,255,0.7)]" />
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 pr-5">
        <UrgencyBadge level={update.urgency_level} />
        {update.deadline_date && (
          <span className="rounded-full border border-sys-orange/25 bg-sys-orange/8 px-2.5 py-0.5 text-xs font-medium text-sys-orange">
            Due {new Date(update.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={cn('font-semibold leading-snug tracking-tight', isRead ? 'text-label-secondary' : 'text-white')}>
        {update.title}
      </h3>

      {/* Source */}
      <p className="text-xs text-label-tertiary">{sourceLabel}</p>

      {/* Summary */}
      <p className="text-sm text-label-secondary leading-relaxed line-clamp-2">{update.summary}</p>

      {/* Action items */}
      {update.action_items.length > 0 && (
        <ul className="space-y-1">
          {update.action_items.slice(0, 2).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-label-tertiary">
              <span className="mt-0.5 text-sys-blue">·</span>
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs text-label-quaternary">
          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
        </span>
        <a
          href={update.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs text-sys-blue hover:text-sys-blue/70 transition-colors"
        >
          View official source
          <ExternalLink size={11} />
        </a>
      </div>

      {/* AI disclaimer */}
      <p className="text-[10px] leading-relaxed text-label-quaternary">
        AI-generated summary for informational use only. Verify with the official source before taking action.
      </p>
    </div>
  )
}
