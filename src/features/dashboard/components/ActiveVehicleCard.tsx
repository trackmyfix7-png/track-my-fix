import { Car, AlertCircle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ServiceOrder, ServiceOrderStatus } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { VehicleStatusBar } from '@/features/vehicles/components/VehicleStatusBar'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<ServiceOrderStatus, string> = {
  received:          'Recebido',
  diagnosis:         'Em diagnóstico',
  awaiting_approval: 'Aguard. aprovação',
  in_progress:       'Em serviço',
  ready:             'Pronto para retirada',
  delivered:         'Entregue',
}

const STATUS_BADGE: Record<ServiceOrderStatus, string> = {
  received:          'bg-gray-100 text-gray-600',
  diagnosis:         'bg-brand-secondary/10 text-brand-secondary',
  awaiting_approval: 'bg-amber-100 text-amber-700',
  in_progress:       'bg-emerald-100 text-emerald-700',
  ready:             'bg-purple-100 text-purple-700',
  delivered:         'bg-teal-100 text-teal-700',
}

const STATUS_BORDER: Record<ServiceOrderStatus, string> = {
  received:          'border-l-gray-300',
  diagnosis:         'border-l-brand-secondary',
  awaiting_approval: 'border-l-amber-400',
  in_progress:       'border-l-emerald-400',
  ready:             'border-l-purple-400',
  delivered:         'border-l-teal-400',
}

interface ActiveVehicleCardProps {
  order: ServiceOrder
}

export function ActiveVehicleCard({ order }: ActiveVehicleCardProps) {
  const v                  = order.vehicle
  const isAwaitingApproval = order.status === 'awaiting_approval'

  return (
    <Card className={cn('border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow', STATUS_BORDER[order.status])}>
      <CardContent className="p-0">

        {/* Header — veículo + status */}
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-primary/8 border border-border">
              {v?.photo_url ? (
                <img src={v.photo_url} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Car className="h-5 w-5 text-brand-primary/60" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-brand-primary leading-tight">
                {v ? `${v.brand} ${v.model} ${v.year}` : '—'}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                {v?.plate && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {v.plate}
                  </span>
                )}
                {v?.mileage && (
                  <span className="text-xs text-muted-foreground">
                    {v.mileage.toLocaleString('pt-BR')} km
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', STATUS_BADGE[order.status])}>
              {STATUS_LABEL[order.status]}
            </span>
            <Link
              to="/orcamentos"
              className="text-muted-foreground hover:text-brand-secondary transition-colors"
              aria-label="Ver detalhes"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Banner de aprovação pendente */}
        {isAwaitingApproval && (
          <div className="mx-5 mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-xs font-medium text-amber-700">
                Orçamento aguardando sua aprovação
              </p>
            </div>
            <Link
              to="/orcamentos"
              className="shrink-0 text-xs font-semibold text-amber-700 underline-offset-2 hover:underline"
            >
              Ver orçamento →
            </Link>
          </div>
        )}

        {/* Timeline de status */}
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <VehicleStatusBar status={order.status} />
        </div>

        {/* Footer — entrada + problema */}
        <div className="border-t border-border px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Entrada:</span>{' '}
            {formatDate(order.entry_date)}
          </span>
          {order.problem_description && (
            <span className="text-xs text-muted-foreground truncate max-w-xs">
              <span className="font-medium text-foreground">Prob.:</span>{' '}
              {order.problem_description}
            </span>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
