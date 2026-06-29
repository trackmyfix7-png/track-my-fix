import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { cn, formatCurrency } from '@/lib/utils'
import {
  useWorkshopServices,
  useToggleService,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from '../hooks/useAdminServicesCatalog'
import type { AdminServiceRow, CreateServiceData } from '../services/admin-services-catalog.service'

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type ServiceFilter = 'todos' | 'ativos' | 'desativados'

const FILTER_TABS: { key: ServiceFilter; label: string }[] = [
  { key: 'todos',       label: 'Todos'       },
  { key: 'ativos',      label: 'Ativos'      },
  { key: 'desativados', label: 'Desativados' },
]

// ─── Form modal ───────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateServiceData = {
  name:           '',
  category:       '',
  description:    '',
  estimated_time: '',
  base_price:     0,
}

function ServiceFormModal({ open, initial, onClose, onSave, saving }: {
  open:    boolean
  initial: CreateServiceData | null
  onClose: () => void
  onSave:  (data: CreateServiceData) => Promise<void>
  saving:  boolean
}) {
  const [form, setForm] = useState<CreateServiceData>(initial ?? EMPTY_FORM)
  const isEdit = !!initial

  function set<K extends keyof CreateServiceData>(key: K, value: CreateServiceData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleOpenChange(v: boolean) {
    if (!v) onClose()
  }

  async function handleSave() {
    if (!form.name || form.base_price <= 0) return
    await onSave(form)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              placeholder="Ex: Troca de óleo"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input
                placeholder="Ex: Manutenção"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo estimado</Label>
              <Input
                placeholder="Ex: 1h, 2 dias"
                value={form.estimated_time}
                onChange={(e) => set('estimated_time', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Detalhes do serviço..."
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Preço base (R$) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.base_price || ''}
              onChange={(e) => set('base_price', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="accent"
            disabled={!form.name || form.base_price <= 0 || saving}
            onClick={handleSave}
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminServicosPage() {
  const [filter, setFilter] = useState<ServiceFilter>('todos')
  const [modal,  setModal]  = useState<{ open: boolean; editing: AdminServiceRow | null }>({
    open: false, editing: null,
  })

  const { data: services = [], isLoading, isError, refetch } = useWorkshopServices()
  const toggleService  = useToggleService()
  const createService  = useCreateService()
  const updateService  = useUpdateService()
  const deleteService  = useDeleteService()

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  const filtered =
    filter === 'ativos'      ? services.filter((s) =>  s.is_active)
    : filter === 'desativados' ? services.filter((s) => !s.is_active)
    : services

  const counts = {
    todos:       services.length,
    ativos:      services.filter((s) =>  s.is_active).length,
    desativados: services.filter((s) => !s.is_active).length,
  }

  function openCreate() {
    setModal({ open: true, editing: null })
  }

  function openEdit(service: AdminServiceRow) {
    setModal({ open: true, editing: service })
  }

  function closeModal() {
    setModal({ open: false, editing: null })
  }

  async function handleSave(data: CreateServiceData) {
    if (modal.editing) {
      await updateService.mutateAsync({ id: modal.editing.id, data })
    } else {
      await createService.mutateAsync(data)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este serviço?')) return
    await deleteService.mutateAsync(id)
  }

  const isSaving = createService.isPending || updateService.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabela de serviços"
        description="Gerencie os serviços visíveis no catálogo do cliente"
        actions={
          <Button variant="accent" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(({ key, label }) => {
          const isActive = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'border border-border bg-white text-muted-foreground hover:border-brand-primary/30 hover:text-brand-primary'
              )}
            >
              {label}
              <span className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
              )}>
                {counts[key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhum serviço neste filtro" className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Serviço', 'Categoria', 'Descrição', 'Prazo', 'Preço', 'Ativo', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:w-16"
                      >
                        {h === 'Ativo' ? <span className="flex justify-center">{h}</span> : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((service) => (
                    <tr
                      key={service.id}
                      className={cn(
                        'border-b border-border last:border-0 transition-colors',
                        service.is_active ? 'hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/30'
                      )}
                    >
                      <td className="px-5 py-3">
                        <span className={cn(
                          'text-sm font-semibold',
                          service.is_active ? 'text-brand-primary' : 'text-muted-foreground line-through'
                        )}>
                          {service.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {service.category ? (
                          <span className="rounded-full bg-brand-secondary/10 px-2.5 py-0.5 text-xs font-medium text-brand-secondary">
                            {service.category}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-muted-foreground max-w-[200px] block truncate">
                          {service.description ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-foreground">
                          {service.estimated_time ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-semibold text-brand-primary">
                          {formatCurrency(service.base_price)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center">
                          <Switch
                            checked={service.is_active}
                            onCheckedChange={(v) =>
                              toggleService.mutate({ id: service.id, isActive: v })
                            }
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(service)}
                            className="rounded p-1 text-muted-foreground hover:text-brand-secondary hover:bg-brand-secondary/10 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceFormModal
        open={modal.open}
        initial={
          modal.editing
            ? {
                name:           modal.editing.name,
                category:       modal.editing.category       ?? '',
                description:    modal.editing.description    ?? '',
                estimated_time: modal.editing.estimated_time ?? '',
                base_price:     modal.editing.base_price,
              }
            : null
        }
        onClose={closeModal}
        onSave={handleSave}
        saving={isSaving}
      />
    </div>
  )
}
