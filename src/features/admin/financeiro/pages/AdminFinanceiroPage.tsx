import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'

// ─── Mock data ────────────────────────────────────────────────────────────────

const topServices = [
  { name: 'Freios',       count: 17 },
  { name: 'Troca de óleo', count: 12 },
  { name: 'Alinhamento',  count: 8  },
  { name: 'Amortecedor',  count: 6  },
  { name: 'Lavagem',      count: 4  },
]

const recentInvoices = [
  { id: '1', client: 'Carlos R.', amount: 980,  status: 'pending' as const },
  { id: '2', client: 'Maria S.',  amount: 450,  status: 'pending' as const },
  { id: '3', client: 'João F.',   amount: 580,  status: 'paid'    as const },
  { id: '4', client: 'Ana P.',    amount: 590,  status: 'paid'    as const },
]

// ─── Bar chart ────────────────────────────────────────────────────────────────

function ServicesBarChart() {
  const max = Math.max(...topServices.map((s) => s.count))

  return (
    <div className="space-y-3">
      {topServices.map((service) => (
        <div key={service.name} className="flex items-center gap-3">
          <span className="w-28 flex-shrink-0 text-xs text-foreground truncate">{service.name}</span>
          <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-secondary transition-all"
              style={{ width: `${(service.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 flex-shrink-0 text-xs font-semibold text-brand-primary text-right">
            {service.count}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Invoices table ────────────────────────────────────────────────────────────

function InvoicesTable() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 px-2 pb-1 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Valor</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Status</span>
      </div>
      {recentInvoices.map((inv) => (
        <div key={inv.id} className="grid grid-cols-3 items-center rounded-md px-2 py-2 hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium text-foreground">{inv.client}</span>
          <span className="text-sm font-semibold text-brand-primary text-right">{formatCurrency(inv.amount)}</span>
          <div className="flex justify-end">
            <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
              {inv.status === 'paid' ? 'Pago' : 'Pendente'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminFinanceiroPage() {
  const month = format(new Date(), 'MMMM yyyy', { locale: ptBR })
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1)

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
          value={formatCurrency(4200)}
          subtitle="+13% vs mês anterior"
          icon={DollarSign}
          variant="secondary"
        />
        <StatsCard
          label="Ticket médio"
          value={formatCurrency(620)}
          subtitle="por veículo atendido"
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          label="Taxa de aprovação"
          value="78%"
          subtitle="dos orçamentos aprovados"
          icon={CheckCircle2}
          variant="secondary"
        />
        <StatsCard
          label="Tempo médio"
          value="2,4 dias"
          subtitle="permanência na oficina"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Charts + Invoices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Serviços mais executados —{' '}
              <span className="font-normal text-muted-foreground">
                {format(new Date(), 'MMMM', { locale: ptBR })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServicesBarChart />
          </CardContent>
        </Card>

        {/* Recent invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Últimas faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoicesTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
