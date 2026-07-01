import { useState } from 'react'
import { Plus, Trash2, MessageSquare, FileText, X, Clock, Send, CornerDownLeft, HardHat } from 'lucide-react'
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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import {
  usePendingServiceRequests,
  useClientVehicles,
  useWorkshopBudgets,
  useDraftBudgets,
  useCreateBudget,
  useCreateBudgets,
  usePublishDraft,
  useReturnDraft,
} from '../hooks/useAdminBudgets'
import { useWorkshopClients } from '@/features/admin/veiculos/hooks/useAdminVehicles'
import type { PendingRequest, DraftBudgetRow } from '../services/admin-budgets.service'

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
            {getInitials(req.owner?.full_name ?? 'C')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{req.owner?.full_name ?? 'Cliente'}</span>
            {isNew && <Badge variant="accent" className="h-4 px-1.5 text-[10px]">Nova</Badge>}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-brand-secondary font-medium">
              {req.vehicle ? `${req.vehicle.brand} ${req.vehicle.model} ${req.vehicle.year}` : '—'}
            </p>
            {req.category && (
              <Badge variant="muted" className="h-4 px-1.5 text-[10px]">{req.category}</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {req.problem_description}
          </p>
        </div>
        <div
          className={cn(
            'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-brand-secondary bg-brand-secondary' : 'border-border'
          )}
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  )
}

// ─── Painel de criação de orçamento ──────────────────────────────────────────

function CreateBudgetPanel({ selectedRequests, onDeselect, onSuccess }: {
  selectedRequests: PendingRequest[]
  onDeselect: (id: string) => void
  onSuccess: () => void
}) {
  const { data: allClients = [] } = useWorkshopClients()
  const createBudget  = useCreateBudget()
  const createBudgets = useCreateBudgets()

  const requestCount = selectedRequests.length
  const isBulk        = requestCount > 1
  const isPending     = createBudget.isPending || createBudgets.isPending
  const isError        = createBudget.isError || createBudgets.isError

  // Cliente + veículo (só usado quando não há solicitação selecionada)
  const [selectedClientId,  setSelectedClientId]  = useState<string>('')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')

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
    if (items.length === 0) return
    const draftItems = items.map((i) => ({
      description: i.description,
      category:    i.category,
      quantity:    i.quantity,
      unitPrice:   i.unitPrice,
    }))

    if (requestCount > 0) {
      await createBudgets.mutateAsync(
        selectedRequests.map((r) => ({
          vehicleId:        r.vehicle_id,
          serviceRequestId: r.id,
          items:            draftItems,
          notes:            notes || undefined,
        }))
      )
    } else {
      if (!selectedVehicleId) return
      await createBudget.mutateAsync({
        vehicleId: selectedVehicleId,
        items:     draftItems,
        notes:     notes || undefined,
      })
    }

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
        <CardTitle className="text-base">
          {isBulk ? `Criar orçamento (${requestCount} clientes)` : 'Criar novo orçamento'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Destinatários: 1 solicitação vinculada */}
        {requestCount === 1 && (
          <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2">
            <p className="text-xs font-medium text-brand-secondary mb-0.5">Solicitação vinculada</p>
            <p className="text-xs text-foreground line-clamp-2">{selectedRequests[0].problem_description}</p>
          </div>
        )}

        {/* Destinatários: várias solicitações */}
        {isBulk && (
          <div className="space-y-1.5">
            <Label>Destinatários ({requestCount})</Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {selectedRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{r.owner?.full_name ?? 'Cliente'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model} ${r.vehicle.year}` : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeselect(r.id)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              O mesmo orçamento (itens e valores abaixo) será enviado individualmente para cada cliente.
            </p>
          </div>
        )}

        {/* Cliente (só quando nenhuma solicitação está selecionada) */}
        {requestCount === 0 && (
          <div className="space-y-1.5">
            <Label>Cliente</Label>
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
          </div>
        )}

        {/* Veículo */}
        {requestCount === 0 && (
          <div className="space-y-1.5">
            <Label>Veículo</Label>
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
          </div>
        )}

        {requestCount === 1 && (
          <>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
                {selectedRequests[0].owner?.full_name ?? 'Cliente'}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Veículo</Label>
              <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
                {selectedRequests[0].vehicle.brand} {selectedRequests[0].vehicle.model}{' '}
                {selectedRequests[0].vehicle.year} · {selectedRequests[0].vehicle.plate}
              </div>
            </div>
          </>
        )}

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
          <span className="text-sm font-semibold text-brand-primary">
            {isBulk ? `Total por cliente` : 'Total'}
          </span>
          <span className="text-lg font-bold text-brand-primary">{formatCurrency(total)}</span>
        </div>

        {isError && (
          <p className="text-xs text-destructive">Erro ao enviar orçamento. Tente novamente.</p>
        )}

        <Button
          className="w-full"
          variant="accent"
          disabled={(requestCount === 0 && !selectedVehicleId) || items.length === 0 || isPending}
          onClick={handleSubmit}
        >
          {isPending
            ? 'Enviando...'
            : isBulk
              ? `Enviar ${requestCount} orçamentos`
              : 'Enviar orçamento'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Modal de devolver rascunho ───────────────────────────────────────────────

function ReturnDraftModal({ budgetId, onClose }: { budgetId: string; onClose: () => void }) {
  const [notes, setNotes] = useState('')
  const returnDraft = useReturnDraft()

  async function handleSubmit() {
    if (!notes.trim()) return
    await returnDraft.mutateAsync({ budgetId, notes: notes.trim() })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <div className="border-b border-border px-6 py-5">
          <DialogTitle className="text-base">Devolver ao funcionário</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            O funcionário verá esta nota na aba "Em revisão".
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Nota de revisão</Label>
            <Textarea
              placeholder="Ex: Revisar o valor da peça X, adicionar mão de obra..."
              rows={3}
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {returnDraft.isError && (
            <p className="text-xs text-destructive">Erro ao devolver. Tente novamente.</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={returnDraft.isPending}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              disabled={!notes.trim() || returnDraft.isPending}
              onClick={handleSubmit}
            >
              {returnDraft.isPending ? 'Enviando...' : 'Devolver com nota'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Seção de rascunhos de funcionários ──────────────────────────────────────

function DraftSection() {
  const { data: drafts = [], isLoading } = useDraftBudgets()
  const publishDraft = usePublishDraft()
  const [returning, setReturning] = useState<string | null>(null)

  if (isLoading) return <LoadingState />
  if (drafts.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-foreground">
          Aguardando revisão ({drafts.length})
        </h3>
        <span className="text-xs text-muted-foreground">— rascunhos preparados por funcionários</span>
      </div>

      {drafts.map((draft) => (
        <Card key={draft.id} className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                {/* Cabeçalho */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-brand-secondary">
                    #{draft.budget_number}
                  </span>
                  {draft.creator && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <HardHat className="h-3 w-3" />
                      {draft.creator.full_name}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(draft.issued_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* Cliente + veículo */}
                <div className="text-sm">
                  {draft.owner && (
                    <span className="font-medium text-foreground">{draft.owner.full_name}</span>
                  )}
                  {draft.vehicle && (
                    <span className="text-muted-foreground">
                      {' · '}{draft.vehicle.brand} {draft.vehicle.model} {draft.vehicle.year}
                      <span className="ml-1 font-mono text-xs">{draft.vehicle.plate}</span>
                    </span>
                  )}
                </div>

                {/* Problema */}
                {draft.service_request && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {draft.service_request.problem_description}
                  </p>
                )}

                {/* Itens resumo */}
                <div className="flex flex-wrap gap-1.5">
                  {draft.items.slice(0, 3).map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-white border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {item.description} · {formatCurrency(item.total_price)}
                    </span>
                  ))}
                  {draft.items.length > 3 && (
                    <span className="text-[10px] text-muted-foreground self-center">
                      +{draft.items.length - 3} item(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Total + ações */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-base font-bold text-brand-primary">
                  {formatCurrency(draft.total_amount)}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    disabled={publishDraft.isPending}
                    onClick={() => setReturning(draft.id)}
                  >
                    <CornerDownLeft className="h-3 w-3" />
                    Devolver
                  </Button>
                  <Button
                    size="sm"
                    variant="accent"
                    className="h-7 gap-1 text-xs"
                    disabled={publishDraft.isPending}
                    onClick={() =>
                      publishDraft.mutate({
                        budgetId:         draft.id,
                        serviceRequestId: draft.service_request_id,
                      })
                    }
                  >
                    <Send className="h-3 w-3" />
                    Enviar ao cliente
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {returning && (
        <ReturnDraftModal budgetId={returning} onClose={() => setReturning(null)} />
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminOrcamentosPage() {
  const [activeTab,        setActiveTab]        = useState<Tab>('solicitacoes')
  const [selectedRequests, setSelectedRequests] = useState<PendingRequest[]>([])
  const [formKey,          setFormKey]          = useState(0)

  const { data: requests = [], isLoading: loadingReqs  } = usePendingServiceRequests()
  const { data: budgets  = [], isLoading: loadingBudgets } = useWorkshopBudgets()

  const newCount = requests.filter((r) => r.status === 'pending').length

  function handleRequestSelect(req: PendingRequest) {
    setSelectedRequests((prev) =>
      prev.some((r) => r.id === req.id)
        ? prev.filter((r) => r.id !== req.id)
        : [...prev, req]
    )
  }

  function handleDeselect(id: string) {
    setSelectedRequests((prev) => prev.filter((r) => r.id !== id))
  }

  function handleBudgetSent() {
    setSelectedRequests([])
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
          { key: 'solicitacoes', label: 'Solicitações', icon: MessageSquare, badge: newCount as number | undefined },
          { key: 'enviados',     label: 'Orçamentos enviados', icon: FileText, badge: undefined as number | undefined },
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
          <div className="lg:col-span-3 space-y-6">
            <DraftSection />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Solicitações dos clientes</h3>
                {newCount > 0 && (
                  <Badge variant="accent" className="h-4 px-1.5 text-[10px]">{newCount} nova{newCount > 1 ? 's' : ''}</Badge>
                )}
              </div>

            {selectedRequests.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  {selectedRequests.length} solicitaç{selectedRequests.length > 1 ? 'ões' : 'ão'} selecionada{selectedRequests.length > 1 ? 's' : ''} — mesmo orçamento será enviado para cada uma
                </span>
                <button
                  className="font-medium text-brand-secondary hover:underline"
                  onClick={() => setSelectedRequests([])}
                >
                  Limpar seleção
                </button>
              </div>
            )}
            {loadingReqs ? (
              <LoadingState />
            ) : requests.length === 0 ? (
              <EmptyState title="Nenhuma solicitação pendente" className="py-10" />
            ) : (
              requests.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  selected={selectedRequests.some((r) => r.id === req.id)}
                  onSelect={() => handleRequestSelect(req)}
                />
              ))
            )}
            </div>{/* /space-y-3 */}
          </div>{/* /lg:col-span-3 */}

          {/* Formulário */}
          <div className="lg:col-span-2">
            <CreateBudgetPanel
              key={formKey}
              selectedRequests={selectedRequests}
              onDeselect={handleDeselect}
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
                          <div className="flex items-center gap-1.5">
                            {b.vehicle.brand} {b.vehicle.model} {b.vehicle.year}
                            {b.service_request?.category && (
                              <Badge variant="muted" className="h-4 px-1.5 text-[10px]">
                                {b.service_request.category}
                              </Badge>
                            )}
                          </div>
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
