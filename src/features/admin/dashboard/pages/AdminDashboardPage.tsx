import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Car, Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type KanbanStatus = 'diagnostico' | 'aguard_aprovacao' | 'em_servico' | 'pronto' | 'entregue'

interface AdminVehicle {
  id: string
  brand: string
  model: string
  year: number
  client: string
  daysIn: number
  status: KanbanStatus
  hasAlert: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockVehicles: AdminVehicle[] = [
  { id: '1', brand: 'Chevrolet', model: 'Onix',    year: 2022, client: 'Ana Paula',    daysIn: 1, status: 'diagnostico',      hasAlert: false },
  { id: '2', brand: 'Toyota',    model: 'Corolla',  year: 2020, client: 'Roberto M.',   daysIn: 4, status: 'diagnostico',      hasAlert: true  },
  { id: '3', brand: 'Fiat',      model: 'Uno',      year: 2015, client: 'Maria Silva',  daysIn: 2, status: 'aguard_aprovacao', hasAlert: false },
  { id: '4', brand: 'Honda',     model: 'Civic',    year: 2021, client: 'Carlos R.',    daysIn: 3, status: 'aguard_aprovacao', hasAlert: false },
  { id: '5', brand: 'Hyundai',   model: 'HB20',     year: 2021, client: 'João F.',      daysIn: 2, status: 'aguard_aprovacao', hasAlert: false },
  { id: '6', brand: 'VW',        model: 'Gol',      year: 2018, client: 'Felipe Lima',  daysIn: 5, status: 'em_servico',       hasAlert: true  },
  { id: '7', brand: 'Fiat',      model: 'Strada',   year: 2010, client: 'Carlos R.',    daysIn: 3, status: 'em_servico',       hasAlert: false },
  { id: '8', brand: 'Toyota',    model: 'Corolla',  year: 2019, client: 'Ana P.',       daysIn: 6, status: 'pronto',           hasAlert: true  },
]

// ─── Column config ─────────────────────────────────────────────────────────────

const columns: {
  key: KanbanStatus
  label: string
  dot: string
  headerBg: string
  cardBorder: string
  badgeBg: string
  badgeText: string
}[] = [
  {
    key: 'diagnostico',
    label: 'Diagnóstico',
    dot: 'bg-brand-secondary',
    headerBg: 'bg-brand-secondary/10',
    cardBorder: 'border-l-brand-secondary',
    badgeBg: 'bg-brand-secondary/10',
    badgeText: 'text-brand-secondary',
  },
  {
    key: 'aguard_aprovacao',
    label: 'Aguard. Aprov.',
    dot: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    cardBorder: 'border-l-amber-400',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
  },
  {
    key: 'em_servico',
    label: 'Em Serviço',
    dot: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    cardBorder: 'border-l-emerald-400',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
  },
  {
    key: 'pronto',
    label: 'Pronto',
    dot: 'bg-purple-500',
    headerBg: 'bg-purple-50',
    cardBorder: 'border-l-purple-400',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-600',
  },
  {
    key: 'entregue',
    label: 'Entregue',
    dot: 'bg-gray-400',
    headerBg: 'bg-gray-50',
    cardBorder: 'border-l-gray-300',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-500',
  },
]

// ─── Vehicle card ──────────────────────────────────────────────────────────────

function VehicleCard({ vehicle, col }: { vehicle: AdminVehicle; col: typeof columns[number] }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-3 shadow-sm border-l-4',
        col.cardBorder
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-primary truncate">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="text-xs text-muted-foreground">{vehicle.year}</p>
        </div>
        {vehicle.hasAlert && (
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-brand-accent mt-0.5" />
        )}
      </div>
      <p className="mt-1.5 text-xs text-foreground/70 truncate">{vehicle.client}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', col.badgeBg, col.badgeText)}>
          {col.label}
        </span>
        <span className={cn('flex items-center gap-1 text-[10px] font-medium', vehicle.daysIn >= 4 ? 'text-brand-accent' : 'text-muted-foreground')}>
          <Clock className="h-3 w-3" />
          {vehicle.daysIn}d
        </span>
      </div>
    </div>
  )
}

// ─── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({ col, vehicles }: { col: typeof columns[number]; vehicles: AdminVehicle[] }) {
  return (
    <div className="flex min-w-[180px] flex-1 flex-col gap-2">
      <div className={cn('flex items-center gap-2 rounded-md px-3 py-2', col.headerBg)}>
        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', col.dot)} />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
          {col.label}
        </span>
        <span className="ml-auto flex-shrink-0 text-xs font-bold text-foreground/60">
          {vehicles.length}
        </span>
      </div>
      <div className="space-y-2">
        {vehicles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white/50 py-4 text-center">
            <p className="text-xs text-muted-foreground">Nenhum</p>
          </div>
        ) : (
          vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} col={col} />)
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const today = format(new Date(), "d 'de' MMM yyyy", { locale: ptBR })
  const month = format(new Date(), 'MMMM yyyy', { locale: ptBR })

  const alertCount = mockVehicles.filter((v) => v.hasAlert).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard — ${today}`}
        description="Visão geral da oficina hoje"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Carros na oficina"
          value={String(mockVehicles.length)}
          subtitle="hoje"
          icon={Car}
          variant="default"
        />
        <StatsCard
          label="Aguard. aprovação"
          value="3"
          subtitle="orçamentos pendentes"
          icon={Clock}
          variant="accent"
        />
        <StatsCard
          label={`Faturado em ${format(new Date(), 'MMM', { locale: ptBR })}`}
          value={formatCurrency(4200)}
          subtitle="+13% vs mês anterior"
          icon={DollarSign}
          variant="secondary"
        />
        <StatsCard
          label="Alertas de atraso"
          value={String(alertCount)}
          subtitle="há 4+ dias"
          icon={AlertTriangle}
          variant={alertCount > 0 ? 'accent' : 'default'}
        />
      </div>

      {/* Kanban */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Veículos por status</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-brand-secondary h-8 text-xs">
            Ver todos <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map((col) => (
              <KanbanColumn
                key={col.key}
                col={col}
                vehicles={mockVehicles.filter((v) => v.status === col.key)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
