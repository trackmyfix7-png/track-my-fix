import { FileText, Clock, Plus, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { BudgetCard } from '../components/BudgetCard'
import { ServiceRequestCard } from '../components/ServiceRequestCard'
import { useBudgets } from '../hooks/useBudgets'
import { usePendingServiceRequests } from '@/features/service-requests/hooks/useServiceRequest'

export function BudgetsPage() {
  const { data: budgets, isLoading: lB, isError: eB, refetch: rB } = useBudgets()
  const { data: requests, isLoading: lR, isError: eR, refetch: rR } = usePendingServiceRequests()

  if (lB || lR) return <LoadingState />
  if (eB || eR) return <ErrorState onRetry={() => { rB(); rR() }} />

  const pendingBudgets = budgets?.filter(
    (b) => b.status === 'awaiting_approval' || b.status === 'requested'
  ) ?? []

  const otherBudgets = budgets?.filter(
    (b) => b.status !== 'awaiting_approval' && b.status !== 'requested'
  ) ?? []

  const hasAnything = (requests?.length ?? 0) > 0 || (budgets?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        description="Solicitações e orçamentos da oficina"
        actions={
          <Button variant="accent" size="sm" asChild>
            <Link to="/solicitar-orcamento">
              <Plus className="h-4 w-4" />
              Solicitar orçamento
            </Link>
          </Button>
        }
      />

      {!hasAnything ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento ainda"
          description="Solicite um orçamento para um serviço e ele aparecerá aqui."
          action={{
            label: 'Solicitar orçamento',
            onClick: () => window.location.href = '/solicitar-orcamento',
          }}
        />
      ) : (
        <div className="space-y-8">

          {/* Orçamentos aguardando aprovação — prioridade máxima */}
          {pendingBudgets.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-brand-accent" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aguardando sua resposta ({pendingBudgets.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingBudgets.map((b) => (
                  <BudgetCard key={b.id} budget={b} highlight />
                ))}
              </div>
            </section>
          )}

          {/* Solicitações aguardando orçamento da oficina */}
          {requests && requests.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aguardando orçamento da oficina ({requests.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {requests.map((r) => (
                  <ServiceRequestCard key={r.id} request={r} />
                ))}
              </div>
            </section>
          )}

          {/* Histórico */}
          {otherBudgets.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Histórico
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherBudgets.map((b) => (
                  <BudgetCard key={b.id} budget={b} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}
