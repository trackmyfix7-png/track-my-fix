import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  variant?: 'default' | 'accent' | 'secondary'
  className?: string
}

const variantStyles = {
  default: { value: 'text-brand-primary', icon: 'bg-brand-primary/10 text-brand-primary' },
  accent: { value: 'text-brand-accent', icon: 'bg-brand-accent/10 text-brand-accent' },
  secondary: { value: 'text-brand-secondary', icon: 'bg-brand-secondary/10 text-brand-secondary' },
}

export function StatsCard({ label, value, subtitle, icon: Icon, variant = 'default', className }: StatsCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {label}
            </p>
            <p className={cn('mt-1 text-2xl font-bold', styles.value)}>{value}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('flex-shrink-0 rounded-lg p-2', styles.icon)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
