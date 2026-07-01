import { Link } from 'react-router-dom'
import { Car, Bell } from 'lucide-react'
import type { Budget } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetCardProps {
  budget: Budget
  highlight?: boolean
}

export function BudgetCard({ budget, highlight }: BudgetCardProps) {
  return (
    <Link to={`/orcamentos/${budget.id}`} className="h-full block">
      <Card
        className={cn(
          'hover:shadow-md transition-all cursor-pointer group h-full',
          highlight && 'border-l-4 border-l-brand-accent'
        )}
      >
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 flex-1">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 overflow-hidden mt-0.5',
                  highlight ? 'bg-brand-accent/10' : 'bg-brand-primary/10'
                )}
              >
                {budget.vehicle?.photo_url ? (
                  <img
                    src={budget.vehicle.photo_url}
                    alt={`${budget.vehicle.brand} ${budget.vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Car className={cn('h-5 w-5', highlight ? 'text-brand-accent' : 'text-brand-primary')} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-semibold', highlight ? 'text-brand-accent' : 'text-brand-primary')}>
                    Orçamento {budget.budget_number}
                  </span>
                  <BudgetStatusBadge status={budget.status} />
                </div>
                {budget.service_request?.service?.name ? (
                  <p className="mt-0.5 text-sm font-medium text-foreground truncate">
                    {budget.service_request.service.name}
                  </p>
                ) : budget.service_request?.category ? (
                  <p className="mt-0.5 text-sm text-muted-foreground truncate">
                    {budget.service_request.category}
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {budget.vehicle ? `${budget.vehicle.brand} ${budget.vehicle.model}` : '—'}
                  {budget.vehicle?.plate && (
                    <span className="ml-1.5 font-mono">· {budget.vehicle.plate}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-brand-accent">{formatCurrency(budget.total_amount)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(budget.issued_at)}</p>
            </div>
          </div>

          {highlight && (
            <div className="mt-auto pt-2.5 flex items-center gap-1.5 text-xs font-medium text-brand-accent/80">
              <Bell className="h-3 w-3" />
              Aguardando sua aprovação — toque para ver os detalhes
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
