import { Link } from 'react-router-dom'
import { differenceInDays, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Car, ChevronRight, Info } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ServiceOrderStatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { useEmployeeOrders, useEmployeeWorkshop } from '../hooks/useEmployee'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: number
  sub: string
  accent?: boolean
}) {
  return (
    <Card className={cn('border-l-4', accent ? 'border-l-brand-accent' : 'border-l-brand-secondary')}>
      <CardContent className="pb-3 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('mt-1 text-3xl font-bold', accent ? 'text-brand-accent' : 'text-brand-primary')}>
          {value}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

// ─── Alert badge ──────────────────────────────────────────────────────────────

function AlertBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2 py-0.5 text-[11px] font-semibold text-brand-accent">
      <AlertTriangle className="h-3 w-3" />
      {days} dias — alerta
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function FuncionarioDashboardPage() {
  const { data: workshop } = useEmployeeWorkshop()
  const { data: orders, isLoading, isError, refetch } = useEmployeeOrders()

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  const all   = orders ?? []
  const today = new Date()

  const totalVehicles   = all.length
  const awaitingCount   = all.filter((o) => o.status === 'awaiting_approval').length
  const inProgressCount = all.filter((o) => o.status === 'in_progress').length
  const alertCount      = all.filter((o) => differenceInDays(today, parseISO(o.entry_date)) >= 4).length

  const dateLabel = format(today, "d MMM yyyy", { locale: ptBR })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard — ${dateLabel}`}
        description={workshop?.name}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Carros na oficina"  value={totalVehicles}   sub="hoje"              />
        <StatCard label="Aguard. orçamento"  value={awaitingCount}   sub="solicitações novas" />
        <StatCard label="Em serviço hoje"    value={inProgressCount} sub="em andamento"      />
        <StatCard label="Alertas de atraso"  value={alertCount}      sub="mais de 3 dias"    accent />
      </div>

      {/* Admin-only notice */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Financeiro, métricas gerenciais e configurações da oficina estão disponíveis apenas para administradores.
        </p>
      </div>

      {/* Vehicle table */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Car className="h-4 w-4" />
              Veículos ativos — visão geral
            </CardTitle>
            <Link
              to="/funcionario/veiculos"
              className="flex items-center gap-1 text-xs font-medium text-brand-secondary hover:underline"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          {all.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhum veículo em atendimento
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-border bg-muted/50">
                    {['Veículo', 'Cliente', 'Entrada', 'Problema relatado', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {all.map((order) => {
                    const daysIn  = differenceInDays(today, parseISO(order.entry_date))
                    const isAlert = daysIn >= 4
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/funcionario/ordens/${order.id}`}
                            className="text-sm font-semibold text-brand-secondary hover:underline"
                          >
                            {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
                            {' · '}
                            <span className="font-mono font-medium text-foreground/70">
                              {order.vehicle.plate}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground">
                          {order.vehicle.owner?.full_name ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">
                              {format(parseISO(order.entry_date), 'dd/MM', { locale: ptBR })}
                            </span>
                            {isAlert && <AlertBadge days={daysIn} />}
                          </div>
                        </td>
                        <td className="max-w-[220px] truncate px-5 py-3 text-sm text-muted-foreground">
                          {order.problem_description ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <ServiceOrderStatusBadge status={order.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
