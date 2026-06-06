import { Car, FileText, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActiveVehicleCard } from '../components/ActiveVehicleCard'
import { RecentHistoryTable } from '../components/RecentHistoryTable'
import { useDashboardSummary, useActiveServiceOrders, useRecentHistory } from '../hooks/useDashboard'
import { formatCurrency } from '@/lib/utils'
import { useAuthContext } from '@/contexts/AuthContext'

export function DashboardPage() {
  const { user } = useAuthContext()
  const summary = useDashboardSummary()
  const activeOrders = useActiveServiceOrders()
  const recentHistory = useRecentHistory()

  const isLoading = summary.isLoading || activeOrders.isLoading || recentHistory.isLoading
  const isError = summary.isError || activeOrders.isError || recentHistory.isError

  function refetchAll() {
    summary.refetch()
    activeOrders.refetch()
    recentHistory.refetch()
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetchAll} />

  const data = summary.data!

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${user?.profile.full_name.split(' ')[0]} 👋`}
        description="Acompanhe seus veículos e serviços"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Veículos ativos"
          value={String(data.activeVehicles)}
          subtitle={data.activeVehicles === 1 ? '1 na sua garage' : `${data.activeVehicles} na sua garage`}
          icon={Car}
          variant="default"
        />
        <StatsCard
          label="Orçamentos pendentes"
          value={data.pendingBudgets > 0 ? formatCurrency(data.pendingBudgetsAmount) : '—'}
          subtitle={
            data.pendingBudgets > 0
              ? `${data.pendingBudgets} aguardando aprovação`
              : 'Nenhum pendente'
          }
          icon={FileText}
          variant="accent"
        />
        <StatsCard
          label="Total histórico"
          value={formatCurrency(data.totalHistory)}
          subtitle="em serviços realizados"
          icon={DollarSign}
          variant="secondary"
        />
      </div>

      {/* Active vehicle */}
      {activeOrders.data && activeOrders.data.length > 0 ? (
        <div className="space-y-3">
          {activeOrders.data.map((order) => (
            <ActiveVehicleCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={Car}
              title="Nenhum veículo na oficina"
              description="Quando um veículo estiver em serviço, aparecerá aqui."
            />
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-brand-primary">Histórico recente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentHistory.data && recentHistory.data.length > 0 ? (
            <RecentHistoryTable orders={recentHistory.data} />
          ) : (
            <EmptyState
              title="Nenhum histórico"
              description="Serviços concluídos aparecerão aqui."
              className="py-8"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
