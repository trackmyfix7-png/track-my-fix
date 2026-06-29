import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { InvoiceStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { fetchFinanceiroStats, fetchRecentInvoices } from '../services/admin-financeiro.service'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useFinanceiro() {
  const { data: workshop } = useWorkshop()
  const statsQuery = useQuery({
    queryKey: ['admin', 'financeiro-stats', workshop?.id],
    queryFn:  () => fetchFinanceiroStats(workshop!.id),
    enabled:  !!workshop?.id,
  })
  const invoicesQuery = useQuery({
    queryKey: ['admin', 'financeiro-invoices', workshop?.id],
    queryFn:  () => fetchRecentInvoices(workshop!.id),
    enabled:  !!workshop?.id,
  })
  return { stats: statsQuery.data, invoices: invoicesQuery.data, isLoading: statsQuery.isLoading }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminFinanceiroPage() {
  const month = format(new Date(), 'MMMM yyyy', { locale: ptBR })
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1)

  const { stats, invoices, isLoading } = useFinanceiro()

  if (isLoading) return <LoadingState />

  const approvalPct = stats ? Math.round(stats.approvalRate) : 0
  const avgDays     = stats ? stats.avgDaysInShop.toFixed(1).replace('.', ',') : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Financeiro — ${monthCapitalized}`}
        description="Resumo financeiro do mês"
      />

      {/* Stats */}
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
                  <tr className="border-b border-border bg-muted/50">
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
                        inv.status === 'overdue' && 'bg-red-50/40'
                      )}
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-semibold text-brand-secondary">
                          #{inv.invoice_number}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm">
                        {inv.vehicle.brand} {inv.vehicle.model}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {inv.owner?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold">
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
