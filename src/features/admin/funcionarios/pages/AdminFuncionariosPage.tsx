import { useState, useEffect, useRef } from 'react'
import {
  Trash2, Link, Copy, CheckCheck, UserPlus,
  Phone, Mail, Briefcase, Calendar, FileText, HardHat,
  ShieldCheck, ShieldOff, X, BadgeCheck,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, getInitials, maskPhone } from '@/lib/utils'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { useWorkshopEmployees, useRemoveEmployee, useToggleBudgetApproval } from '../hooks/useAdminEmployees'
import { useEmployeesHR, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployeesHR'
import type { EmployeeHR } from '../services/admin-employees-hr.service'
import type { EmployeeRow } from '../services/admin-employees.service'

function displayPhone(v: string | null | undefined) {
  return v ? maskPhone(v) : '—'
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UnifiedEmployee {
  key:               string
  displayName:       string
  email:             string | null
  phone:             string | null
  position:          string | null
  hiredAt:           string | null
  notes:             string | null
  hasHR:             boolean
  hasPortal:         boolean
  canApproveBudgets: boolean
  hr?:               EmployeeHR
  portal?:           EmployeeRow
}

function buildUnified(hrList: EmployeeHR[], portalList: EmployeeRow[]): UnifiedEmployee[] {
  const used = new Set<string>()
  const result: UnifiedEmployee[] = []

  for (const hr of hrList) {
    const portal = hr.linked_user_id
      ? portalList.find((p) => p.employee_id === hr.linked_user_id)
      : undefined
    if (portal) used.add(portal.id)
    result.push({
      key:               `hr:${hr.id}`,
      displayName:       hr.name,
      email:             hr.email,
      phone:             hr.phone,
      position:          hr.position,
      hiredAt:           hr.hired_at,
      notes:             hr.notes,
      hasHR:             true,
      hasPortal:         !!portal,
      canApproveBudgets: portal?.can_approve_budgets ?? false,
      hr,
      portal,
    })
  }

  for (const p of portalList) {
    if (used.has(p.id)) continue
    result.push({
      key:               `portal:${p.id}`,
      displayName:       p.employee?.full_name ?? '(sem nome)',
      email:             p.employee?.email     ?? null,
      phone:             p.employee?.phone     ?? null,
      position:          null,
      hiredAt:           null,
      notes:             null,
      hasHR:             false,
      hasPortal:         true,
      canApproveBudgets: p.can_approve_budgets,
      portal:            p,
    })
  }

  return result
}

// ─── Link de convite ──────────────────────────────────────────────────────────

function InviteLinkCard() {
  const { data: workshop } = useWorkshop()
  const [copied, setCopied] = useState(false)

  const inviteUrl = workshop?.slug
    ? `${window.location.origin}/convite-funcionario/${workshop.slug}`
    : null

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 flex-shrink-0">
      <Link className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <p className="text-xs text-muted-foreground flex-1">Link de convite para acesso ao portal</p>
      {inviteUrl ? (
        <div className="flex items-center gap-2">
          <span className="hidden sm:block truncate max-w-[280px] text-xs text-muted-foreground font-mono">
            {inviteUrl}
          </span>
          <Button size="sm" variant={copied ? 'default' : 'outline'} className="shrink-0 h-7 gap-1.5 text-xs" onClick={handleCopy}>
            {copied ? <><CheckCheck className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
          </Button>
        </div>
      ) : (
        <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
      )}
    </div>
  )
}

// ─── Modal de criar funcionário ───────────────────────────────────────────────

function CreateEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', position: '', phone: '', email: '', hired_at: '', notes: '' })
  const create = useCreateEmployee()

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    await create.mutateAsync({
      name:     form.name.trim(),
      position: form.position.trim() || undefined,
      phone:    form.phone.trim()    || undefined,
      email:    form.email.trim()    || undefined,
      hired_at: form.hired_at        || undefined,
      notes:    form.notes.trim()    || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-secondary/10">
            <HardHat className="h-5 w-5 text-brand-secondary" />
          </div>
          <div>
            <DialogTitle className="text-base">Adicionar funcionário</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Adicione um membro à equipe</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Nome completo" required>
            <Input placeholder="Ex: Carlos Souza" value={form.name} onChange={(e) => set('name', e.target.value)} required className="h-10" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo"><Input placeholder="Ex: Mecânico" value={form.position} onChange={(e) => set('position', e.target.value)} className="h-10" /></Field>
            <Field label="Telefone"><Input placeholder="(11) 99999-0000" value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} className="h-10" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail" required>
              <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => set('email', e.target.value)} required className="h-10" />
            </Field>
            <Field label="Admissão"><Input type="date" value={form.hired_at} onChange={(e) => set('hired_at', e.target.value)} className="h-10" /></Field>
          </div>
          <Field label="Observações"><Input placeholder="Informações adicionais..." value={form.notes} onChange={(e) => set('notes', e.target.value)} className="h-10" /></Field>
          {form.email && (
            <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2.5">
              <p className="text-xs text-brand-primary/80">
                Quando este funcionário acessar o portal com <strong>{form.email}</strong>, o cadastro será vinculado automaticamente.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="accent" size="sm" disabled={!form.name.trim() || !form.email.trim() || create.isPending}>
              {create.isPending ? 'Salvando...' : 'Adicionar funcionário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="ml-1 text-brand-accent normal-case font-normal">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─── Painel lateral com edição inline ────────────────────────────────────────

interface PanelForm {
  name:     string
  position: string
  phone:    string
  email:    string
  hired_at: string
  notes:    string
}

function empToForm(emp: UnifiedEmployee): PanelForm {
  return {
    name:     emp.displayName,
    position: emp.position ?? '',
    phone:    maskPhone(emp.phone ?? ''),
    email:    emp.email    ?? '',
    hired_at: emp.hiredAt  ?? '',
    notes:    emp.notes    ?? '',
  }
}

function EmployeeDetailPanel({
  emp, onClose, onDelete, onRevoke, onToggle,
}: {
  emp:      UnifiedEmployee
  onClose:  () => void
  onDelete: (hrId: string) => void
  onRevoke: (linkId: string) => void
  onToggle: (linkId: string, value: boolean) => void
}) {
  const [form,    setForm]    = useState<PanelForm>(empToForm(emp))
  const [isDirty, setIsDirty] = useState(false)

  const update = useUpdateEmployee()
  const create = useCreateEmployee()
  const saving = update.isPending || create.isPending

  // Reset form quando muda o funcionário selecionado
  useEffect(() => {
    setForm(empToForm(emp))
    setIsDirty(false)
  }, [emp.key])

  function set(k: keyof PanelForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
    setIsDirty(true)
  }

  async function handleSave() {
    const payload = {
      name:     form.name.trim(),
      position: form.position.trim() || undefined,
      phone:    form.phone.trim()    || undefined,
      email:    form.email.trim()    || undefined,
      hired_at: form.hired_at        || undefined,
      notes:    form.notes.trim()    || undefined,
    }

    if (emp.hasHR && emp.hr) {
      await update.mutateAsync({ id: emp.hr.id, ...payload })
    } else {
      // Cria ficha HR vinculada ao usuário do portal (se existir)
      await create.mutateAsync({
        ...payload,
        linked_user_id: emp.portal?.employee_id,
      })
    }

    setIsDirty(false)
  }

  const canSave = isDirty && form.name.trim().length > 0

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-white shadow-md overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-start gap-3 flex-shrink-0">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-brand-secondary/20 text-brand-secondary text-sm font-bold">
            {getInitials(emp.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-brand-primary leading-snug truncate">{emp.displayName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {emp.hasPortal ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <ShieldCheck className="h-2.5 w-2.5" /> Portal ativo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Sem acesso ao portal
              </span>
            )}
            {!emp.hasHR && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <ShieldOff className="h-2.5 w-2.5" /> Sem ficha HR
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Permissão de orçamentos — barra de status */}
      {emp.hasPortal && emp.portal && (
        <div className="px-5 py-2.5 border-b border-border flex items-center justify-between gap-3 bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-3.5 w-3.5 text-brand-secondary" />
            <span className={cn('text-sm font-medium', emp.canApproveBudgets ? 'text-emerald-700' : 'text-muted-foreground')}>
              {emp.canApproveBudgets ? 'Envia orçamento direto ao cliente' : 'Orçamentos passam pelo admin'}
            </span>
          </div>
          <Switch
            checked={emp.canApproveBudgets}
            onCheckedChange={(v) => onToggle(emp.portal!.id, v)}
          />
        </div>
      )}

      {/* Campos editáveis */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">

        {!emp.hasHR && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Preencha os dados abaixo para criar a ficha HR deste funcionário.
          </p>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Nome <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Cargo
            </label>
            <Input placeholder="Ex: Mecânico" value={form.position} onChange={(e) => set('position', e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Admissão
            </label>
            <Input
              type="date"
              value={form.hired_at}
              onChange={(e) => set('hired_at', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Telefone
            </label>
            <Input
              placeholder="(11) 99999-0000"
              value={form.phone}
              onChange={(e) => set('phone', maskPhone(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> E-mail
            </label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" /> Observações
          </label>
          <Input
            placeholder="Informações adicionais..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="h-9"
          />
        </div>

        {!emp.hasHR && emp.email && (
          <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2">
            <p className="text-xs text-brand-primary/80">
              A ficha será vinculada automaticamente ao acesso de portal de <strong>{emp.email}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex gap-3">
          {emp.hasPortal && emp.portal && (
            <button
              onClick={() => onRevoke(emp.portal!.id)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Revogar acesso
            </button>
          )}
          {emp.hasHR && emp.hr && (
            <button
              onClick={() => onDelete(emp.hr!.id)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover ficha
            </button>
          )}
        </div>
        <Button
          variant="accent"
          size="sm"
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {saving
            ? 'Salvando...'
            : emp.hasHR
              ? 'Salvar alterações'
              : 'Criar ficha HR'}
        </Button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminFuncionariosPage() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [createOpen,  setCreateOpen]  = useState(false)
  const lastEmpRef = useRef<UnifiedEmployee | null>(null)

  const { data: hrEmployees = [],     isLoading: hrLoading,     isError: hrError, refetch } = useEmployeesHR()
  const { data: portalEmployees = [], isLoading: portalLoading                             } = useWorkshopEmployees()
  const deleteEmployee = useDeleteEmployee()
  const removeEmployee = useRemoveEmployee()
  const toggleBudget   = useToggleBudgetApproval()

  const isLoading = hrLoading || portalLoading

  const unified    = buildUnified(hrEmployees, portalEmployees)
  const selected   = selectedKey ? (unified.find((e) => e.key === selectedKey) ?? null) : null
  if (selected) lastEmpRef.current = selected
  const displayEmp = selected ?? lastEmpRef.current
  const panelOpen  = !!selectedKey && !!selected

  if (isLoading) return <LoadingState />
  if (hrError)   return <ErrorState onRetry={refetch} />

  async function handleDelete(hrId: string) {
    if (!confirm('Remover a ficha HR deste funcionário?')) return
    await deleteEmployee.mutateAsync(hrId)
    setSelectedKey(null)
  }

  async function handleRevoke(linkId: string) {
    if (!confirm('Revogar acesso ao portal deste funcionário?')) return
    await removeEmployee.mutateAsync(linkId)
    setSelectedKey(null)
  }

  function handleToggle(linkId: string, value: boolean) {
    toggleBudget.mutate({ linkId, value })
  }

  const pageHeight = 'calc(100dvh - 104px)'

  return (
    <div className="flex flex-col gap-4" style={{ height: pageHeight }}>

      <PageHeader
        title="Funcionários"
        description="Clique em um funcionário para editar os dados"
        actions={
          <Button variant="accent" size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Adicionar funcionário
          </Button>
        }
      />

      <InviteLinkCard />

      <div className="flex gap-5 flex-1 min-h-0">

        {/* Tabela */}
        <Card className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
            {unified.length === 0 ? (
              <EmptyState
                title="Nenhum funcionário no cadastro"
                description='Clique em "Adicionar funcionário" para começar.'
                className="py-12 flex-1"
              />
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-white border-b border-border shadow-[0_1px_0_0_hsl(var(--border))]">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Funcionário</th>
                      {!panelOpen && (
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Cargo</th>
                      )}
                      {!panelOpen && (
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-36">Telefone</th>
                      )}
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Acesso</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Orçamentos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {unified.map((emp) => {
                      const isSelected = emp.key === selectedKey
                      return (
                        <tr
                          key={emp.key}
                          onClick={() => setSelectedKey(isSelected ? null : emp.key)}
                          className={cn(
                            'group cursor-pointer transition-colors duration-150',
                            isSelected ? 'bg-brand-primary/[0.04]' : 'hover:bg-muted/40'
                          )}
                        >
                          <td className={cn(
                            'px-4 py-3 border-l-2 transition-colors duration-200',
                            isSelected ? 'border-l-brand-accent' : 'border-l-transparent'
                          )}>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="bg-brand-secondary/20 text-brand-secondary text-xs font-semibold">
                                  {getInitials(emp.displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{emp.displayName}</p>
                                {emp.email && <p className="text-xs text-muted-foreground truncate">{emp.email}</p>}
                              </div>
                            </div>
                          </td>

                          {!panelOpen && (
                            <td className="px-4 py-3 text-sm text-muted-foreground">{emp.position ?? '—'}</td>
                          )}
                          {!panelOpen && (
                            <td className="px-4 py-3 text-sm text-muted-foreground">{displayPhone(emp.phone)}</td>
                          )}

                          <td className="px-4 py-3">
                            {emp.hasPortal ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                <ShieldCheck className="h-2.5 w-2.5" /> Portal
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Sem acesso
                              </span>
                            )}
                            {!emp.hasHR && (
                              <span className="ml-1 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                Sem ficha
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {emp.hasPortal && emp.portal ? (
                              <Switch
                                checked={emp.canApproveBudgets}
                                onCheckedChange={(v) => handleToggle(emp.portal!.id, v)}
                                title={emp.canApproveBudgets ? 'Envia direto ao cliente' : 'Cria rascunho para revisão'}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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

        {/* Painel lateral */}
        <div className={cn(
          'flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out',
          panelOpen ? 'w-[360px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
        )}>
          <div className={cn(
            'w-[360px] h-full transition-transform duration-300 ease-out',
            panelOpen ? 'translate-x-0' : 'translate-x-6'
          )}>
            {displayEmp && (
              <EmployeeDetailPanel
                key={displayEmp.key}
                emp={displayEmp}
                onClose={() => setSelectedKey(null)}
                onDelete={handleDelete}
                onRevoke={handleRevoke}
                onToggle={handleToggle}
              />
            )}
          </div>
        </div>
      </div>

      <CreateEmployeeModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
