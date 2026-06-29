import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { InvoiceStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchFinanceiroStats,
  fetchRecentInvoices,
  fetchMonthlyRevenueHistory,
  fetchInvoiceStatusBreakdown,
} from '../services/admin-financeiro.service'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useFinanceiro() {
  const { data: workshop } = useWorkshop()
  const wid = workshop?.id

  const statsQuery    = useQuery({ queryKey: ['admin', 'financeiro-stats',   wid], queryFn: () => fetchFinanceiroStats(wid!),            enabled: !!wid })
  const invoicesQuery = useQuery({ queryKey: ['admin', 'financeiro-invoices', wid], queryFn: () => fetchRecentInvoices(wid!),            enabled: !!wid })
  const historyQuery  = useQuery({ queryKey: ['admin', 'revenue-history',    wid], queryFn: () => fetchMonthlyRevenueHistory(wid!),      enabled: !!wid })
  const statusQuery   = useQuery({ queryKey: ['admin', 'invoice-status',     wid], queryFn: () => fetchInvoiceStatusBreakdown(wid!),     enabled: !!wid })

  return {
    stats:    statsQuery.data,
    invoices: invoicesQuery.data,
    history:  historyQuery.data,
    breakdown: statusQuery.data,
    isLoading: statsQuery.isLoading,
  }
}

// ─── Custom tooltip for bar chart ─────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground capitalize">{label}</p>
      <p className="text-brand-secondary font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminFinanceiroPage() {
  const month = format(new Date(), 'MMMM yyyy', { locale: ptBR })
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1)

  const { stats, invoices, history, breakdown, isLoading } = useFinanceiro()

  if (isLoading) return <LoadingState />

  const approvalPct = stats ? Math.round(stats.approvalRate) : 0
  const avgDays     = stats ? stats.avgDaysInShop.toFixed(1).replace('.', ',') : '—'

  const totalInvoices = breakdown ? (breakdown.paid + breakdown.pending + breakdown.overdue) : 0
  const pieData = breakdown && totalInvoices > 0 ? [
    { name: 'Pagas',    value: breakdown.paid,    color: '#22c55e' },
    { name: 'Pendentes', value: breakdown.pending, color: '#f59e0b' },
    { name: 'Vencidas', value: breakdown.overdue,  color: '#ef4444' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Financeiro — ${monthCapitalized}`}
        description="Resumo financeiro e tendências"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Faturamento"
          value={stats ? formatCurrency(stats.monthlyRevenue) : '—'}
          subtitle="faturas pagas no mês"
          icon={DollarSign}
          variant="secondary"
        />
        <StatsCard
          label="Ticket médio"
          value={stats ? formatCurrency(stats.avgTicket) : '—'}
          subtitle="por fatura paga"
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          label="Taxa de aprovação"
          value={stats ? `${approvalPct}%` : '—'}
          subtitle="dos orçamentos"
          icon={CheckCircle2}
          variant="secondary"
        />
        <StatsCard
          label="Tempo médio"
          value={stats ? `${avgDays} dias` : '—'}
          subtitle="permanência na oficina"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receita mensal</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 6 meses — faturas pagas</p>
          </CardHeader>
          <CardContent>
            {!history || history.every(h => h.revenue === 0) ? (
              <div className="flex h-[200px] items-center justify-center">
                <EmptyState title="Sem dados de faturamento ainda" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history} barSize={28} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00A3E0" stopOpacity={1} />
                        <stop offset="100%" stopColor="#00A3E0" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#888', textTransform: 'capitalize' }}
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
                    <RTooltip content={<RevenueTooltip />} cursor={{ fill: '#00A3E010' }} />
                    <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice status donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Situação das faturas</CardTitle>
            <p className="text-xs text-muted-foreground">Todas as faturas</p>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center">
                <EmptyState title="Sem faturas" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span style={{ fontSize: 11, color: '#666' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Faturas recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!invoices || invoices.length === 0 ? (
            <EmptyState title="Nenhuma fatura registrada ainda" className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Nº', 'Veículo', 'Cliente', 'Valor', 'Vencimento', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:text-right"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className={cn(
                        'border-b border-border last:border-0 hover:bg-muted/40 transition-colors',
                        inv.status === 'overdue' && 'bg-red-50/50'
                      )}
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-semibold text-brand-secondary">
                          #{inv.invoice_number}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium">
                        {inv.vehicle.brand} {inv.vehicle.model}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {inv.owner?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-brand-primary">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {inv.due_date
                          ? format(parseISO(inv.due_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
