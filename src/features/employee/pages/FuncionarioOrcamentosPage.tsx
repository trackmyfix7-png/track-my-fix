import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus, Trash2, MessageSquare, FileText, Clock,
  AlertCircle, Info, X,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import {
  useEmployeeContext,
  useEmployeeServiceRequests,
  useEmployeeBudgets,
  useMyDraftBudgets,
  useCreateEmployeeBudget,
  useCreateEmployeeBudgets,
  type EmployeeBudgetItem,
  type MyDraftBudget,
} from '../hooks/useEmployee'
import type { PendingRequest } from '@/features/admin/orcamentos/services/admin-budgets.service'

type Tab = 'solicitacoes' | 'revisao' | 'enviados'

interface DraftItem {
  id:          string
  description: string
  category:    'part' | 'service'
  quantity:    number
  unitPrice:   number
}

// ─── Modal leitura (sem permissão de criar) ───────────────────────────────────

function ServiceRequestViewModal({ request, onClose }: {
  request: PendingRequest
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-start gap-4 border-b border-border px-6 py-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-secondary/10">
            <Info className="h-5 w-5 text-brand-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base">Detalhes da solicitação</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {request.owner?.full_name ?? 'Cliente'}
              {request.vehicle ? ` · ${request.vehicle.brand} ${request.vehicle.model} ${request.vehicle.year}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {request.vehicle && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Veículo</p>
              <p className="text-sm font-medium">{request.vehicle.brand} {request.vehicle.model} {request.vehicle.year}</p>
              <p className="text-xs text-muted-foreground font-mono">{request.vehicle.plate}</p>
            </div>
          )}
          {request.category && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Categoria</p>
              <Badge variant="secondary">{request.category}</Badge>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Problema relatado</p>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-sm leading-relaxed">{request.problem_description}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Solicitado em {format(parseISO(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="border-t border-border px-6 py-4">
          <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card de solicitação ──────────────────────────────────────────────────────

function RequestCard({ req, selected, canCreateBudget, onSelect }: {
  req:             PendingRequest
  selected:        boolean
  canCreateBudget: boolean
  onSelect:        () => void
}) {
  const [viewing, setViewing] = useState(false)

  return (
    <>
      <button
        onClick={canCreateBudget ? onSelect : () => setViewing(true)}
        className={cn(
          'w-full text-left rounded-xl border p-3.5 transition-all duration-150',
          selected
            ? 'border-brand-secondary bg-brand-secondary/5 shadow-sm'
            : 'border-border bg-white hover:border-brand-secondary/50 hover:bg-muted/20'
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-semibold">
              {getInitials(req.owner?.full_name ?? 'C')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{req.owner?.full_name ?? 'Cliente'}</span>
              {req.status === 'pending'   && <Badge variant="accent"    className="h-4 px-1.5 text-[10px]">Nova</Badge>}
              {req.status === 'analyzing' && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Em análise</Badge>}
            </div>
            {req.vehicle && (
              <p className="mt-0.5 text-xs font-medium text-brand-secondary">
                {req.vehicle.brand} {req.vehicle.model} {req.vehicle.year} · {req.vehicle.plate}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{req.problem_description}</p>
            {req.category && (
              <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {req.category}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {format(parseISO(req.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </button>

      {viewing && (
        <ServiceRequestViewModal request={req} onClose={() => setViewing(false)} />
      )}
    </>
  )
}

// ─── Painel lateral: criar orçamento ─────────────────────────────────────────

function EmployeeBudgetPanel({ selectedRequests, workshopId, onDeselect, onClose, onSuccess }: {
  selectedRequests: PendingRequest[]
  workshopId:       string
  onDeselect:       (id: string) => void
  onClose:          () => void
  onSuccess:        () => void
}) {
  const [items,      setItems]      = useState<DraftItem[]>([])
  const [addingItem, setAddingItem] = useState(false)
  const [newItem,    setNewItem]    = useState<Partial<DraftItem>>({ category: 'part', quantity: 1 })
  const [notes,      setNotes]      = useState('')

  const create      = useCreateEmployeeBudget()
  const createBulk  = useCreateEmployeeBudgets()
  const isPending   = create.isPending || createBulk.isPending
  const isError     = create.isError   || createBulk.isError
  const isBulk      = selectedRequests.length > 1
  const total       = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

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
    const budgetItems = items.map((i): EmployeeBudgetItem => ({
      description: i.description,
      category:    i.category,
      quantity:    i.quantity,
      unit_price:  i.unitPrice,
    }))

    if (isBulk) {
      await createBulk.mutateAsync(
        selectedRequests
          .filter((r) => r.vehicle)
          .map((r) => ({
            workshopId,
            vehicleId:        r.vehicle!.id,
            serviceRequestId: r.id,
            items:            budgetItems,
            notes:            notes || undefined,
          }))
      )
    } else {
      const req = selectedRequests[0]
      if (!req?.vehicle) return
      await create.mutateAsync({
        workshopId,
        vehicleId:        req.vehicle.id,
        serviceRequestId: req.id,
        items:            budgetItems,
        notes:            notes || undefined,
      })
    }

    onSuccess()
  }

  const categoryLabel = (c: 'part' | 'service') => c === 'part' ? 'Peça' : 'Serviço'
  const title = isBulk
    ? `Orçamento para ${selectedRequests.length} clientes`
    : 'Criar orçamento'

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-md">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex-shrink-0 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{title}</p>
          {!isBulk && selectedRequests[0] && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {selectedRequests[0].owner?.full_name ?? 'Cliente'}
              {selectedRequests[0].vehicle
                ? ` · ${selectedRequests[0].vehicle.brand} ${selectedRequests[0].vehicle.model} ${selectedRequests[0].vehicle.year}`
                : ''}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

        {/* Problema relatado (1 request) */}
        {!isBulk && selectedRequests[0] && (
          <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-1">Problema relatado</p>
            <p className="text-xs text-foreground leading-relaxed">{selectedRequests[0].problem_description}</p>
            {selectedRequests[0].category && (
              <Badge variant="secondary" className="mt-1.5 text-[10px]">{selectedRequests[0].category}</Badge>
            )}
          </div>
        )}

        {/* Lista de destinatários (bulk) */}
        {isBulk && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Destinatários ({selectedRequests.length})</Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {selectedRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{r.owner?.full_name ?? 'Cliente'}</p>
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
              O mesmo orçamento será enviado individualmente para cada cliente.
            </p>
          </div>
        )}

        {/* Itens */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Itens do orçamento</Label>
          <div className="rounded-md border border-border overflow-hidden">
            {items.length === 0 && !addingItem && (
              <p className="px-3 py-4 text-xs text-center text-muted-foreground">Nenhum item adicionado</p>
            )}
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={cn('flex items-center gap-2 px-3 py-2', idx < items.length - 1 && 'border-b border-border')}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                </div>
                <Badge variant={item.category === 'part' ? 'secondary' : 'muted'} className="text-[10px] flex-shrink-0">
                  {categoryLabel(item.category)}
                </Badge>
                <span className="text-xs font-semibold w-16 text-right flex-shrink-0">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
                <button
                  onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {addingItem && (
              <div className="border-t border-border p-2 space-y-2 bg-muted/30">
                <Input
                  placeholder="Descrição"
                  className="h-7 text-xs"
                  value={newItem.description ?? ''}
                  onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Select value={newItem.category} onValueChange={(v) => setNewItem((p) => ({ ...p, category: v as 'part' | 'service' }))}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
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
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={confirmAddItem}>Adicionar</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingItem(false)}>Cancelar</Button>
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

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Observações (opcional)</Label>
          <Textarea
            placeholder="Prazo estimado, condições, detalhes..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-brand-primary/5 px-3 py-2.5 border border-brand-primary/10">
          <span className="text-sm font-semibold text-brand-primary">
            {isBulk ? 'Total por cliente' : 'Total'}
          </span>
          <span className="text-lg font-bold text-brand-primary">{formatCurrency(total)}</span>
        </div>

        {isError && (
          <p className="text-xs text-destructive">Erro ao criar orçamento. Tente novamente.</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t border-border px-5 py-3 flex-shrink-0 bg-muted/20">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          variant="accent"
          size="sm"
          className="flex-1"
          disabled={items.length === 0 || isPending || selectedRequests.every((r) => !r.vehicle)}
          onClick={handleSubmit}
        >
          {isPending
            ? 'Salvando...'
            : isBulk
              ? `Enviar ${selectedRequests.length} orçamentos`
              : 'Enviar ao cliente'}
        </Button>
      </div>
    </Card>
  )
}

// ─── Card de rascunho (aba Em revisão) ───────────────────────────────────────

function DraftCard({ draft }: { draft: MyDraftBudget }) {
  const hasNote = !!draft.review_notes
  return (
    <Card className={cn('border bg-white', hasNote && 'border-amber-300')}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-brand-secondary">#{draft.budget_number}</span>
              <Badge variant="muted" className="h-4 px-1.5 text-[10px]">Aguardando revisão</Badge>
            </div>
            {draft.vehicle && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {draft.vehicle.brand} {draft.vehicle.model} {draft.vehicle.year} · {draft.vehicle.plate}
              </p>
            )}
            {draft.service_request && (
              <p className="mt-1 text-xs text-foreground line-clamp-2">{draft.service_request.problem_description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-brand-primary">{formatCurrency(draft.total_amount)}</p>
            <p className="text-[10px] text-muted-foreground">
              {format(parseISO(draft.issued_at), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {draft.items.length} {draft.items.length === 1 ? 'item' : 'itens'} · {draft.items.map((i) => i.description).join(', ')}
        </div>
        {hasNote && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Nota do administrador</p>
              <p className="text-xs text-amber-800">{draft.review_notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function FuncionarioOrcamentosPage() {
  const [activeTab,        setActiveTab]        = useState<Tab>('solicitacoes')
  const [selectedRequests, setSelectedRequests] = useState<PendingRequest[]>([])
  const [formKey,          setFormKey]          = useState(0)
  // Mantém conteúdo visível durante a animação de fechar
  const [lastSelected,     setLastSelected]     = useState<PendingRequest[]>([])

  const { data: ctx,      isLoading: ctxLoading }      = useEmployeeContext()
  const { data: requests = [], isLoading: loadingReqs }   = useEmployeeServiceRequests()
  const { data: budgets  = [], isLoading: loadingBudgets } = useEmployeeBudgets()
  const { data: drafts   = [], isLoading: loadingDrafts }  = useMyDraftBudgets()

  const canCreateBudget = ctx?.canApproveBudgets ?? false
  const workshopId      = ctx?.workshop?.id ?? ''
  const panelOpen       = selectedRequests.length > 0 && canCreateBudget

  function handleSelect(req: PendingRequest) {
    setSelectedRequests((prev) => {
      const next = prev.some((r) => r.id === req.id)
        ? prev.filter((r) => r.id !== req.id)
        : [...prev, req]
      if (next.length > 0) setLastSelected(next)
      return next
    })
  }

  function handleDeselect(id: string) {
    setSelectedRequests((prev) => {
      const next = prev.filter((r) => r.id !== id)
      if (next.length > 0) setLastSelected(next)
      return next
    })
  }

  function handleClosePanel() {
    setSelectedRequests([])
  }

  function handleSuccess() {
    setSelectedRequests([])
    setFormKey((k) => k + 1)
  }

  const newCount   = requests.filter((r) => r.status === 'pending').length
  const draftCount = drafts.length

  const tabs = canCreateBudget
    ? [
        { key: 'solicitacoes' as Tab, label: 'Solicitações', icon: MessageSquare, badge: newCount   },
        { key: 'revisao'      as Tab, label: 'Em revisão',   icon: Clock,         badge: draftCount },
        { key: 'enviados'     as Tab, label: 'Enviados',     icon: FileText,      badge: undefined  },
      ]
    : [
        { key: 'solicitacoes' as Tab, label: 'Solicitações', icon: MessageSquare, badge: newCount },
      ]

  const validTab = tabs.some((t) => t.key === activeTab) ? activeTab : 'solicitacoes'

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100dvh - 104px)' }}>
      <PageHeader title="Orçamentos" description="Solicitações dos clientes" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border flex-shrink-0">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); handleClosePanel() }}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              validTab === key
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

      {/* Solicitações — split panel */}
      {validTab === 'solicitacoes' && (
        <div className="flex gap-5 flex-1 min-h-0">

          {/* Lista */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {ctxLoading || loadingReqs ? (
              <LoadingState />
            ) : requests.length === 0 ? (
              <EmptyState title="Nenhuma solicitação pendente" className="py-14" />
            ) : (
              <div className="space-y-2 pr-1">
                {selectedRequests.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">
                      {selectedRequests.length} solicitaç{selectedRequests.length > 1 ? 'ões' : 'ão'} selecionada{selectedRequests.length > 1 ? 's' : ''}
                      {selectedRequests.length > 1 && ' — mesmo orçamento para cada'}
                    </span>
                    <button className="font-medium text-brand-secondary hover:underline" onClick={handleClosePanel}>
                      Limpar seleção
                    </button>
                  </div>
                )}
                {requests.map((req) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    selected={selectedRequests.some((r) => r.id === req.id)}
                    canCreateBudget={canCreateBudget}
                    onSelect={() => handleSelect(req)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Painel lateral */}
          <div className={cn(
            'flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out',
            panelOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}>
            <div className={cn(
              'w-[400px] h-full transition-transform duration-300 ease-out',
              panelOpen ? 'translate-x-0' : 'translate-x-6'
            )}>
              <EmployeeBudgetPanel
                key={formKey}
                selectedRequests={panelOpen ? selectedRequests : lastSelected}
                workshopId={workshopId}
                onDeselect={handleDeselect}
                onClose={handleClosePanel}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Em revisão */}
      {validTab === 'revisao' && (
        <div className="flex-1 overflow-y-auto">
          {loadingDrafts ? <LoadingState /> :
          drafts.length === 0 ? (
            <EmptyState
              title="Nenhum orçamento em revisão"
              description="Orçamentos criados por você e aguardando o admin aparecem aqui."
              className="py-14"
            />
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => <DraftCard key={d.id} draft={d} />)}
            </div>
          )}
        </div>
      )}

      {/* Enviados */}
      {validTab === 'enviados' && (
        <div className="flex-1 overflow-y-auto">
          {loadingBudgets ? <LoadingState /> :
          budgets.length === 0 ? (
            <EmptyState title="Nenhum orçamento enviado ainda" className="py-14" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {['Nº', 'Veículo', 'Cliente', 'Total', 'Data', 'Status'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:text-right">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map((b) => (
                        <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs font-semibold text-brand-secondary">#{b.budget_number}</span>
                          </td>
                          <td className="px-5 py-3 text-sm">
                            {b.vehicle.brand} {b.vehicle.model} {b.vehicle.year}
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">{b.vehicle.plate}</span>
                            {b.service_request?.category && (
                              <Badge variant="muted" className="ml-1.5 h-4 px-1.5 text-[10px]">{b.service_request.category}</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{b.owner?.full_name ?? '—'}</td>
                          <td className="px-5 py-3 text-sm font-semibold">{formatCurrency(b.total_amount)}</td>
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
