import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useWorkshopOrders } from '../hooks/useAdminVehicles'
import type { ServiceOrderStatus } from '@/types/database'
import { differenceInDays, parseISO } from 'date-fns'

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type TabKey = 'todos' | ServiceOrderStatus

// Ordem alinhada ao mockup — Recebido e Entregue no final por serem menos frequentes
const tabs: { key: TabKey; label: string }[] = [
  { key: 'todos',             label: 'Todos'             },
  { key: 'in_progress',       label: 'Em serviço'        },
  { key: 'diagnosis',         label: 'Diagnóstico'       },
  { key: 'awaiting_approval', label: 'Aguard. aprovação' },
  { key: 'ready',             label: 'Pronto'            },
  { key: 'received',          label: 'Recebido'          },
  { key: 'delivered',         label: 'Entregue'          },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminVeiculosPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('todos')
  const { data: orders, isLoading, isError, refetch } = useWorkshopOrders()

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  const all    = orders ?? []
  const active = all.filter((o) => o.status !== 'delivered')

  const filtered = activeTab === 'todos'
    ? active
    : all.filter((o) => o.status === activeTab)

  function countTab(key: TabKey) {
    if (key === 'todos')     return active.length
    if (key === 'delivered') return all.filter((o) => o.status === 'delivered').length
    return all.filter((o) => o.status === key).length
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Todos os veículos"
        description="Veículos atualmente na oficina"
        actions={
          <Button variant="accent" size="sm" asChild>
            <Link to="/admin/veiculos/novo">
              <Plus className="h-4 w-4" />
              Cadastrar veículo
            </Link>
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count    = countTab(tab.key)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'border border-border bg-white text-muted-foreground hover:border-brand-primary/30 hover:text-brand-primary'
              )}
            >
              {tab.label}
              <span className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhum veículo neste status" className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Veículo', 'Placa', 'Cliente', 'KM'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const daysIn  = differenceInDays(new Date(), parseISO(order.entry_date))
                    const isAlert = order.status !== 'delivered' && daysIn >= 4

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/admin/veiculos/${order.id}`}
                              className="text-sm font-semibold text-brand-secondary hover:underline"
                            >
                              {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
                            </Link>
                            {isAlert && (
                              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-brand-accent" aria-label={`${daysIn} dias na oficina`} />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                            {order.vehicle.plate}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground">
                          {order.vehicle.owner?.full_name ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {order.vehicle.mileage
                            ? order.vehicle.mileage.toLocaleString('pt-BR')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
