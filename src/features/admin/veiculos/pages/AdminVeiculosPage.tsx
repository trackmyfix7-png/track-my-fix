import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleStatus = 'todos' | 'em_servico' | 'diagnostico' | 'aguard_aprovacao' | 'pronto'

interface AdminVehicleRow {
  id: string
  name: string
  plate: string
  client: string
  km: number
  status: Exclude<VehicleStatus, 'todos'>
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockVehicles: AdminVehicleRow[] = [
  { id: '1', name: 'Honda Civic 2021',       plate: 'ABC-1234', client: 'Carlos R.',  km: 72400, status: 'aguard_aprovacao' },
  { id: '2', name: 'VW Gol 2018',            plate: 'DEF-5678', client: 'Maria S.',   km: 62300, status: 'em_servico'       },
  { id: '3', name: 'Chevrolet Onix 2022',    plate: 'GHI-9012', client: 'Pedro L.',   km: 41800, status: 'diagnostico'      },
  { id: '4', name: 'Hyundai HB20 2023',      plate: 'JKL-3456', client: 'Felipe A.',  km: 18200, status: 'aguard_aprovacao' },
  { id: '5', name: 'Toyota Corolla 2020',    plate: 'MNO-7890', client: 'Roberto M.', km: 53600, status: 'diagnostico'      },
  { id: '6', name: 'Fiat Strada 2019',       plate: 'PQR-1122', client: 'Carlos R.',  km: 88500, status: 'em_servico'       },
  { id: '7', name: 'Chevrolet Onix 2022',    plate: 'STU-3344', client: 'Ana P.',     km: 29100, status: 'aguard_aprovacao' },
  { id: '8', name: 'Toyota Corolla 2019',    plate: 'VWX-5566', client: 'João F.',    km: 71300, status: 'pronto'           },
]

// ─── Filter tabs ───────────────────────────────────────────────────────────────

const tabs: { key: VehicleStatus; label: string }[] = [
  { key: 'todos',           label: 'Todos'            },
  { key: 'em_servico',      label: 'Em serviço'       },
  { key: 'diagnostico',     label: 'Diagnóstico'      },
  { key: 'aguard_aprovacao',label: 'Aguard. aprovação' },
  { key: 'pronto',          label: 'Pronto'           },
]

function getCount(status: VehicleStatus) {
  if (status === 'todos') return mockVehicles.length
  return mockVehicles.filter((v) => v.status === status).length
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminVeiculosPage() {
  const [activeTab, setActiveTab] = useState<VehicleStatus>('todos')

  const filtered =
    activeTab === 'todos'
      ? mockVehicles
      : mockVehicles.filter((v) => v.status === activeTab)

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
          const count = getCount(tab.key)
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
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Veículo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Placa
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    KM
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/veiculos/${v.id}`}
                        className="text-sm font-semibold text-brand-secondary hover:underline"
                      >
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                        {v.plate}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-foreground">{v.client}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-muted-foreground">
                        {v.km.toLocaleString('pt-BR')}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Nenhum veículo neste status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Veículos — lista completa com filtros por status e ações
      </p>
    </div>
  )
}
