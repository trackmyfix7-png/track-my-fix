import { useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInDays, parseISO } from 'date-fns'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { useEmployeeOrders, useEmployeeWorkshop } from '../hooks/useEmployee'
import type { ServiceOrderStatus } from '@/types/database'

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type TabKey = 'todos' | ServiceOrderStatus

const TABS: { key: TabKey; label: string }[] = [
  { key: 'todos',             label: 'Todos'             },
  { key: 'received',          label: 'Recebido'          },
  { key: 'diagnosis',         label: 'Diagnóstico'       },
  { key: 'awaiting_approval', label: 'Aguard. aprovação' },
  { key: 'in_progress',       label: 'Em serviço'        },
  { key: 'ready',             label: 'Pronto'            },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export function FuncionarioOrdensPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('todos')
  const { data: workshop } = useEmployeeWorkshop()
  const { data: orders, isLoading, isError, refetch } = useEmployeeOrders()

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  const all = orders ?? []
  const filtered = activeTab === 'todos' ? all : all.filter((o) => o.status === activeTab)

  function count(key: TabKey) {
    if (key === 'todos') return all.length
    return all.filter((o) => o.status === key).length
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens em andamento"
        description={workshop ? `Oficina: ${workshop.name}` : 'Carregando...'}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
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
                {count(tab.key)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhuma ordem neste status" className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Veículo', 'Placa', 'Cliente', 'KM', 'Dias', 'Status'].map((h) => (
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
                  {filtered.map((order) => {
                    const daysIn  = differenceInDays(new Date(), parseISO(order.entry_date))
                    const isAlert = daysIn >= 4
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/funcionario/ordens/${order.id}`}
                            className="text-sm font-semibold text-brand-secondary hover:underline"
                          >
                            {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
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
                        <td className="px-5 py-3">
                          <span className={cn(
                            'text-sm font-medium',
                            isAlert ? 'text-brand-accent font-semibold' : 'text-muted-foreground'
                          )}>
                            {daysIn === 0 ? 'Hoje' : `${daysIn}d${isAlert ? ' ⚠' : ''}`}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <StatusBadge status={order.status} />
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
