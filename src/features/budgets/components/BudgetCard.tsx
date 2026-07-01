import { Link } from 'react-router-dom'
import { ChevronRight, Car } from 'lucide-react'
import type { Budget } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface BudgetCardProps {
  budget: Budget
}

export function BudgetCard({ budget }: BudgetCardProps) {
  return (
    <Link to={`/orcamentos/${budget.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 flex-shrink-0 overflow-hidden">
                {budget.vehicle?.photo_url ? (
                  <img
                    src={budget.vehicle.photo_url}
                    alt={`${budget.vehicle.brand} ${budget.vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Car className="h-5 w-5 text-brand-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-brand-primary">
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
                  {budget.vehicle
                    ? `${budget.vehicle.brand} ${budget.vehicle.model}`
                    : '—'}
                  {budget.vehicle?.plate && (
                    <span className="ml-1.5 font-mono">· {budget.vehicle.plate}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="font-bold text-brand-accent">{formatCurrency(budget.total_amount)}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(budget.issued_at)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
