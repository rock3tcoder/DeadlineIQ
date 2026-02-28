import { cn } from '@/lib/utils'
import type { UrgencyLevel } from '@/types'

const config: Record<UrgencyLevel, { label: string; className: string }> = {
  informational: {
    label: 'Informational',
    className: 'border-slate-600/40 bg-slate-500/10 text-slate-400',
  },
  policy_change: {
    label: 'Policy Change',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  deadline_based: {
    label: 'Deadline',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  high_urgency: {
    label: 'High Urgency',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
  },
}

interface UrgencyBadgeProps {
  level: UrgencyLevel
  className?: string
}

export function UrgencyBadge({ level, className }: UrgencyBadgeProps) {
  const { label, className: style } = config[level]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}
