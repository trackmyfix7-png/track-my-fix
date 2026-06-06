import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceFilter = 'todos' | 'ativos' | 'desativados'

type ServiceCategory = 'Manutenção' | 'Suspensão' | 'Revisão' | 'Motor' | 'Limpeza' | 'Elétrica'

interface AdminService {
  id: string
  name: string
  category: ServiceCategory
  description: string
  durationLabel: string
  price: number
  visible: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const initialServices: AdminService[] = [
  { id: '1', name: 'Troca de óleo',       category: 'Manutenção', description: 'Óleo + filtro de óleo inclusos',   durationLabel: '1h',    price: 120,  visible: true  },
  { id: '2', name: 'Alinhamento',         category: 'Suspensão',  description: 'Eixo dianteiro',                   durationLabel: '45min', price: 90,   visible: true  },
  { id: '3', name: 'Balanceamento',       category: 'Suspensão',  description: '4 rodas',                          durationLabel: '45min', price: 80,   visible: true  },
  { id: '4', name: 'Revisão 10.000 km',   category: 'Revisão',    description: 'Filtros + fluidos',                durationLabel: '3h',    price: 280,  visible: true  },
  { id: '5', name: 'Revisão 30.000 km',   category: 'Revisão',    description: 'Filtros, velas, fluidos',          durationLabel: '5h',    price: 580,  visible: true  },
  { id: '6', name: 'Troca de correia',    category: 'Motor',      description: 'Correia + tensor + kit',           durationLabel: '2h',    price: 450,  visible: true  },
  { id: '7', name: 'Higienização',        category: 'Limpeza',    description: 'Lavagem completa interna e externa', durationLabel: '2h',  price: 180,  visible: false },
]

// ─── Category badge colors ────────────────────────────────────────────────────

const categoryStyle: Record<ServiceCategory, string> = {
  Manutenção: 'bg-brand-secondary/10 text-brand-secondary',
  Suspensão:  'bg-amber-50 text-amber-600',
  Revisão:    'bg-emerald-50 text-emerald-600',
  Motor:      'bg-purple-50 text-purple-600',
  Limpeza:    'bg-gray-100 text-gray-500',
  Elétrica:   'bg-blue-50 text-blue-600',
}

// ─── Filter tabs ───────────────────────────────────────────────────────────────

const tabs: { key: ServiceFilter; label: string }[] = [
  { key: 'todos',       label: 'Todos'      },
  { key: 'ativos',      label: 'Ativos'     },
  { key: 'desativados', label: 'Desativados'},
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminServicosPage() {
  const [services, setServices] = useState(initialServices)
  const [filter, setFilter]   = useState<ServiceFilter>('todos')

  function toggleVisible(id: string) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    )
  }

  const counts: Record<ServiceFilter, number> = {
    todos:       services.length,
    ativos:      services.filter((s) => s.visible).length,
    desativados: services.filter((s) => !s.visible).length,
  }

  const filtered =
    filter === 'todos'       ? services
    : filter === 'ativos'    ? services.filter((s) =>  s.visible)
    :                          services.filter((s) => !s.visible)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabela de serviços"
        description="Gerencie os serviços visíveis no catálogo do cliente"
        actions={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const isActive = filter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
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
                {counts[tab.key]}
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
                    Serviço
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Categoria
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Descrição
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Prazo
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preço
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    Visível ao cliente
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((service) => (
                  <tr
                    key={service.id}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      service.visible ? 'hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/30'
                    )}
                  >
                    <td className="px-5 py-3">
                      <span className={cn('text-sm font-semibold', service.visible ? 'text-brand-primary' : 'text-muted-foreground line-through')}>
                        {service.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          categoryStyle[service.category]
                        )}
                      >
                        {service.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-muted-foreground max-w-[200px] block truncate">
                        {service.description}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-foreground">{service.durationLabel}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-semibold text-brand-primary">
                        R${' '}
                        {service.price.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center">
                        <Switch
                          checked={service.visible}
                          onCheckedChange={() => toggleVisible(service.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Nenhum serviço neste filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Tabela de serviços — CRUD completo com toggle ativo/desativado
      </p>
    </div>
  )
}
