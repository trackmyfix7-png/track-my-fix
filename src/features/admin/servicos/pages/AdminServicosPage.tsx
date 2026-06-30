import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, AlertCircle, Wrench, X, Clock, Tag, DollarSign, Trash2, ChevronDown, Check } from 'lucide-react'
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
  useWorkshopServices, useToggleService, useCreateService,
  useUpdateService, useDeleteService,
} from '../hooks/useAdminServicesCatalog'
import type { AdminServiceRow, CreateServiceData } from '../services/admin-services-catalog.service'

const MAX_PRICE = 9_999_999.99

const DEFAULT_CATEGORIES = [
  'Manutenção', 'Freios', 'Motor', 'Pneus e Suspensão',
  'Elétrica', 'Ar-condicionado', 'Direção', 'Arrefecimento',
  'Funilaria e Pintura', 'Revisão',
]

// ─── Tooltip (portal para escapar de overflow:hidden) ─────────────────────────

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <div className="inline-flex"
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ x: r.left + r.width / 2, y: r.top })
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <div className="pointer-events-none fixed z-[9999] -translate-x-1/2"
          style={{ left: pos.x, top: pos.y - 8, transform: 'translateX(-50%) translateY(-100%)' }}>
          <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white whitespace-nowrap shadow-lg">
            {text}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Filtros ───────────────────────────────────────────────────────────────────

type StatusFilter = 'todos' | 'ativos' | 'desativados'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'todos',       label: 'Todos'    },
  { key: 'ativos',      label: 'Ativos'   },
  { key: 'desativados', label: 'Inativos' },
]

interface PricePreset { key: string; label: string; min: number; max: number }
const PRICE_PRESETS: PricePreset[] = [
  { key: 'no-price',  label: 'Sem preço',        min: 0,    max: 0           },
  { key: 'under-100', label: 'Até R$ 100',        min: 0.01, max: 100         },
  { key: '100-500',   label: 'R$ 100 – R$ 500',   min: 100,  max: 500         },
  { key: '500-2000',  label: 'R$ 500 – R$ 2.000', min: 500,  max: 2_000       },
  { key: 'over-2000', label: 'Acima de R$ 2.000', min: 2_000, max: MAX_PRICE  },
]

function parseDurationMinutes(s: string): number {
  const h = s.match(/(\d+)\s*h/)
  const m = s.match(/(\d+)\s*min/)
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0)
}

// ─── FilterPopover ─────────────────────────────────────────────────────────────

function FilterPopover({ label, icon: Icon, activeCount, onClear, children }: {
  label:       string
  icon:        React.ElementType
  activeCount: number
  onClear:     () => void
  children:    React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = activeCount > 0

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-150',
          isActive
            ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
            : 'border-border bg-white text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary'
        )}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        {label}
        {isActive && (
          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-150 flex-shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 min-w-[180px] rounded-xl border border-border bg-white shadow-xl overflow-hidden">
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
        </div>
      )}
    </div>
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

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors { name?: string; base_price?: string }

function validate(form: CreateServiceData): FormErrors {
  const e: FormErrors = {}
  if (!form.name.trim())           e.name       = 'Nome é obrigatório'
  if (form.base_price <= 0)        e.base_price = 'Informe um valor maior que R$ 0,00'
  if (form.base_price > MAX_PRICE) e.base_price = `Valor máximo: ${formatCurrency(MAX_PRICE)}`
  return e
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />{msg}
    </p>
  )
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function ServiceFields({
  form, errors, touched, onChange,
}: {
  form:     CreateServiceData
  errors:   FormErrors
  touched:  boolean
  onChange: <K extends keyof CreateServiceData>(key: K, val: CreateServiceData[K]) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="Ex: Troca de óleo e filtro"
          value={form.name}
          className={cn('h-9', touched && errors.name && 'border-destructive')}
          onChange={(e) => onChange('name', e.target.value)}
        />
        <FieldError msg={touched ? errors.name : undefined} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoria</Label>
          <Input list="svc-cats" placeholder="Ex: Manutenção" value={form.category} className="h-9"
            onChange={(e) => onChange('category', e.target.value)} />
          <datalist id="svc-cats">
            {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prazo</Label>
          <Input placeholder="Ex: 1h 30min" value={form.estimated_time} className="h-9"
            onChange={(e) => onChange('estimated_time', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição</Label>
        <Textarea placeholder="O que está incluído neste serviço..." rows={3}
          value={form.description} onChange={(e) => onChange('description', e.target.value)}
          className="resize-none text-sm" />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Preço base <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground select-none">R$</span>
          <Input type="number" min="0.01" max={MAX_PRICE} step="0.01" placeholder="0,00"
            value={form.base_price || ''}
            className={cn('h-9 pl-9', touched && errors.base_price && 'border-destructive')}
            onChange={(e) => onChange('base_price', parseFloat(e.target.value) || 0)} />
        </div>
        {touched && errors.base_price
          ? <FieldError msg={errors.base_price} />
          : <p className="text-[11px] text-muted-foreground mt-0.5">Máx. {formatCurrency(MAX_PRICE)}</p>}
      </div>
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateServiceData = { name: '', category: '', description: '', estimated_time: '', base_price: 0 }

function CreateServiceModal({ open, onClose, onSave, saving }: {
  open: boolean; onClose: () => void; onSave: (d: CreateServiceData) => Promise<void>; saving: boolean
}) {
  const [form, setForm]       = useState<CreateServiceData>(EMPTY_FORM)
  const [errors, setErrors]   = useState<FormErrors>({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setErrors({}); setTouched(false) }
  }, [open])

  function handleChange<K extends keyof CreateServiceData>(key: K, val: CreateServiceData[K]) {
    const next = { ...form, [key]: val }
    setForm(next)
    if (touched) setErrors(validate(next))
  }

  async function handleSave() {
    setTouched(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 flex-shrink-0">
              <Wrench className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-brand-primary">Novo serviço</DialogTitle>
              <p className="text-xs text-muted-foreground">Preencha os dados para cadastrar no catálogo</p>
            </div>
          </div>
        </DialogHeader>
        <ServiceFields form={form} errors={errors} touched={touched} onChange={handleChange} />
        <DialogFooter className="pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="accent" size="sm" disabled={saving} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Criar serviço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Inline editable stat card ────────────────────────────────────────────────

type EditingField = 'price' | 'time' | 'category' | null

interface StatCardProps {
  icon:         React.ElementType
  label:        string
  displayValue: string
  warn?:        boolean
  active:       boolean
  onActivate:   () => void
  children:     React.ReactNode
}

function StatCard({ icon: Icon, label, displayValue, warn, active, onActivate, children }: StatCardProps) {
  return (
    <div
      onClick={() => { if (!active) onActivate() }}
      className={cn(
        'relative px-2 py-3 text-center transition-colors select-none',
        active ? 'bg-brand-primary/5 cursor-default' : 'cursor-pointer hover:bg-muted/50 group'
      )}
    >
      {active ? (
        <div className="flex flex-col items-center gap-1 min-h-[52px] justify-center">
          {children}
        </div>
      ) : (
        <>
          <Icon className={cn(
            'h-3.5 w-3.5 mx-auto mb-1.5 transition-colors',
            warn ? 'text-amber-500' : 'text-muted-foreground group-hover:text-brand-primary'
          )} />
          <p className={cn(
            'text-[13px] font-bold leading-tight truncate transition-colors',
            warn ? 'text-amber-600' : 'text-foreground group-hover:text-brand-primary'
          )}>
            {displayValue}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-full" />
        </>
      )}
    </div>
  )
}

// ─── Detail / Edit Panel ──────────────────────────────────────────────────────

function ServiceDetailPanel({
  service, onClose, onSave, onDelete, onToggle, saving,
}: {
  service:  AdminServiceRow
  onClose:  () => void
  onSave:   (id: string, data: CreateServiceData) => Promise<void>
  onDelete: (id: string) => void
  onToggle: (service: AdminServiceRow, value: boolean) => void
  saving:   boolean
}) {
  const [form, setForm]         = useState<CreateServiceData>({
    name: service.name, category: service.category ?? '',
    description: service.description ?? '', estimated_time: service.estimated_time ?? '',
    base_price: service.base_price,
  })
  const [errors,       setErrors]       = useState<FormErrors>({})
  const [touched,      setTouched]      = useState(false)
  const [isDirty,      setIsDirty]      = useState(false)
  const [editingField, setEditingField] = useState<EditingField>(null)

  const priceInputRef    = useRef<HTMLInputElement>(null)
  const timeInputRef     = useRef<HTMLInputElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm({
      name: service.name, category: service.category ?? '',
      description: service.description ?? '', estimated_time: service.estimated_time ?? '',
      base_price: service.base_price,
    })
    setErrors({}); setTouched(false); setIsDirty(false); setEditingField(null)
  }, [service.id])

  // Focus o input quando o campo ativo muda
  useEffect(() => {
    if (editingField === 'price')    setTimeout(() => priceInputRef.current?.focus(),    10)
    if (editingField === 'time')     setTimeout(() => timeInputRef.current?.focus(),     10)
    if (editingField === 'category') setTimeout(() => categoryInputRef.current?.focus(), 10)
  }, [editingField])

  function handleChange<K extends keyof CreateServiceData>(key: K, val: CreateServiceData[K]) {
    const next = { ...form, [key]: val }
    setForm(next); setIsDirty(true)
    if (touched) setErrors(validate(next))
  }

  async function handleSave() {
    setTouched(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await onSave(service.id, form)
    setIsDirty(false); setTouched(false)
  }

  const missingPrice = service.base_price === 0 && !service.is_active
  const priceDisplay = form.base_price > 0 ? formatCurrency(form.base_price) : '—'

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-white shadow-md overflow-hidden">

      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-start gap-3 flex-shrink-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/8 border border-border mt-0.5">
          <Wrench className="h-4 w-4 text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-brand-primary leading-snug">{service.name}</p>
          {form.category && (
            <span className="mt-1 inline-block rounded-full bg-brand-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-secondary">
              {form.category}
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="flex-shrink-0 mt-0.5 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status toggle */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2 bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Switch checked={service.is_active} disabled={missingPrice}
            onCheckedChange={(v) => onToggle(service, v)}
            className={cn(missingPrice && 'opacity-40 cursor-not-allowed')} />
          <span className={cn('text-sm font-medium', service.is_active ? 'text-emerald-700' : 'text-muted-foreground')}>
            {service.is_active ? 'Ativo no catálogo' : 'Inativo'}
          </span>
        </div>
        {missingPrice && (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 leading-none">
            Adicione um preço para ativar
          </span>
        )}
      </div>

      {/* Stats inline editáveis */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border flex-shrink-0">

        {/* Preço */}
        <StatCard
          icon={DollarSign} label="Preço base" displayValue={priceDisplay}
          warn={form.base_price === 0} active={editingField === 'price'}
          onActivate={() => setEditingField('price')}
        >
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Preço base</p>
          <div className="relative w-full px-2">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
            <input
              ref={priceInputRef}
              type="number" min="0.01" max={MAX_PRICE} step="0.01"
              value={form.base_price || ''}
              placeholder="0,00"
              onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur() }}
              className="w-full rounded-md border border-brand-accent/60 bg-white pl-7 pr-2 py-1.5 text-center text-sm font-bold text-brand-primary outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </StatCard>

        {/* Prazo */}
        <StatCard
          icon={Clock} label="Prazo" displayValue={form.estimated_time || '—'}
          active={editingField === 'time'} onActivate={() => setEditingField('time')}
        >
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Prazo</p>
          <input
            ref={timeInputRef}
            type="text" placeholder="1h 30min"
            value={form.estimated_time}
            onChange={(e) => handleChange('estimated_time', e.target.value)}
            onBlur={() => setEditingField(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur() }}
            className="w-full rounded-md border border-brand-accent/60 bg-white px-2 py-1.5 text-center text-sm font-bold text-brand-primary outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30"
          />
        </StatCard>

        {/* Categoria */}
        <StatCard
          icon={Tag} label="Categoria" displayValue={form.category || '—'}
          active={editingField === 'category'} onActivate={() => setEditingField('category')}
        >
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Categoria</p>
          <div className="relative w-full px-1">
            <input
              ref={categoryInputRef}
              type="text" placeholder="Buscar..."
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              onBlur={() => setTimeout(() => setEditingField(null), 120)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null) }}
              className="w-full rounded-md border border-brand-accent/60 bg-white px-2 py-1.5 text-center text-[11px] font-bold text-brand-primary outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30"
            />
            {/* Dropdown de opções */}
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-white shadow-xl overflow-hidden">
              {DEFAULT_CATEGORIES
                .filter((c) => c.toLowerCase().includes((form.category ?? '').toLowerCase()))
                .map((cat) => (
                  <button
                    key={cat}
                    onMouseDown={(e) => { e.preventDefault(); handleChange('category', cat); setEditingField(null) }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-xs font-medium transition-colors',
                      form.category === cat
                        ? 'bg-brand-primary/8 text-brand-primary font-semibold'
                        : 'text-foreground hover:bg-muted/60 hover:text-brand-primary'
                    )}
                  >
                    {cat}
                  </button>
                ))
              }
              {DEFAULT_CATEGORIES.filter((c) => c.toLowerCase().includes((form.category ?? '').toLowerCase())).length === 0 && (
                <p className="px-3 py-2.5 text-xs text-muted-foreground text-center">Nenhuma categoria encontrada</p>
              )}
            </div>
          </div>
        </StatCard>

      </div>

      {/* Form — só Nome e Descrição, sem scroll */}
      <div className="flex-1 px-4 py-4 space-y-3 min-h-0">

        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.name}
            className={cn('h-9', touched && errors.name && 'border-destructive')}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          <FieldError msg={touched ? errors.name : undefined} />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição</Label>
          <Textarea
            placeholder="O que está incluído neste serviço..."
            rows={4}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="resize-none text-sm"
          />
        </div>

        {touched && errors.base_price && (
          <FieldError msg={errors.base_price} />
        )}

      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3 flex-shrink-0">
        <button onClick={() => onDelete(service.id)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
          Remover
        </button>
        <Button variant="accent" size="sm" disabled={!isDirty || saving} onClick={handleSave}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminServicosPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [catFilters,   setCatFilters]   = useState<string[]>([])
  const [priceFilter,  setPriceFilter]  = useState<string | null>(null)
  const [durFilter,    setDurFilter]    = useState<string | null>(null)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [createOpen,   setCreateOpen]   = useState(false)

  const lastServiceRef = useRef<AdminServiceRow | null>(null)

  const { data: services = [], isLoading, isError, refetch } = useWorkshopServices()
  const toggleService = useToggleService()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  // Categorias e prazos únicos extraídos dos dados reais
  const allCategories = useMemo(() =>
    [...new Set(services.map((s) => s.category).filter(Boolean) as string[])].sort(),
    [services]
  )
  const allDurations = useMemo(() =>
    [...new Set(services.map((s) => s.estimated_time).filter(Boolean) as string[])]
      .sort((a, b) => parseDurationMinutes(a) - parseDurationMinutes(b)),
    [services]
  )

  // Lógica de filtro combinada (AND entre todos os filtros ativos)
  const filtered = useMemo(() => services.filter((s) => {
    if (statusFilter === 'ativos'      && !s.is_active) return false
    if (statusFilter === 'desativados' &&  s.is_active) return false
    if (catFilters.length > 0 && !catFilters.includes(s.category ?? '')) return false
    if (priceFilter) {
      const preset = PRICE_PRESETS.find((p) => p.key === priceFilter)!
      if (preset.key === 'no-price') { if (s.base_price !== 0) return false }
      else { if (s.base_price < preset.min || s.base_price > preset.max) return false }
    }
    if (durFilter && s.estimated_time !== durFilter) return false
    return true
  }), [services, statusFilter, catFilters, priceFilter, durFilter])

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  const selectedService = selectedId ? (services.find((s) => s.id === selectedId) ?? null) : null
  if (selectedService) lastServiceRef.current = selectedService
  const displayService = selectedService ?? lastServiceRef.current
  const panelOpen = !!selectedId && !!selectedService

  const statusCounts = {
    todos:       services.length,
    ativos:      services.filter((s) =>  s.is_active).length,
    desativados: services.filter((s) => !s.is_active).length,
  }

  const hasExtraFilters = catFilters.length > 0 || !!priceFilter || !!durFilter

  function clearAllFilters() {
    setStatusFilter('todos'); setCatFilters([]); setPriceFilter(null); setDurFilter(null)
  }

  async function handleCreate(data: CreateServiceData) {
    await createService.mutateAsync(data)
    setCreateOpen(false)
  }
  async function handleSave(id: string, data: CreateServiceData) {
    await updateService.mutateAsync({ id, data })
  }
  async function handleDelete(id: string) {
    if (!confirm('Remover este serviço do catálogo?')) return
    await deleteService.mutateAsync(id)
    if (selectedId === id) setSelectedId(null)
  }
  function handleToggle(service: AdminServiceRow, value: boolean) {
    if (value && service.base_price === 0) return
    toggleService.mutate({ id: service.id, isActive: value })
  }

  const pageHeight = 'calc(100dvh - 104px)'

  return (
    <div className="flex flex-col gap-4" style={{ height: pageHeight }}>

      {/* Header */}
      <PageHeader
        title="Tabela de serviços"
        description="Clique em um serviço para ver detalhes e editar"
        actions={
          <Button variant="accent" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">

        {/* Status tabs */}
        {STATUS_TABS.map(({ key, label }) => {
          const isActive = statusFilter === key
          return (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'border border-border bg-white text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary'
              )}>
              {label}
              <span className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
              )}>
                {statusCounts[key]}
              </span>
            </button>
          )
        })}

        {/* Separador */}
        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Categoria */}
        <FilterPopover
          label="Categoria" icon={Tag}
          activeCount={catFilters.length}
          onClear={() => setCatFilters([])}
        >
          {allCategories.map((cat) => (
            <FilterOption
              key={cat} label={cat}
              checked={catFilters.includes(cat)}
              onClick={() => setCatFilters((prev) =>
                prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
              )}
            />
          ))}
        </FilterPopover>

        {/* Preço */}
        <FilterPopover
          label="Preço" icon={DollarSign}
          activeCount={priceFilter ? 1 : 0}
          onClear={() => setPriceFilter(null)}
        >
          {PRICE_PRESETS.map((preset) => (
            <FilterOption
              key={preset.key} label={preset.label} radio
              checked={priceFilter === preset.key}
              onClick={() => setPriceFilter(priceFilter === preset.key ? null : preset.key)}
            />
          ))}
        </FilterPopover>

        {/* Prazo */}
        <FilterPopover
          label="Prazo" icon={Clock}
          activeCount={durFilter ? 1 : 0}
          onClear={() => setDurFilter(null)}
        >
          {allDurations.map((dur) => (
            <FilterOption
              key={dur} label={dur} radio
              checked={durFilter === dur}
              onClick={() => setDurFilter(durFilter === dur ? null : dur)}
            />
          ))}
          {allDurations.length === 0 && (
            <p className="px-3 py-3 text-xs text-muted-foreground">Nenhum prazo cadastrado</p>
          )}
        </FilterPopover>

        {/* Limpar tudo */}
        {(hasExtraFilters || statusFilter !== 'todos') && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-1"
          >
            <X className="h-3 w-3" />
            Limpar tudo
          </button>
        )}

        {/* Contador de resultados */}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'serviço' : 'serviços'}
        </span>
      </div>

      {/* Split layout — flex com animação de largura no painel */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Tabela — ocupa todo o espaço restante */}
        <Card className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState title="Nenhum serviço neste filtro" className="py-12 flex-1" />
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-white border-b border-border shadow-[0_1px_0_0_hsl(var(--border))]">
                    <tr>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Serviço</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-36">Categoria</th>
                      {!panelOpen && (
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição</th>
                      )}
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24">Prazo</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Preço base</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">Ativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((service) => {
                      const isSelected   = service.id === selectedId
                      const missingPrice = service.base_price === 0 && !service.is_active

                      return (
                        <tr key={service.id}
                          onClick={() => setSelectedId(isSelected ? null : service.id)}
                          className={cn(
                            'group cursor-pointer transition-colors duration-150',
                            isSelected
                              ? 'bg-brand-primary/[0.04]'
                              : !service.is_active
                                ? 'bg-muted/30 hover:bg-muted/50'
                                : 'hover:bg-muted/40'
                          )}>

                          <td className={cn(
                            'px-5 py-3.5 border-l-2 transition-colors duration-200',
                            isSelected ? 'border-l-brand-accent' : 'border-l-transparent'
                          )}>
                            <span className={cn(
                              'text-sm font-semibold whitespace-nowrap',
                              service.is_active ? 'text-brand-primary' : 'text-muted-foreground'
                            )}>
                              {service.name}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            {service.category ? (
                              <span className="inline-block rounded-full bg-brand-secondary/10 px-2.5 py-0.5 text-xs font-medium text-brand-secondary whitespace-nowrap">
                                {service.category}
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>

                          {!panelOpen && (
                            <td className="px-4 py-3.5 max-w-[240px]">
                              <span className="text-sm text-muted-foreground block truncate">
                                {service.description ?? '—'}
                              </span>
                            </td>
                          )}

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-sm text-foreground">{service.estimated_time ?? '—'}</span>
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {service.base_price > 0 ? (
                              <span className="text-sm font-semibold text-brand-primary">
                                {formatCurrency(service.base_price)}
                              </span>
                            ) : (
                              <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                Sem preço
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              {missingPrice ? (
                                <Tip text="Defina um preço para ativar">
                                  <Switch checked={false} disabled
                                    className="opacity-30 cursor-not-allowed" />
                                </Tip>
                              ) : (
                                <Switch checked={service.is_active}
                                  onCheckedChange={(v) => handleToggle(service, v)} />
                              )}
                            </div>
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

        {/* Painel lateral — anima largura + desliza */}
        <div className={cn(
          'flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out',
          panelOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
        )}>
          <div className={cn(
            'w-[400px] h-full transition-transform duration-300 ease-out',
            panelOpen ? 'translate-x-0' : 'translate-x-6'
          )}>
            {displayService && (
              <ServiceDetailPanel
                key={displayService.id}
                service={displayService}
                onClose={() => setSelectedId(null)}
                onSave={handleSave}
                onDelete={handleDelete}
                onToggle={handleToggle}
                saving={updateService.isPending}
              />
            )}
          </div>
        </div>

      </div>

      <CreateServiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        saving={createService.isPending}
      />
    </div>
  )
}
