import { useState } from 'react'
import { Car, FileText, DollarSign, History, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ActiveVehicleCard } from '../components/ActiveVehicleCard'
import { RecentHistoryTable } from '../components/RecentHistoryTable'
import { useDashboardSummary, useActiveServiceOrders, useRecentHistory } from '../hooks/useDashboard'
import { useVehicles } from '@/features/vehicles/hooks/useVehicles'
import { AddVehicleModal } from '@/features/vehicles/components/AddVehicleModal'
import { formatCurrency } from '@/lib/utils'
import { useAuthContext } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import type { Vehicle, ServiceOrder } from '@/types/database'

// ─── Stats Card ───────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, subtitle, icon: Icon, variant = 'default',
}: {
  label:    string
  value:    string
  subtitle: string
  icon:     React.ElementType
  variant?: 'default' | 'accent' | 'secondary'
}) {
  const styles = {
    default:   { border: 'border-l-brand-primary/40', value: 'text-brand-primary',    icon: 'bg-brand-primary/10 text-brand-primary'    },
    accent:    { border: 'border-l-brand-accent',     value: 'text-brand-accent',      icon: 'bg-brand-accent/10 text-brand-accent'      },
    secondary: { border: 'border-l-brand-secondary',  value: 'text-brand-secondary',   icon: 'bg-brand-secondary/10 text-brand-secondary' },
  }[variant]

  return (
    <div className={cn('flex items-center gap-4 rounded-xl border border-border border-l-4 bg-white p-4 shadow-sm', styles.border)}>
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', styles.icon)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
        <p className={cn('text-xl font-bold leading-none mt-0.5', styles.value)}>{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </div>
  )
}

// ─── Garage Card (veículo sem OS ativa) ──────────────────────────────────────

function GarageCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="border-l-4 border-l-border overflow-hidden shadow-sm">
      <CardContent className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted border border-border overflow-hidden">
              {vehicle.photo_url ? (
                <img src={vehicle.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Car className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-brand-primary leading-tight">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </p>
              <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                {vehicle.plate && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {vehicle.plate}
                  </span>
                )}
                {vehicle.mileage && (
                  <span className="text-xs text-muted-foreground">
                    {vehicle.mileage.toLocaleString('pt-BR')} km
                  </span>
                )}
                {vehicle.color && (
                  <span className="text-xs text-muted-foreground">{vehicle.color}</span>
                )}
              </div>
            </div>
          </div>
          <span className="flex-shrink-0 text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted border border-border">
            Sem atendimento
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [addModalOpen, setAddModalOpen] = useState(false)

  const { user }      = useAuthContext()
  const summary       = useDashboardSummary()
  const activeOrders  = useActiveServiceOrders()
  const recentHistory = useRecentHistory()
  const vehicles      = useVehicles()

  const isLoading = summary.isLoading || activeOrders.isLoading || recentHistory.isLoading || vehicles.isLoading
  const isError   = summary.isError   || activeOrders.isError   || recentHistory.isError   || vehicles.isError

  function refetchAll() {
    summary.refetch()
    activeOrders.refetch()
    recentHistory.refetch()
    vehicles.refetch()
  }

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetchAll} />

  const d          = summary.data!
  const firstName  = user?.profile.full_name.split(' ')[0] ?? 'você'
  const hasHistory = (recentHistory.data?.length ?? 0) > 0
  const allVehicles = vehicles.data ?? []

  function getActiveOrder(vehicleId: string): ServiceOrder | undefined {
    return activeOrders.data?.find((o) => o.vehicle_id === vehicleId)
  }

  return (
    <div className="space-y-6">

      {/* Saudação */}
      <div>
        <h1 className="text-xl font-bold text-brand-primary">
          Olá, {firstName} 👋
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Acompanhe seus veículos e serviços
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Na oficina agora"
          value={String(d.activeVehicles)}
          subtitle={d.activeVehicles === 1 ? 'em atendimento' : `${d.activeVehicles} em atendimento`}
          icon={Car}
          variant="default"
        />
        <SummaryCard
          label="Orçamento pendente"
          value={d.pendingBudgets > 0 ? formatCurrency(d.pendingBudgetsAmount) : '—'}
          subtitle={d.pendingBudgets > 0 ? 'aguardando aprovação' : 'nenhum pendente'}
          icon={FileText}
          variant={d.pendingBudgets > 0 ? 'accent' : 'default'}
        />
        <SummaryCard
          label="Total histórico"
          value={d.totalHistory > 0 ? formatCurrency(d.totalHistory) : '—'}
          subtitle={d.totalVisits > 0 ? `em ${d.totalVisits} visit${d.totalVisits !== 1 ? 'as' : 'a'}` : 'sem histórico ainda'}
          icon={DollarSign}
          variant="secondary"
        />
      </div>

      {/* Minha garagem */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Minha garagem
          </h2>
          <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Novo veículo
          </Button>
        </div>

        {allVehicles.length > 0 ? (
          <div className="space-y-3">
            {allVehicles.map((vehicle) => {
              const order = getActiveOrder(vehicle.id)
              return order
                ? <ActiveVehicleCard key={vehicle.id} order={order} />
                : <GarageCard key={vehicle.id} vehicle={vehicle} />
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10">
              <EmptyState
                icon={Car}
                title="Nenhum veículo cadastrado"
                description="Adicione seu primeiro veículo para começar a acompanhar os serviços."
                action={{ label: 'Adicionar veículo', onClick: () => setAddModalOpen(true) }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold text-foreground">Histórico</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          {hasHistory ? (
            <RecentHistoryTable orders={recentHistory.data!} />
          ) : (
            <EmptyState
              title="Sem histórico ainda"
              description="Serviços concluídos aparecerão aqui."
              className="py-10"
            />
          )}
        </CardContent>
      </Card>

      <AddVehicleModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

    </div>
  )
}
