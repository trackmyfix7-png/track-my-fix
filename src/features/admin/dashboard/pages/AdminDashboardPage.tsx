import { format, isAfter, isSameDay, startOfMonth, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Car, Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import { differenceInDays, parseISO } from 'date-fns'
import { useWorkshopOrders } from '@/features/admin/veiculos/hooks/useAdminVehicles'
import { useQuery } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { fetchDashboardStats } from '../services/admin-dashboard.service'
import type { ServiceOrderStatus } from '@/types/database'
import type { WorkshopOrderRow } from '@/features/admin/veiculos/services/admin-vehicles.service'

// ─── Kanban config ────────────────────────────────────────────────────────────

const columns: {
  status: ServiceOrderStatus
  label:  string
  dot:    string
  headerBg:   string
  cardBorder: string
  badgeBg:    string
  badgeText:  string
  chartColor: string
}[] = [
  { status: 'received',          label: 'Recebido',       dot: 'bg-gray-400',        headerBg: 'bg-gray-50',            cardBorder: 'border-l-gray-300',         badgeBg: 'bg-gray-100',          badgeText: 'text-gray-500',      chartColor: '#9ca3af' },
  { status: 'diagnosis',         label: 'Diagnóstico',    dot: 'bg-brand-secondary', headerBg: 'bg-brand-secondary/10', cardBorder: 'border-l-brand-secondary',  badgeBg: 'bg-brand-secondary/10', badgeText: 'text-brand-secondary', chartColor: '#00A3E0' },
  { status: 'awaiting_approval', label: 'Aguard. Aprov.', dot: 'bg-amber-500',       headerBg: 'bg-amber-50',           cardBorder: 'border-l-amber-400',        badgeBg: 'bg-amber-50',          badgeText: 'text-amber-600',     chartColor: '#f59e0b' },
  { status: 'in_progress',       label: 'Em Serviço',     dot: 'bg-emerald-500',     headerBg: 'bg-emerald-50',         cardBorder: 'border-l-emerald-400',      badgeBg: 'bg-emerald-50',        badgeText: 'text-emerald-600',   chartColor: '#22c55e' },
  { status: 'ready',             label: 'Pronto',         dot: 'bg-purple-500',      headerBg: 'bg-purple-50',          cardBorder: 'border-l-purple-400',       badgeBg: 'bg-purple-50',         badgeText: 'text-purple-600',    chartColor: '#a855f7' },
]

// ─── Period filter ────────────────────────────────────────────────────────────

type Period = 'all' | 'today' | '7d' | 'month'

const periods: { key: Period; label: string }[] = [
  { key: 'all',   label: 'Todos'    },
  { key: 'today', label: 'Hoje'     },
  { key: '7d',    label: '7 dias'   },
  { key: 'month', label: 'Este mês' },
]

function filterByPeriod(orders: WorkshopOrderRow[], period: Period): WorkshopOrderRow[] {
  if (period === 'all') return orders
  const now = new Date()
  return orders.filter((o) => {
    const date = parseISO(o.entry_date)
    if (period === 'today')  return isSameDay(date, now)
    if (period === '7d')     return isAfter(date, subDays(now, 7))
    if (period === 'month')  return isAfter(date, startOfMonth(now))
    return true
  })
}

// ─── Vehicle card ─────────────────────────────────────────────────────────────

function VehicleCard({ order, col }: { order: WorkshopOrderRow; col: typeof columns[number] }) {
  const daysIn   = differenceInDays(new Date(), parseISO(order.entry_date))
  const hasAlert = daysIn >= 4

  return (
    <Link
      to={`/admin/veiculos/${order.id}`}
      className={cn(
        'block rounded-lg border bg-white p-3 shadow-sm border-l-4 hover:shadow-md transition-shadow',
        col.cardBorder
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-primary truncate">
            {order.vehicle.brand} {order.vehicle.model}
          </p>
          <p className="text-xs text-muted-foreground">{order.vehicle.year}</p>
        </div>
        {hasAlert && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-brand-accent mt-0.5" />}
      </div>
      <p className="mt-1.5 text-xs text-foreground/70 truncate">
        {order.vehicle.owner?.full_name ?? '—'}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', col.badgeBg, col.badgeText)}>
          {col.label}
        </span>
        <span className={cn('flex items-center gap-1 text-[10px] font-medium', hasAlert ? 'text-brand-accent' : 'text-muted-foreground')}>
          <Clock className="h-3 w-3" />
          {daysIn === 0 ? 'Hoje' : `${daysIn}d`}
        </span>
      </div>
    </Link>
  )
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({ col, orders }: { col: typeof columns[number]; orders: WorkshopOrderRow[] }) {
  return (
    <div className="flex min-w-[180px] flex-1 flex-col gap-2">
      <div className={cn('flex items-center gap-2 rounded-md px-3 py-2', col.headerBg)}>
        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', col.dot)} />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
          {col.label}
        </span>
        <span className="ml-auto flex-shrink-0 text-xs font-bold text-foreground/60">
          {orders.length}
        </span>
      </div>
      <div className="space-y-2">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white/50 py-4 text-center">
            <p className="text-xs text-muted-foreground">Nenhum</p>
          </div>
        ) : (
          orders.map((o) => <VehicleCard key={o.id} order={o} col={col} />)
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const today = format(new Date(), "d 'de' MMM yyyy", { locale: ptBR })
  const [period, setPeriod] = useState<Period>('all')

  const { data: workshop } = useWorkshop()
  const { data: orders = [] } = useWorkshopOrders()

  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard-stats', workshop?.id],
    queryFn:  () => fetchDashboardStats(workshop!.id),
    enabled:  !!workshop?.id,
  })

  const alertCount = orders.filter((o) => {
    const days = differenceInDays(new Date(), parseISO(o.entry_date))
    return days >= 4
  }).length

  const remaining = workshop?.capacity ? Math.max(0, workshop.capacity - orders.length) : null
  const isFull    = workshop?.capacity ? orders.length >= workshop.capacity : false

  const visibleOrders = filterByPeriod(orders, period)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard — ${today}`}
        description="Visão geral da oficina hoje"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Carros na oficina"
          value={workshop?.capacity ? `${orders.length} / ${workshop.capacity}` : String(orders.length)}
          subtitle={remaining !== null ? `${remaining} vaga${remaining !== 1 ? 's' : ''} disponível` : 'em atendimento'}
          icon={Car}
          variant={isFull ? 'accent' : 'default'}
        />
        <StatsCard
          label="Aguard. aprovação"
          value={String(stats?.pendingBudgets ?? '—')}
          subtitle="orçamentos pendentes"
          icon={Clock}
          variant="accent"
        />
        <StatsCard
          label={`Faturado em ${format(new Date(), 'MMM', { locale: ptBR })}`}
          value={stats ? formatCurrency(stats.monthlyRevenue) : '—'}
          subtitle="faturas pagas no mês"
          icon={DollarSign}
          variant="secondary"
        />
        <StatsCard
          label="Alertas de atraso"
          value={String(alertCount)}
          subtitle="veículos há 4+ dias"
          icon={AlertTriangle}
          variant={alertCount > 0 ? 'accent' : 'default'}
        />
      </div>

      {/* Kanban */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Veículos por status</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {visibleOrders.length} de {orders.length} veículo{orders.length !== 1 ? 's' : ''}
              {period !== 'all' && ` • ${periods.find(p => p.key === period)?.label}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Period pills */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    period === p.key
                      ? 'bg-white text-brand-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" className="gap-1 text-brand-secondary h-8 text-xs" asChild>
              <Link to="/admin/veiculos">
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        {/* Status summary bar */}
        <div className="mx-6 mb-3 flex flex-wrap gap-x-4 gap-y-1 border-b border-border pb-3">
          {columns.map((col) => {
            const count = visibleOrders.filter((o) => o.status === col.status).length
            return (
              <span key={col.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: col.chartColor }} />
                {col.label}
                <span className="font-semibold text-foreground">{count}</span>
              </span>
            )
          })}
        </div>

        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map((col) => (
              <KanbanColumn
                key={col.status}
                col={col}
                orders={visibleOrders.filter((o) => o.status === col.status)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
