import { cn } from '@/lib/utils'
import type { UrgencyLevel } from '@/types'

const config: Record<UrgencyLevel, { label: string; className: string }> = {
  informational: {
    label: 'Informational',
    className: 'text-label-secondary bg-white/[0.05] border-white/[0.08]',
  },
  policy_change: {
    label: 'Policy Change',
    className: 'text-sys-blue border-sys-blue/20 bg-sys-blue/8',
  },
  deadline_based: {
    label: 'Deadline',
    className: 'text-sys-orange border-sys-orange/20 bg-sys-orange/8',
  },
  high_urgency: {
    label: 'High Urgency',
    className: 'text-sys-red border-sys-red/20 bg-sys-red/8',
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
