import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Info, MessageSquare, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import { useEmployeeServiceRequests, useEmployeeBudgets } from '../hooks/useEmployee'

type Tab = 'solicitacoes' | 'enviados'

export function FuncionarioOrcamentosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('solicitacoes')

  const { data: requests = [], isLoading: loadingReqs  } = useEmployeeServiceRequests()
  const { data: budgets  = [], isLoading: loadingBudgets } = useEmployeeBudgets()

  const newCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos recebidos"
        description="Solicitações dos clientes e orçamentos da oficina"
      />

      {/* Aviso somente leitura */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Orçamentos criados aqui precisam de revisão do administrador antes de serem enviados ao cliente.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: 'solicitacoes' as Tab, label: 'Solicitações dos clientes', icon: MessageSquare, badge: newCount },
          { key: 'enviados'     as Tab, label: 'Orçamentos enviados',       icon: FileText },
        ]).map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === key
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge != null && badge > 0 && (
              <Badge variant="accent" className="h-4 px-1.5 text-[10px]">{badge} novas</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Solicitações */}
      {activeTab === 'solicitacoes' && (
        loadingReqs ? <LoadingState /> :
        requests.length === 0 ? (
          <EmptyState title="Nenhuma solicitação pendente" className="py-14" />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="border bg-white">
                <CardContent className="flex items-start gap-4 p-4">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-semibold">
                      {getInitials(req.owner.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{req.owner.full_name}</span>
                      {req.status === 'pending' && (
                        <Badge variant="accent" className="h-4 px-1.5 text-[10px]">Nova</Badge>
                      )}
                      {req.status === 'analyzing' && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Em análise</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-brand-secondary">
                      {req.vehicle.brand} {req.vehicle.model} {req.vehicle.year} · {req.vehicle.plate}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                      {req.problem_description}
                    </p>
                    {req.category && (
                      <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {req.category}
                      </span>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {format(parseISO(req.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Orçamentos enviados */}
      {activeTab === 'enviados' && (
        loadingBudgets ? <LoadingState /> :
        budgets.length === 0 ? (
          <EmptyState title="Nenhum orçamento enviado ainda" className="py-14" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {['Nº', 'Veículo', 'Cliente', 'Total', 'Data', 'Status'].map((h) => (
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
                    {budgets.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs font-semibold text-brand-secondary">
                            #{b.budget_number}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {b.vehicle.brand} {b.vehicle.model} {b.vehicle.year}
                          <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                            {b.vehicle.plate}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {b.owner?.full_name ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold">
                          {formatCurrency(b.total_amount)}
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {format(parseISO(b.issued_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <BudgetStatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
