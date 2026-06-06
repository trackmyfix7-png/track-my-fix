import { useState } from 'react'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency, getInitials } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceRequest {
  id: string
  clientName: string
  vehicle: string
  description: string
  createdAt: string
  isNew: boolean
}

interface BudgetItem {
  id: string
  description: string
  category: 'Peça' | 'Serviço'
  qty: number
  unitPrice: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockRequests: ServiceRequest[] = [
  {
    id: '1',
    clientName: 'Ana Paula',
    vehicle: 'Uno 2015',
    description: 'Barulho no freio ao descer ladeira, vibração na roda dianteira esquerda ao frear.',
    createdAt: '2026-06-04',
    isNew: true,
  },
  {
    id: '2',
    clientName: 'Roberto M.',
    vehicle: 'Corolla 2020',
    description: 'Troca dos 4 discos completo com pastilhas e pneus traseiros.',
    createdAt: '2026-06-04',
    isNew: true,
  },
  {
    id: '3',
    clientName: 'João F.',
    vehicle: 'HB20 2021',
    description: 'Revisão completa dos 30.000 km conforme manual.',
    createdAt: '2026-06-03',
    isNew: true,
  },
]

const mockClients = ['Ana Paula', 'Roberto M.', 'João F.', 'Carlos Ribeiro', 'Maria Silva']
const mockVehicles: Record<string, string[]> = {
  'Ana Paula':     ['Uno 2015'],
  'Roberto M.':   ['Corolla 2020'],
  'João F.':      ['HB20 2021'],
  'Carlos Ribeiro': ['Civic 2021', 'Strada 2010'],
  'Maria Silva':  ['Gol 2018'],
}

const initialItems: BudgetItem[] = [
  { id: '1', description: 'Disco de freio',   category: 'Peça',    qty: 2, unitPrice: 280 },
  { id: '2', description: 'Pastilha diant.',  category: 'Peça',    qty: 1, unitPrice: 120 },
  { id: '3', description: 'Mão de obra',      category: 'Serviço', qty: 1, unitPrice: 200 },
]

// ─── Request card ──────────────────────────────────────────────────────────────

function RequestCard({ req, selected, onSelect }: {
  req: ServiceRequest
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-colors',
        selected
          ? 'border-brand-secondary bg-brand-secondary/5'
          : 'border-border bg-white hover:border-brand-secondary/50'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-semibold">
            {getInitials(req.clientName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{req.clientName}</span>
            {req.isNew && (
              <Badge variant="accent" className="h-4 px-1.5 text-[10px]">Nova</Badge>
            )}
          </div>
          <p className="text-xs text-brand-secondary font-medium">{req.vehicle}</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{req.description}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Create budget form ────────────────────────────────────────────────────────

function CreateBudgetPanel() {
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [items, setItems] = useState<BudgetItem[]>(initialItems)
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({ category: 'Peça', qty: 1 })

  const vehicles = selectedClient ? (mockVehicles[selectedClient] ?? []) : []
  const total = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)

  function handleClientChange(value: string) {
    setSelectedClient(value)
    setSelectedVehicle('')
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function confirmAddItem() {
    if (!newItem.description || !newItem.unitPrice) return
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        description: newItem.description!,
        category: newItem.category as 'Peça' | 'Serviço',
        qty: newItem.qty ?? 1,
        unitPrice: Number(newItem.unitPrice),
      },
    ])
    setNewItem({ category: 'Peça', qty: 1 })
    setAddingItem(false)
  }

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Criar novo orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cliente */}
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Select value={selectedClient} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {mockClients.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Veículo */}
        <div className="space-y-1.5">
          <Label>Veículo</Label>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={!selectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar veículo" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          <Label>Itens</Label>
          <div className="rounded-md border border-border overflow-hidden">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2',
                  idx < items.length - 1 ? 'border-b border-border' : ''
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground">{item.qty}x {formatCurrency(item.unitPrice)}</p>
                </div>
                <Badge
                  variant={item.category === 'Peça' ? 'secondary' : 'muted'}
                  className="flex-shrink-0 text-[10px]"
                >
                  {item.category}
                </Badge>
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Add item inline form */}
            {addingItem && (
              <div className="border-t border-border p-2 space-y-2 bg-muted/30">
                <Input
                  placeholder="Descrição"
                  className="h-7 text-xs"
                  value={newItem.description ?? ''}
                  onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Select
                    value={newItem.category}
                    onValueChange={(v) => setNewItem((p) => ({ ...p, category: v as 'Peça' | 'Serviço' }))}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Peça">Peça</SelectItem>
                      <SelectItem value="Serviço">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Qtd"
                    type="number"
                    className="h-7 text-xs w-14"
                    value={newItem.qty ?? ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, qty: Number(e.target.value) }))}
                  />
                  <Input
                    placeholder="R$ preço"
                    type="number"
                    className="h-7 text-xs w-24"
                    value={newItem.unitPrice ?? ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={confirmAddItem}>
                    Adicionar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingItem(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!addingItem && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 gap-1.5 text-xs border-dashed"
              onClick={() => setAddingItem(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar item
            </Button>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg bg-brand-primary/5 px-3 py-2.5 border border-brand-primary/10">
          <span className="text-sm font-semibold text-brand-primary">Total</span>
          <span className="text-lg font-bold text-brand-primary">{formatCurrency(total)}</span>
        </div>

        <Button
          className="w-full"
          disabled={!selectedClient || !selectedVehicle || items.length === 0}
        >
          Enviar orçamento
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminOrcamentosPage() {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const newCount = mockRequests.filter((r) => r.isNew).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos recebidos"
        description="Solicitações dos clientes e criação de orçamentos"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Solicitações — ocupa 3/5 colunas */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Solicitações dos clientes</h2>
            {newCount > 0 && (
              <Badge variant="accent" className="h-5 px-2 text-xs">
                {newCount} novas
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {mockRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                selected={selectedRequest === req.id}
                onSelect={() => setSelectedRequest(req.id)}
              />
            ))}
          </div>
        </div>

        {/* Criar orçamento — ocupa 2/5 colunas */}
        <div className="lg:col-span-2">
          <CreateBudgetPanel />
        </div>
      </div>
    </div>
  )
}
