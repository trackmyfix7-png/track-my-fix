import { Link } from 'react-router-dom'
import { differenceInDays, parseISO } from 'date-fns'
import { AlertTriangle, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ServiceOrderStatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { useEmployeeOrders, useEmployeeWorkshop } from '../hooks/useEmployee'

const STATUS_COLOR: Record<string, string> = {
  received:          'border-l-gray-300',
  diagnosis:         'border-l-brand-secondary',
  awaiting_approval: 'border-l-amber-400',
  in_progress:       'border-l-emerald-400',
  ready:             'border-l-purple-400',
}

export function FuncionarioVeiculosPage() {
  const { data: workshop } = useEmployeeWorkshop()
  const { data: orders, isLoading, isError, refetch } = useEmployeeOrders()

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  const all = orders ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Veículos na oficina"
        description={workshop ? `${all.length} veículo${all.length !== 1 ? 's' : ''} em atendimento — ${workshop.name}` : 'Carregando...'}
      />

      {all.length === 0 ? (
        <EmptyState title="Nenhum veículo em atendimento no momento" className="py-20" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {all.map((order) => {
            const daysIn   = differenceInDays(new Date(), parseISO(order.entry_date))
            const hasAlert = daysIn >= 4
            const borderColor = STATUS_COLOR[order.status] ?? 'border-l-gray-300'

            return (
              <Link
                key={order.id}
                to={`/funcionario/ordens/${order.id}`}
                className={cn(
                  'block rounded-lg border bg-white p-4 shadow-sm border-l-4 hover:shadow-md transition-shadow',
                  borderColor
                )}
              >
                {/* Veículo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-primary truncate">
                      {order.vehicle.brand} {order.vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.vehicle.year}</p>
                  </div>
                  {hasAlert && (
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-brand-accent mt-0.5" />
                  )}
                </div>

                {/* Placa */}
                <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs">
                  {order.vehicle.plate}
                </span>

                {/* Cliente */}
                <p className="mt-2 text-sm text-foreground/70 truncate">
                  {order.vehicle.owner?.full_name ?? '—'}
                </p>

                {/* Rodapé */}
                <div className="mt-3 flex items-center justify-between">
                  <ServiceOrderStatusBadge status={order.status} />
                  <span className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    hasAlert ? 'text-brand-accent' : 'text-muted-foreground'
                  )}>
                    <Clock className="h-3 w-3" />
                    {daysIn === 0 ? 'Hoje' : `${daysIn}d`}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
