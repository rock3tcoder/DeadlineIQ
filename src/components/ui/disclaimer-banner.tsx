import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { PLATFORM_DISCLAIMER } from '@/types'

interface DisclaimerBannerProps {
  className?: string
  compact?: boolean   // true = single line, false = full paragraph
}

export function DisclaimerBanner({ className, compact = false }: DisclaimerBannerProps) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-amber-200/70',
        className
      )}
    >
      <Info size={16} className="mt-0.5 shrink-0 text-amber-400/70" />
      {compact ? (
        <p className="text-xs leading-relaxed">{PLATFORM_DISCLAIMER}</p>
      ) : (
        <p className="text-sm leading-relaxed">{PLATFORM_DISCLAIMER}</p>
      )}
    </div>
  )
}
