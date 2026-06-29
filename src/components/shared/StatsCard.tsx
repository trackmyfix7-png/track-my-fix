import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  variant?: 'default' | 'accent' | 'secondary'
  trend?: { value: number; invertedGood?: boolean }
  className?: string
}

const variantStyles = {
  default: {
    value: 'text-brand-primary',
    icon: 'bg-brand-primary/10 text-brand-primary',
    border: 'border-l-brand-primary/50',
  },
  accent: {
    value: 'text-brand-accent',
    icon: 'bg-brand-accent/10 text-brand-accent',
    border: 'border-l-brand-accent',
  },
  secondary: {
    value: 'text-brand-secondary',
    icon: 'bg-brand-secondary/10 text-brand-secondary',
    border: 'border-l-brand-secondary',
  },
}

export function StatsCard({ label, value, subtitle, icon: Icon, variant = 'default', trend, className }: StatsCardProps) {
  const styles = variantStyles[variant]

  const isNeutral = !trend || trend.value === 0
  const isGood = trend
    ? trend.invertedGood
      ? trend.value < 0
      : trend.value > 0
    : false
  const TrendIcon = !trend
    ? null
    : trend.value === 0
    ? Minus
    : trend.value > 0
    ? TrendingUp
    : TrendingDown

  return (
    <Card className={cn('hover:shadow-md transition-shadow border-l-4', styles.border, className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {label}
            </p>
            <p className={cn('mt-1 text-2xl font-bold leading-none', styles.value)}>{value}</p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {TrendIcon && trend && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-[11px] font-semibold',
                  isNeutral ? 'text-muted-foreground' : isGood ? 'text-emerald-600' : 'text-red-500'
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
          {Icon && (
            <div className={cn('flex-shrink-0 rounded-xl p-2.5', styles.icon)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
