import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, MessageSquare, FileText, X, Clock, Send, CornerDownLeft, HardHat, Camera, Search, Tag, ChevronDown, Check, DollarSign, ZoomIn, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { BudgetStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatCurrency } from '@/lib/utils'
import {
  usePendingServiceRequests,
  useServiceById,
  useClientVehicles,
  useWorkshopBudgets,
  useDraftBudgets,
  useCreateBudget,
  useCreateBudgets,
  usePublishDraft,
  useReturnDraft,
} from '../hooks/useAdminBudgets'
import { useWorkshopClients } from '@/features/admin/veiculos/hooks/useAdminVehicles'
import type { PendingRequest } from '../services/admin-budgets.service'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface DraftItem {
  id:          string
  description: string
  category:    'part' | 'service'
  quantity:    number
  unitPrice:   number
}

type Tab = 'solicitacoes' | 'enviados'

// ─── Filtros ──────────────────────────────────────────────────────────────────

type RequestStatusFilter = 'todas' | 'novas' | 'analisando'

function FilterPopover({ label, icon: Icon, activeCount, onClear, children, hideBadge }: {
  label:       string
  icon:        React.ElementType
  activeCount: number
  onClear:     () => void
  children:    React.ReactNode
  hideBadge?:  boolean
}) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState<{ left: number; top: number } | null>(null)
  const btnRef      = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isActive    = activeCount > 0

  function handleToggle() {
    if (open) { setOpen(false); return }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ left: r.left, top: r.bottom + 6 })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-150',
          isActive
            ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
            : 'border-border bg-white text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary'
        )}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        {label}
        {isActive && !hideBadge && (
          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-150 flex-shrink-0', open && 'rotate-180')} />
      </button>

      {open && pos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] min-w-[220px] rounded-xl border border-border bg-white shadow-xl overflow-hidden"
          style={{ left: pos.left, top: pos.top }}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {children}
          </div>
          {isActive && (
            <div className="border-t border-border px-3 py-2">
              <button
                onClick={() => { onClear(); setOpen(false) }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Limpar filtro
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

function FilterOption({ checked, radio, label, onClick }: {
  checked: boolean; radio?: boolean; label: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors',
        checked ? 'text-brand-primary bg-brand-primary/5' : 'text-foreground hover:bg-muted/50'
      )}
    >
      {radio ? (
        <div className={cn(
          'h-4 w-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
          checked ? 'border-brand-primary bg-brand-primary' : 'border-border'
        )}>
          {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
      ) : (
        <div className={cn(
          'h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors',
          checked ? 'border-brand-primary bg-brand-primary' : 'border-border'
        )}>
          {checked && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
      )}
      <span className={cn('font-medium', checked && 'font-semibold')}>{label}</span>
    </button>
  )
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({ req, selected, showRemove, onSelect, onAdd }: {
  req:        PendingRequest
  selected:   boolean
  showRemove: boolean
  onSelect:   () => void
  onAdd:      () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative w-full cursor-pointer rounded-xl border px-3.5 py-3 transition-all duration-150',
        selected
          ? 'border-brand-secondary bg-brand-secondary/5 shadow-sm'
          : 'border-border bg-white hover:border-brand-secondary/50 hover:bg-muted/20'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{req.owner?.full_name ?? 'Cliente'}</span>
            {req.status === 'pending'   && <Badge variant="accent"    className="h-4 px-1.5 text-[10px]">Nova</Badge>}
            {req.status === 'analyzing' && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Em análise</Badge>}
            {req.category && (
              <Badge variant={req.service_id ? 'secondary' : 'muted'} className="h-4 px-1.5 text-[10px]">{req.category}</Badge>
            )}
            {req.images && req.images.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Camera className="h-3 w-3" />
                {req.images.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {req.vehicle ? `${req.vehicle.brand} ${req.vehicle.model}` : '—'}
          </p>
        </div>

        {/* Adicionar ao lote (hover, não selecionado) ou remover do lote (selecionado e há 2+) */}
        {selected && showRemove ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            title="Remover da seleção"
            className="flex-shrink-0 self-center rounded-full p-1 text-brand-secondary hover:text-destructive hover:bg-red-50 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : !selected ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            title="Adicionar à seleção múltipla"
            className="flex-shrink-0 self-center rounded-full p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-brand-secondary hover:bg-brand-secondary/10 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ─── Photo thumb com loading skeleton ────────────────────────────────────────

function PhotoThumb({ url, onClick }: { url: string; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <button
      onClick={onClick}
      className="group relative w-[72px] h-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-muted border border-border/50 focus:outline-none"
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted-foreground/15" />
      )}
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-150 flex items-center justify-center">
        <ZoomIn className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-150 drop-shadow" />
      </div>
    </button>
  )
}

// ─── Painel lateral: criar orçamento ─────────────────────────────────────────

function CreateBudgetPanel({ selectedRequests, onDeselect, onClose, onSuccess }: {
  selectedRequests: PendingRequest[]
  onDeselect:       (id: string) => void
  onClose:          () => void
  onSuccess:        () => void
}) {
  const { data: allClients = [] } = useWorkshopClients()
  const createBudget  = useCreateBudget()
  const createBudgets = useCreateBudgets()

  const requestCount  = selectedRequests.length
  const isBulk        = requestCount > 1

  const singleRequest = requestCount === 1 ? selectedRequests[0] : null
  const { data: linkedService, isLoading: loadingService } = useServiceById(
    singleRequest?.service_id ?? null
  )
  const isPending    = createBudget.isPending || createBudgets.isPending
  const isError      = createBudget.isError   || createBudgets.isError

  const [selectedClientId,  setSelectedClientId]  = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const { data: vehicles = [], isLoading: loadingVehicles } = useClientVehicles(selectedClientId || null)

  const [items,      setItems]      = useState<DraftItem[]>([])
  const [addingItem, setAddingItem] = useState(false)
  const [newItem,    setNewItem]    = useState<Partial<DraftItem>>({ category: 'part', quantity: 1 })
  const [notes,      setNotes]      = useState('')
  const [lightbox,   setLightbox]   = useState<number | null>(null)

  const lbImages = (singleRequest?.images ?? []).filter((img) => img.url != null)

  useEffect(() => {
    if (lightbox === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setLightbox((i) => i !== null ? Math.min(i + 1, lbImages.length - 1) : null)
      if (e.key === 'ArrowLeft')  setLightbox((i) => i !== null ? Math.max(i - 1, 0) : null)
      if (e.key === 'Escape')     setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, lbImages.length])

  // Pre-popula o serviço do catálogo como primeiro item quando os dados carregam
  useEffect(() => {
    if (!linkedService || linkedService.base_price <= 0) return
    setItems((prev) => {
      if (prev.length > 0) return prev
      return [{
        id:          'catalog-service',
        description: linkedService.name,
        category:    'service' as const,
        quantity:    1,
        unitPrice:   linkedService.base_price,
      }]
    })
  }, [linkedService])

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId)
    setSelectedVehicleId('')
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

    onSuccess()
  }

  const categoryLabel = (c: 'part' | 'service') => c === 'part' ? 'Peça' : 'Serviço'

  const title = isBulk
    ? `Orçamento para ${requestCount} clientes`
    : requestCount === 1
      ? (linkedService?.name ?? 'Criar orçamento')
      : 'Novo orçamento'

  return (
    <>
    <Card className="flex flex-col h-full overflow-hidden shadow-md">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex-shrink-0 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          {requestCount === 1 && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {selectedRequests[0].owner?.full_name ?? 'Cliente'}
              {selectedRequests[0].vehicle
                ? ` · ${selectedRequests[0].vehicle.brand} ${selectedRequests[0].vehicle.model} ${selectedRequests[0].vehicle.year}`
                : ''}
            </p>
          )}
          {requestCount === 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">Sem solicitação vinculada</p>
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

        {/* Solicitação vinculada (1 request) */}
        {requestCount === 1 && (
          <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2.5 space-y-2.5">
            {/* Serviço do catálogo */}
            {singleRequest?.service_id && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-1">Serviço solicitado</p>
                {loadingService ? (
                  <p className="text-xs text-muted-foreground">Carregando...</p>
                ) : linkedService ? (
                  <>
                    {linkedService.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{linkedService.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Referência: <span className="font-medium text-foreground">{formatCurrency(linkedService.base_price)}</span>
                    </p>
                  </>
                ) : null}
              </div>
            )}

            {/* Descrição do problema / observações */}
            {selectedRequests[0].problem_description && (
              <div className={singleRequest?.service_id ? 'border-t border-brand-secondary/20 pt-2.5' : ''}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-1">
                  {singleRequest?.service_id ? 'Observações do cliente' : 'Problema relatado'}
                </p>
                {!singleRequest?.service_id && (
                  <p className="text-[10px] text-muted-foreground mb-1">Solicitação livre — sem serviço do catálogo vinculado</p>
                )}
                <p className="text-xs text-foreground leading-relaxed line-clamp-4">{selectedRequests[0].problem_description}</p>
              </div>
            )}

            {/* Fotos do cliente */}
            {lbImages.length > 0 && (
              <div className="border-t border-brand-secondary/20 pt-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-2 flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  Fotos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lbImages.map((img, idx) => (
                    <PhotoThumb key={img.id} url={img.url!} onClick={() => setLightbox(idx)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Múltiplos destinatários */}
        {isBulk && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Destinatários ({requestCount})</Label>
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

        {/* Cliente + Veículo (manual, sem request) */}
        {requestCount === 0 && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cliente</Label>
              <Select value={selectedClientId} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {allClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Veículo</Label>
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
          </>
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
                <Badge variant={item.category === 'part' ? 'secondary' : 'muted'} className="flex-shrink-0 text-[10px]">
                  {categoryLabel(item.category)}
                </Badge>
                <span className="text-xs font-semibold w-16 text-right flex-shrink-0">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
                <button
                  onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
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
                  maxLength={100}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Select
                    value={newItem.category}
                    onValueChange={(v) => setNewItem((p) => ({ ...p, category: v as 'part' | 'service' }))}
                  >
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
                    max="999"
                    className="h-7 text-xs w-14"
                    value={newItem.quantity ?? ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, quantity: Math.min(999, Math.max(1, Number(e.target.value))) }))}
                  />
                  <Input
                    placeholder="R$ unit."
                    type="number"
                    min="0"
                    max="999999.99"
                    step="0.01"
                    className="h-7 text-xs w-24"
                    value={newItem.unitPrice ?? ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, unitPrice: Math.min(999999.99, Math.max(0, Number(e.target.value))) }))}
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

        {/* Observações */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Observações (opcional)</Label>
          <Textarea
            placeholder="Prazo estimado, condições, detalhes..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Total com breakdown */}
        <div className="rounded-lg bg-brand-primary/5 border border-brand-primary/10 overflow-hidden">
          {items.length > 0 && (
            <div className="px-3 pt-2.5 pb-2 space-y-1.5 border-b border-brand-primary/10">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">×{item.quantity}</span>
                    )}
                    {item.id === 'catalog-service' && (
                      <span className="text-[10px] font-medium text-brand-secondary flex-shrink-0">estimado</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground flex-shrink-0">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm font-semibold text-brand-primary">
              {isBulk ? 'Total por cliente' : 'Total'}
            </span>
            <span className="text-lg font-bold text-brand-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {isError && (
          <p className="text-xs text-destructive">Erro ao enviar orçamento. Tente novamente.</p>
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
          disabled={
            (requestCount === 0 && !selectedVehicleId) ||
            items.length === 0 ||
            isPending
          }
          onClick={handleSubmit}
        >
          {isPending
            ? 'Enviando...'
            : isBulk
              ? `Enviar ${requestCount} orçamentos`
              : 'Enviar orçamento'}
        </Button>
      </div>
    </Card>

    {lightbox !== null && lbImages[lightbox] && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
        onClick={() => setLightbox(null)}
      >
        {/* Fechar + abrir em nova aba */}
        <div className="absolute right-4 top-4 flex gap-2">
          <a
            href={lbImages[lightbox].url!}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir em nova aba"
            className="rounded-full bg-white/15 p-2 text-white hover:bg-white/30 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            className="rounded-full bg-white/15 p-2 text-white hover:bg-white/30 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contador */}
        {lbImages.length > 1 && (
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
            {lightbox + 1} / {lbImages.length}
          </p>
        )}

        {/* Anterior */}
        {lightbox > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1) }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Imagem com fundo branco */}
        <div
          className="rounded-xl overflow-hidden shadow-2xl bg-white max-h-[88vh] max-w-[86vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={lbImages[lightbox].url!}
            alt=""
            className="block max-h-[88vh] max-w-[86vw] object-contain"
          />
        </div>

        {/* Próxima */}
        {lightbox < lbImages.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1) }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>,
      document.body
    )}
  </>
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
          <p className="text-xs text-muted-foreground mt-0.5">O funcionário verá esta nota na aba "Em revisão".</p>
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
        <span className="text-xs text-muted-foreground">— rascunhos de funcionários</span>
      </div>

      {drafts.map((draft) => (
        <Card key={draft.id} className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-brand-secondary">#{draft.budget_number}</span>
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
                <div className="text-sm">
                  {draft.owner && <span className="font-medium text-foreground">{draft.owner.full_name}</span>}
                  {draft.vehicle && (
                    <span className="text-muted-foreground">
                      {' · '}{draft.vehicle.brand} {draft.vehicle.model} {draft.vehicle.year}
                      <span className="ml-1 font-mono text-xs">{draft.vehicle.plate}</span>
                    </span>
                  )}
                </div>
                {draft.service_request && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{draft.service_request.problem_description}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {draft.items.slice(0, 3).map((item, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-white border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.description} · {formatCurrency(item.total_price)}
                    </span>
                  ))}
                  {draft.items.length > 3 && (
                    <span className="text-[10px] text-muted-foreground self-center">+{draft.items.length - 3} item(s)</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-base font-bold text-brand-primary">{formatCurrency(draft.total_amount)}</p>
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
                    onClick={() => publishDraft.mutate({ budgetId: draft.id, serviceRequestId: draft.service_request_id })}
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

      {returning && <ReturnDraftModal budgetId={returning} onClose={() => setReturning(null)} />}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminOrcamentosPage() {
  const [activeTab,        setActiveTab]        = useState<Tab>('solicitacoes')
  const [selectedRequests, setSelectedRequests] = useState<PendingRequest[]>([])
  const [formKey,          setFormKey]          = useState(0)
  // Controla abertura manual do painel (sem request selecionado)
  const [manualPanel,      setManualPanel]      = useState(false)
  // Mantém conteúdo visível durante animação de fechar
  const [lastSelected,     setLastSelected]     = useState<PendingRequest[]>([])
  const [wasManual,        setWasManual]        = useState(false)

  // ── filtros: solicitações ──
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('todas')
  const [catFilters,   setCatFilters]   = useState<string[]>([])
  const [priceFilter,  setPriceFilter]  = useState<'todos' | 'sem_valor' | 'under-100' | '100-500' | '500-2000' | 'over-2000'>('todos')
  const [photoFilter,  setPhotoFilter]  = useState(false)

  // ── filtros: orçamentos enviados ──
  const [budgetSearch,        setBudgetSearch]        = useState('')
  const [budgetStatusFilter,  setBudgetStatusFilter]  = useState<'todos' | 'awaiting_approval' | 'approved' | 'rejected' | 'completed'>('todos')
  const [budgetAmountFilter,  setBudgetAmountFilter]  = useState<'todos' | 'under-500' | '500-2000' | '2000-5000' | 'over-5000'>('todos')
  const [budgetCatFilters,    setBudgetCatFilters]    = useState<string[]>([])

  const { data: requests = [], isLoading: loadingReqs   } = usePendingServiceRequests()
  const { data: budgets  = [], isLoading: loadingBudgets } = useWorkshopBudgets()

  const allCategories = useMemo(
    () => Array.from(new Set(requests.map((r) => r.category).filter(Boolean) as string[])).sort(),
    [requests]
  )

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter((r) => {
      if (statusFilter === 'novas'      && r.status !== 'pending')   return false
      if (statusFilter === 'analisando' && r.status !== 'analyzing') return false
      if (catFilters.length > 0 && !catFilters.includes(r.category ?? '')) return false
      if (priceFilter === 'sem_valor'  && r.service_base_price != null) return false
      if (priceFilter === 'under-100' && !(r.service_base_price != null && r.service_base_price <= 100))          return false
      if (priceFilter === '100-500'   && !(r.service_base_price != null && r.service_base_price > 100  && r.service_base_price <= 500))   return false
      if (priceFilter === '500-2000'  && !(r.service_base_price != null && r.service_base_price > 500  && r.service_base_price <= 2000))  return false
      if (priceFilter === 'over-2000' && !(r.service_base_price != null && r.service_base_price > 2000))          return false
      if (photoFilter  && !(r.images && r.images.length > 0))        return false
      if (q) {
        const haystack = [
          r.owner?.full_name,
          r.vehicle?.brand,
          r.vehicle?.model,
          r.category,
          r.problem_description,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [requests, search, statusFilter, catFilters, priceFilter, photoFilter])

  const priceFilterCount = priceFilter !== 'todos' ? 1 : 0

  const allBudgetCategories = useMemo(
    () => Array.from(new Set(budgets.map((b) => b.service_request?.category).filter(Boolean) as string[])).sort(),
    [budgets]
  )

  const filteredBudgets = useMemo(() => {
    const q = budgetSearch.trim().toLowerCase()
    return budgets.filter((b) => {
      if (budgetStatusFilter !== 'todos' && b.status !== budgetStatusFilter) return false
      if (budgetCatFilters.length > 0 && !budgetCatFilters.includes(b.service_request?.category ?? '')) return false
      if (budgetAmountFilter === 'under-500'  && !(b.total_amount < 500))                                    return false
      if (budgetAmountFilter === '500-2000'   && !(b.total_amount >= 500  && b.total_amount < 2000))         return false
      if (budgetAmountFilter === '2000-5000'  && !(b.total_amount >= 2000 && b.total_amount < 5000))         return false
      if (budgetAmountFilter === 'over-5000'  && !(b.total_amount >= 5000))                                  return false
      if (q) {
        const haystack = [
          b.owner?.full_name,
          b.vehicle.brand,
          b.vehicle.model,
          b.budget_number,
          b.service_request?.category,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [budgets, budgetSearch, budgetStatusFilter, budgetAmountFilter, budgetCatFilters])

  const budgetAmountFilterCount = budgetAmountFilter !== 'todos' ? 1 : 0

  const hasActiveReqFilters    = !!(search || statusFilter !== 'todas' || catFilters.length > 0 || priceFilter !== 'todos' || photoFilter)
  const hasActiveBudgetFilters = !!(budgetSearch || budgetStatusFilter !== 'todos' || budgetAmountFilter !== 'todos' || budgetCatFilters.length > 0)

  function clearReqFilters() {
    setSearch(''); setStatusFilter('todas'); setCatFilters([]); setPriceFilter('todos'); setPhotoFilter(false)
  }
  function clearBudgetFilters() {
    setBudgetSearch(''); setBudgetStatusFilter('todos'); setBudgetAmountFilter('todos'); setBudgetCatFilters([])
  }

  const newCount  = requests.filter((r) => r.status === 'pending').length
  const panelOpen = selectedRequests.length > 0 || manualPanel

  function handleRequestSelect(req: PendingRequest) {
    setSelectedRequests([req])
    setLastSelected([req])
    setManualPanel(false)
    setWasManual(false)
  }

  function handleRequestAdd(req: PendingRequest) {
    setSelectedRequests((prev) => {
      const next = prev.some((r) => r.id === req.id)
        ? prev.filter((r) => r.id !== req.id)
        : [...prev, req]
      if (next.length > 0) setLastSelected(next)
      return next
    })
    setManualPanel(false)
    setWasManual(false)
  }

  function handleDeselect(id: string) {
    setSelectedRequests((prev) => {
      const next = prev.filter((r) => r.id !== id)
      if (next.length > 0) setLastSelected(next)
      return next
    })
  }

  function handleOpenManual() {
    setSelectedRequests([])
    setManualPanel(true)
    setWasManual(true)
    setLastSelected([])
  }

  function handleClosePanel() {
    setSelectedRequests([])
    setManualPanel(false)
  }

  function handleBudgetSent() {
    setSelectedRequests([])
    setManualPanel(false)
    setFormKey((k) => k + 1)
    setActiveTab('enviados')
  }

  const pageHeight = 'calc(100dvh - 104px)'

  return (
    <div className="flex flex-col gap-4" style={{ height: pageHeight }}>
      <PageHeader
        title="Orçamentos"
        description="Solicitações dos clientes e criação de orçamentos"
        actions={
          <Button variant="accent" size="sm" className="gap-1.5" onClick={handleOpenManual}>
            <Plus className="h-4 w-4" />
            Novo orçamento
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border flex-shrink-0">
        {([
          { key: 'solicitacoes' as Tab, label: 'Solicitações',      icon: MessageSquare, badge: newCount },
          { key: 'enviados'     as Tab, label: 'Orçamentos enviados', icon: FileText,      badge: undefined as number | undefined },
        ] as const).map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); handleClosePanel() }}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
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

      {/* Solicitações */}
      {activeTab === 'solicitacoes' && (
        <div className="flex gap-5 flex-1 min-h-0">

          {/* Lista */}
          <div className="flex-1 min-w-0 overflow-y-auto space-y-4 pr-1">
            <DraftSection />

            {/* Barra de filtros */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className={cn('relative transition-all duration-300', panelOpen ? 'w-28' : 'flex-1 min-w-[160px]')}>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente, veículo..."
                  className="w-full rounded-full border border-border bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Pills de status */}
              {(['todas', 'novas', 'analisando'] as RequestStatusFilter[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-150',
                    statusFilter === key
                      ? 'border-brand-secondary bg-brand-secondary text-white shadow-sm'
                      : 'border-border bg-white text-muted-foreground hover:border-brand-secondary/40 hover:text-brand-secondary'
                  )}
                >
                  {key === 'todas' ? 'Todas' : key === 'novas' ? 'Novas' : 'Análise'}
                </button>
              ))}

              {/* Categorias */}
              {allCategories.length > 0 && (
                <FilterPopover
                  label="Categoria"
                  icon={Tag}
                  activeCount={catFilters.length}
                  onClear={() => setCatFilters([])}
                >
                  {allCategories.map((cat) => (
                    <FilterOption
                      key={cat}
                      label={cat}
                      checked={catFilters.includes(cat)}
                      onClick={() =>
                        setCatFilters((prev) =>
                          prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                        )
                      }
                    />
                  ))}
                </FilterPopover>
              )}

              {/* Valor previsto */}
              <FilterPopover
                label="Valor"
                icon={DollarSign}
                activeCount={priceFilterCount}
                hideBadge
                onClear={() => setPriceFilter('todos')}
              >
                {([
                  { key: 'todos',     label: 'Todos'                },
                  { key: 'sem_valor', label: 'Sem valor estimado'   },
                  { key: 'under-100', label: 'Até R$ 100'           },
                  { key: '100-500',   label: 'R$ 100 – R$ 500'      },
                  { key: '500-2000',  label: 'R$ 500 – R$ 2.000'    },
                  { key: 'over-2000', label: 'Acima de R$ 2.000'    },
                ] as const).map(({ key, label }) => (
                  <FilterOption
                    key={key}
                    radio
                    label={label}
                    checked={priceFilter === key}
                    onClick={() => setPriceFilter(key)}
                  />
                ))}
              </FilterPopover>

              {/* Com fotos */}
              <button
                onClick={() => setPhotoFilter((v) => !v)}
                title={photoFilter ? 'Mostrar todas' : 'Apenas com fotos'}
                className={cn(
                  'flex items-center justify-center rounded-full p-1.5 border transition-all duration-150',
                  photoFilter
                    ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                    : 'border-border bg-white text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary'
                )}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              {hasActiveReqFilters && (
                <button
                  onClick={clearReqFilters}
                  title="Limpar filtros"
                  className="flex-shrink-0 flex items-center justify-center rounded-full p-1.5 border border-border bg-white text-muted-foreground hover:border-destructive hover:text-destructive transition-all duration-150"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {selectedRequests.length > 1 && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  {selectedRequests.length} solicitações selecionadas — mesmo orçamento para cada
                </span>
                <button className="font-medium text-brand-secondary hover:underline" onClick={() => setSelectedRequests([])}>
                  Limpar seleção
                </button>
              </div>
            )}

            {loadingReqs ? (
              <LoadingState />
            ) : requests.length === 0 ? (
              <EmptyState title="Nenhuma solicitação pendente" className="py-10" />
            ) : filteredRequests.length === 0 ? (
              <EmptyState title="Nenhuma solicitação encontrada" description="Tente ajustar os filtros" className="py-10" />
            ) : (
              <div className="space-y-2">
                {filteredRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    selected={selectedRequests.some((r) => r.id === req.id)}
                    showRemove={selectedRequests.length > 1}
                    onSelect={() => handleRequestSelect(req)}
                    onAdd={() => handleRequestAdd(req)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Painel lateral */}
          <div className={cn(
            'flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out',
            panelOpen ? 'w-[560px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}>
            <div className={cn(
              'w-[560px] h-full transition-transform duration-300 ease-out',
              panelOpen ? 'translate-x-0' : 'translate-x-6'
            )}>
              <CreateBudgetPanel
                key={formKey}
                selectedRequests={panelOpen ? selectedRequests : lastSelected}
                onDeselect={handleDeselect}
                onClose={handleClosePanel}
                onSuccess={handleBudgetSent}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enviados */}
      {activeTab === 'enviados' && (
        <div className="flex-1 overflow-y-auto space-y-4">

          {/* Barra de filtros */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={budgetSearch}
                onChange={(e) => setBudgetSearch(e.target.value)}
                placeholder="Buscar cliente, veículo, nº..."
                className="w-full rounded-full border border-border bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              {budgetSearch && (
                <button
                  onClick={() => setBudgetSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Pills de status */}
            {([
              { key: 'todos',              label: 'Todos'               },
              { key: 'awaiting_approval',  label: 'Aguardando'          },
              { key: 'approved',           label: 'Aprovado'            },
              { key: 'rejected',           label: 'Recusado'            },
              { key: 'completed',          label: 'Concluído'           },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setBudgetStatusFilter(key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-150',
                  budgetStatusFilter === key
                    ? 'border-brand-secondary bg-brand-secondary text-white shadow-sm'
                    : 'border-border bg-white text-muted-foreground hover:border-brand-secondary/40 hover:text-brand-secondary'
                )}
              >
                {label}
              </button>
            ))}

            {/* Faixa de valor */}
            <FilterPopover
              label="Valor"
              icon={DollarSign}
              activeCount={budgetAmountFilterCount}
              hideBadge
              onClear={() => setBudgetAmountFilter('todos')}
            >
              {([
                { key: 'todos',      label: 'Todos'                  },
                { key: 'under-500',  label: 'Até R$ 500'             },
                { key: '500-2000',   label: 'R$ 500 – R$ 2.000'      },
                { key: '2000-5000',  label: 'R$ 2.000 – R$ 5.000'    },
                { key: 'over-5000',  label: 'Acima de R$ 5.000'      },
              ] as const).map(({ key, label }) => (
                <FilterOption
                  key={key}
                  radio
                  label={label}
                  checked={budgetAmountFilter === key}
                  onClick={() => setBudgetAmountFilter(key)}
                />
              ))}
            </FilterPopover>

            {/* Categoria */}
            {allBudgetCategories.length > 0 && (
              <FilterPopover
                label="Categoria"
                icon={Tag}
                activeCount={budgetCatFilters.length}
                onClear={() => setBudgetCatFilters([])}
              >
                {allBudgetCategories.map((cat) => (
                  <FilterOption
                    key={cat}
                    label={cat}
                    checked={budgetCatFilters.includes(cat)}
                    onClick={() =>
                      setBudgetCatFilters((prev) =>
                        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                      )
                    }
                  />
                ))}
              </FilterPopover>
            )}

            {hasActiveBudgetFilters && (
              <button
                onClick={clearBudgetFilters}
                title="Limpar filtros"
                className="flex-shrink-0 flex items-center justify-center rounded-full p-1.5 border border-border bg-white text-muted-foreground hover:border-destructive hover:text-destructive transition-all duration-150"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingBudgets ? (
                <LoadingState />
              ) : budgets.length === 0 ? (
                <EmptyState title="Nenhum orçamento enviado ainda" className="py-10" />
              ) : filteredBudgets.length === 0 ? (
                <EmptyState title="Nenhum orçamento encontrado" description="Tente ajustar os filtros" className="py-10" />
              ) : (
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
                      {filteredBudgets.map((b) => (
                        <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs font-semibold text-brand-secondary">#{b.budget_number}</span>
                          </td>
                          <td className="px-5 py-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              {b.vehicle.brand} {b.vehicle.model} {b.vehicle.year}
                              {b.service_request?.category && (
                                <Badge variant="muted" className="h-4 px-1.5 text-[10px]">{b.service_request.category}</Badge>
                              )}
                            </div>
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
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
