import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Car, Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
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
import { fetchMonthlyRevenueHistory } from '@/features/admin/financeiro/services/admin-financeiro.service'
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
  {
    status: 'received',
    label:  'Recebido',
    dot:    'bg-gray-400',
    headerBg:   'bg-gray-50',
    cardBorder: 'border-l-gray-300',
    badgeBg:    'bg-gray-100',
    badgeText:  'text-gray-500',
    chartColor: '#9ca3af',
  },
  {
    status: 'diagnosis',
    label:  'Diagnóstico',
    dot:    'bg-brand-secondary',
    headerBg:   'bg-brand-secondary/10',
    cardBorder: 'border-l-brand-secondary',
    badgeBg:    'bg-brand-secondary/10',
    badgeText:  'text-brand-secondary',
    chartColor: '#00A3E0',
  },
  {
    status: 'awaiting_approval',
    label:  'Aguard. Aprov.',
    dot:    'bg-amber-500',
    headerBg:   'bg-amber-50',
    cardBorder: 'border-l-amber-400',
    badgeBg:    'bg-amber-50',
    badgeText:  'text-amber-600',
    chartColor: '#f59e0b',
  },
  {
    status: 'in_progress',
    label:  'Em Serviço',
    dot:    'bg-emerald-500',
    headerBg:   'bg-emerald-50',
    cardBorder: 'border-l-emerald-400',
    badgeBg:    'bg-emerald-50',
    badgeText:  'text-emerald-600',
    chartColor: '#22c55e',
  },
  {
    status: 'ready',
    label:  'Pronto',
    dot:    'bg-purple-500',
    headerBg:   'bg-purple-50',
    cardBorder: 'border-l-purple-400',
    badgeBg:    'bg-purple-50',
    badgeText:  'text-purple-600',
    chartColor: '#a855f7',
  },
]

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
        {hasAlert && (
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-brand-accent mt-0.5" />
        )}
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

// ─── Revenue tooltip ─────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground capitalize">{label}</p>
      <p className="text-brand-secondary font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ─── Capacity bar ─────────────────────────────────────────────────────────────

function CapacityBar({ current, capacity }: { current: number; capacity: number }) {
  const pct = Math.min(100, Math.round((current / capacity) * 100))
  const isFull = current >= capacity
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isFull ? 'bg-brand-accent' : 'bg-brand-secondary')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{pct}% ocupado</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const today = format(new Date(), "d 'de' MMM yyyy", { locale: ptBR })
  const { data: workshop } = useWorkshop()

  const { data: orders = [] } = useWorkshopOrders()

  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard-stats', workshop?.id],
    queryFn:  () => fetchDashboardStats(workshop!.id),
    enabled:  !!workshop?.id,
  })

  const { data: revenueHistory } = useQuery({
    queryKey: ['admin', 'revenue-history', workshop?.id],
    queryFn:  () => fetchMonthlyRevenueHistory(workshop!.id),
    enabled:  !!workshop?.id,
  })

  const alertCount = orders.filter((o) => {
    const days = differenceInDays(new Date(), parseISO(o.entry_date))
    return days >= 4
  }).length

  const remaining = workshop?.capacity ? Math.max(0, workshop.capacity - orders.length) : null
  const isFull    = workshop?.capacity ? orders.length >= workshop.capacity : false

  // Status distribution for mini donut
  const statusDist = columns.map((col) => ({
    name:  col.label,
    value: orders.filter((o) => o.status === col.status).length,
    color: col.chartColor,
  })).filter((d) => d.value > 0)

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

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendência de receita</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueHistory ?? []}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00A3E0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00A3E0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <RTooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00A3E0"
                    strokeWidth={2}
                    fill="url(#areaGrad)"
                    dot={{ fill: '#00A3E0', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status atual</CardTitle>
            <p className="text-xs text-muted-foreground">{orders.length} veículo{orders.length !== 1 ? 's' : ''} na oficina</p>
          </CardHeader>
          <CardContent>
            {statusDist.length === 0 ? (
              <div className="flex h-[160px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum veículo</p>
              </div>
            ) : (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(v, name) => [`${v} veículo${Number(v) !== 1 ? 's' : ''}`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Legend */}
            <div className="mt-1 space-y-1">
              {columns.map((col) => {
                const count = orders.filter((o) => o.status === col.status).length
                if (count === 0) return null
                return (
                  <div key={col.status} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: col.chartColor }} />
                      {col.label}
                    </span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
            {workshop?.capacity && (
              <CapacityBar current={orders.length} capacity={workshop.capacity} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kanban */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Veículos por status</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-brand-secondary h-8 text-xs" asChild>
            <Link to="/admin/veiculos">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map((col) => (
              <KanbanColumn
                key={col.status}
                col={col}
                orders={orders.filter((o) => o.status === col.status)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
