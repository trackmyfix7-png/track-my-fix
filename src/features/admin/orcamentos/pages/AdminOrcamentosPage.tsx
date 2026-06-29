import { useState } from 'react'
import { Plus, Trash2, MessageSquare, FileText } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import {
  usePendingServiceRequests,
  useClientVehicles,
  useWorkshopBudgets,
  useCreateBudget,
} from '../hooks/useAdminBudgets'
import { useWorkshopClients } from '@/features/admin/veiculos/hooks/useAdminVehicles'
import type { PendingRequest } from '../services/admin-budgets.service'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface DraftItem {
  id: string
  description: string
  category: 'part' | 'service'
  quantity: number
  unitPrice: number
}

// ─── Abas ─────────────────────────────────────────────────────────────────────

type Tab = 'solicitacoes' | 'enviados'

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({ req, selected, onSelect }: {
  req: PendingRequest
  selected: boolean
  onSelect: () => void
}) {
  const isNew = req.status === 'pending'
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
            {getInitials(req.owner.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{req.owner.full_name}</span>
            {isNew && <Badge variant="accent" className="h-4 px-1.5 text-[10px]">Nova</Badge>}
          </div>
          <p className="text-xs text-brand-secondary font-medium">
            {req.vehicle.brand} {req.vehicle.model} {req.vehicle.year}
          </p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {req.problem_description}
          </p>
        </div>
      </div>
    </button>
  )
}

// ─── Painel de criação de orçamento ──────────────────────────────────────────

function CreateBudgetPanel({ prefilledRequest, onSuccess }: {
  prefilledRequest: PendingRequest | null
  onSuccess: () => void
}) {
  const { data: allClients = [] } = useWorkshopClients()
  const createBudget = useCreateBudget()

  // Cliente + veículo
  const [selectedClientId, setSelectedClientId] = useState<string>(
    prefilledRequest?.owner_id ?? ''
  )
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    prefilledRequest?.vehicle_id ?? ''
  )

  const { data: vehicles = [], isLoading: loadingVehicles } = useClientVehicles(
    selectedClientId || null
  )

  // Itens do orçamento
  const [items,      setItems]      = useState<DraftItem[]>([])
  const [addingItem, setAddingItem] = useState(false)
  const [newItem,    setNewItem]    = useState<Partial<DraftItem>>({ category: 'part', quantity: 1 })
  const [notes,      setNotes]      = useState('')

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId)
    setSelectedVehicleId('')
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function confirmAddItem() {
    if (!newItem.description || !newItem.unitPrice) return
    setItems((prev) => [
      ...prev,
      {
        id:          String(Date.now()),
        description: newItem.description!,
        category:    newItem.category as 'part' | 'service',
        quantity:    newItem.quantity ?? 1,
        unitPrice:   Number(newItem.unitPrice),
      },
    ])
    setNewItem({ category: 'part', quantity: 1 })
    setAddingItem(false)
  }

  async function handleSubmit() {
    if (!selectedVehicleId || items.length === 0) return
    await createBudget.mutateAsync({
      vehicleId:        selectedVehicleId,
      serviceRequestId: prefilledRequest?.id,
      items:            items.map((i) => ({
        description: i.description,
        category:    i.category,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
      })),
      notes: notes || undefined,
    })
    // Reset form
    setSelectedClientId('')
    setSelectedVehicleId('')
    setItems([])
    setNotes('')
    onSuccess()
  }

  const categoryLabel = (c: 'part' | 'service') => (c === 'part' ? 'Peça' : 'Serviço')

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Criar novo orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Solicitação vinculada */}
        {prefilledRequest && (
          <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2">
            <p className="text-xs font-medium text-brand-secondary mb-0.5">Solicitação vinculada</p>
            <p className="text-xs text-foreground line-clamp-2">{prefilledRequest.problem_description}</p>
          </div>
        )}

        {/* Cliente */}
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          {prefilledRequest ? (
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
              {prefilledRequest.owner.full_name}
            </div>
          ) : (
            <Select value={selectedClientId} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {allClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Veículo */}
        <div className="space-y-1.5">
          <Label>Veículo</Label>
          {prefilledRequest ? (
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
              {prefilledRequest.vehicle.brand} {prefilledRequest.vehicle.model}{' '}
              {prefilledRequest.vehicle.year} · {prefilledRequest.vehicle.plate}
            </div>
          ) : (
            <Select
              value={selectedVehicleId}
              onValueChange={setSelectedVehicleId}
              disabled={!selectedClientId || loadingVehicles}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingVehicles ? 'Carregando...' : 'Selecionar veículo'} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model} {v.year} · {v.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Itens */}
        <div className="space-y-1.5">
          <Label>Itens</Label>
          <div className="rounded-md border border-border overflow-hidden">
            {items.length === 0 && !addingItem && (
              <p className="px-3 py-4 text-xs text-center text-muted-foreground">
                Nenhum item adicionado
              </p>
            )}
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
                  <p className="text-[10px] text-muted-foreground">
                    {item.quantity}x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <Badge
                  variant={item.category === 'part' ? 'secondary' : 'muted'}
                  className="flex-shrink-0 text-[10px]"
                >
                  {categoryLabel(item.category)}
                </Badge>
                <span className="text-xs font-semibold text-foreground w-16 text-right flex-shrink-0">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Inline add form */}
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
                    onValueChange={(v) => setNewItem((p) => ({ ...p, category: v as 'part' | 'service' }))}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="part">Peça</SelectItem>
                      <SelectItem value="service">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Qtd"
                    type="number"
                    min="1"
                    className="h-7 text-xs w-14"
                    value={newItem.quantity ?? ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  />
                  <Input
                    placeholder="R$ unit."
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-7 text-xs w-24"
                    value={newItem.unitPrice ?? ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={confirmAddItem}>
                    Adicionar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setAddingItem(false)}
                  >
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

        {/* Observações */}
        <div className="space-y-1.5">
          <Label>Observações (opcional)</Label>
          <Textarea
            placeholder="Prazo estimado, condições, detalhes..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg bg-brand-primary/5 px-3 py-2.5 border border-brand-primary/10">
          <span className="text-sm font-semibold text-brand-primary">Total</span>
          <span className="text-lg font-bold text-brand-primary">{formatCurrency(total)}</span>
        </div>

        {createBudget.isError && (
          <p className="text-xs text-destructive">Erro ao enviar orçamento. Tente novamente.</p>
        )}

        <Button
          className="w-full"
          variant="accent"
          disabled={(!selectedVehicleId && !prefilledRequest) || items.length === 0 || createBudget.isPending}
          onClick={handleSubmit}
        >
          {createBudget.isPending ? 'Enviando...' : 'Enviar orçamento'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminOrcamentosPage() {
  const [activeTab,       setActiveTab]       = useState<Tab>('solicitacoes')
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [formKey,         setFormKey]         = useState(0)

  const { data: requests = [], isLoading: loadingReqs  } = usePendingServiceRequests()
  const { data: budgets  = [], isLoading: loadingBudgets } = useWorkshopBudgets()

  const newCount = requests.filter((r) => r.status === 'pending').length

  function handleRequestSelect(req: PendingRequest) {
    setSelectedRequest((prev) => (prev?.id === req.id ? null : req))
  }

  function handleBudgetSent() {
    setSelectedRequest(null)
    setFormKey((k) => k + 1)
    setActiveTab('enviados')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        description="Solicitações dos clientes e criação de orçamentos"
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: 'solicitacoes', label: 'Solicitações', icon: MessageSquare, badge: newCount },
          { key: 'enviados',     label: 'Orçamentos enviados', icon: FileText },
        ] as const).map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === key
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge != null && badge > 0 && (
              <Badge variant="accent" className="h-4 px-1.5 text-[10px]">{badge}</Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'solicitacoes' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Solicitações */}
          <div className="lg:col-span-3 space-y-3">
            {loadingReqs ? (
              <LoadingState />
            ) : requests.length === 0 ? (
              <EmptyState title="Nenhuma solicitação pendente" className="py-10" />
            ) : (
              requests.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  selected={selectedRequest?.id === req.id}
                  onSelect={() => handleRequestSelect(req)}
                />
              ))
            )}
          </div>

          {/* Formulário */}
          <div className="lg:col-span-2">
            <CreateBudgetPanel
              key={formKey}
              prefilledRequest={selectedRequest}
              onSuccess={handleBudgetSent}
            />
          </div>
        </div>
      )}

      {activeTab === 'enviados' && (
        <Card>
          <CardContent className="p-0">
            {loadingBudgets ? (
              <LoadingState />
            ) : budgets.length === 0 ? (
              <EmptyState title="Nenhum orçamento enviado ainda" className="py-10" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {['Nº', 'Veículo', 'Cliente', 'Total', 'Data', 'Status'].map((h) => (
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
                    {budgets.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs font-semibold text-brand-secondary">
                            #{b.budget_number}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {b.vehicle.brand} {b.vehicle.model} {b.vehicle.year}
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {b.owner?.full_name ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold">
                          {formatCurrency(b.total_amount)}
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {format(parseISO(b.issued_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <BudgetStatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
