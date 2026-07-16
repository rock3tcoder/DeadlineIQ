import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { PLATFORM_DISCLAIMER } from '@/types'

interface DisclaimerBannerProps {
  className?: string
  compact?: boolean
}

export function DisclaimerBanner({ className, compact = false }: DisclaimerBannerProps) {
  return (
    <div
      className={cn('flex gap-3 rounded-2xl px-4 py-3', className)}
      style={{
        background: 'rgba(255,159,10,0.05)',
        border: '1px solid rgba(255,159,10,0.15)',
      }}
    >
      <Info size={compact ? 14 : 16} className="mt-0.5 shrink-0" style={{ color: 'rgba(255,159,10,0.60)' }} />
      {compact ? (
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(235,235,245,0.40)' }}>
          {PLATFORM_DISCLAIMER}
        </p>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(235,235,245,0.50)' }}>
          {PLATFORM_DISCLAIMER}
        </p>
      )}
    </div>
  )
}
