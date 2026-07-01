import { useState } from 'react'
import { Car, FileText, DollarSign, Plus, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VehicleCard } from '../components/VehicleCard'
import { VehicleHistoryTable } from '../components/VehicleHistoryTable'
import { AddVehicleModal } from '../components/AddVehicleModal'
import { useVehicles } from '../hooks/useVehicles'
import { useDashboardSummary, useActiveServiceOrders, useRecentHistory } from '@/features/dashboard/hooks/useDashboard'
import { formatCurrency } from '@/lib/utils'

export function VehiclesPage() {
  const [modalOpen, setModalOpen] = useState(false)

  const { data: vehicles, isLoading: lV, isError: eV, refetch } = useVehicles()
  const { data: summary,      isLoading: lS } = useDashboardSummary()
  const { data: activeOrders, isLoading: lA } = useActiveServiceOrders()
  const { data: historyOrders, isLoading: lH } = useRecentHistory()

  if (lV || lS || lA || lH) return <LoadingState />
  if (eV) return <ErrorState onRetry={refetch} />

  function getActiveOrder(vehicleId: string) {
    return activeOrders?.find((o) => o.vehicle_id === vehicleId)
  }

  const vehiclesInService = vehicles?.filter((v) => !!getActiveOrder(v.id)) ?? []
  const otherVehicles     = vehicles?.filter((v) => !getActiveOrder(v.id)) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus veículos"
        description="Gerencie seus veículos e acompanhe os serviços"
        actions={
          <Button variant="accent" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo veículo
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Veículos ativos"
          value={String(summary?.activeVehicles ?? 0)}
          subtitle="na sua garagem"
          icon={Car}
          variant="default"
        />
        <StatsCard
          label="Orçamentos pendentes"
          value={
            summary && summary.pendingBudgets > 0
              ? formatCurrency(summary.pendingBudgetsAmount)
              : '—'
          }
          subtitle={
            summary && summary.pendingBudgets > 0 ? 'aguardando aprovação' : 'Nenhum pendente'
          }
          icon={FileText}
          variant="accent"
        />
        <StatsCard
          label="Total histórico"
          value={formatCurrency(summary?.totalHistory ?? 0)}
          subtitle="em serviços realizados"
          icon={DollarSign}
          variant="secondary"
        />
      </div>

      {/* Na oficina agora */}
      {vehiclesInService.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-brand-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Na oficina agora ({vehiclesInService.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehiclesInService.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                activeOrder={getActiveOrder(vehicle.id)}
                variant="active"
              />
            ))}
          </div>
        </section>
      )}

      {/* Minha garagem */}
      {otherVehicles.length > 0 && (
        <section>
          {vehiclesInService.length > 0 && (
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Minha garagem
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </section>
      )}

      {vehicles?.length === 0 && (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={Car}
              title="Nenhum veículo cadastrado"
              description="Adicione seu primeiro veículo para começar a acompanhar os serviços."
              action={{ label: 'Adicionar veículo', onClick: () => setModalOpen(true) }}
            />
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-brand-primary">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyOrders && historyOrders.length > 0 ? (
            <VehicleHistoryTable orders={historyOrders} showVehicle />
          ) : (
            <EmptyState title="Nenhum histórico ainda" className="py-8" />
          )}
        </CardContent>
      </Card>

      <AddVehicleModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
