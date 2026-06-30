import { useState } from 'react'
import {
  Trash2, Link, Copy, CheckCheck,
  UserPlus, Pencil,
  Phone, Mail, Briefcase, Calendar, FileText, HardHat, ShieldCheck, ShieldOff,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { getInitials, maskPhone } from '@/lib/utils'

function displayPhone(phone: string | null | undefined): string {
  return phone ? maskPhone(phone) : '—'
}
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { useWorkshopEmployees, useRemoveEmployee } from '../hooks/useAdminEmployees'
import {
  useEmployeesHR,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '../hooks/useEmployeesHR'
import type { EmployeeHR } from '../services/admin-employees-hr.service'
import type { EmployeeRow } from '../services/admin-employees.service'

// ─── Card de link de convite (compacto) ──────────────────────────────────────

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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <Link className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <p className="text-xs text-muted-foreground flex-1">
        Link de convite para acesso ao portal
      </p>
      {inviteUrl ? (
        <div className="flex items-center gap-2">
          <span className="hidden sm:block truncate max-w-[280px] text-xs text-muted-foreground font-mono">
            {inviteUrl}
          </span>
          <Button
            size="sm"
            variant={copied ? 'default' : 'outline'}
            className="shrink-0 h-7 gap-1.5 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <><CheckCheck className="h-3.5 w-3.5" /> Copiado</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copiar</>
            )}
          </Button>
        </div>
      ) : (
        <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
      )}
    </div>
  )
}

// ─── Formulário de funcionário (modal) ───────────────────────────────────────

type EmployeeFormValues = {
  name: string; position: string; phone: string
  email: string; hired_at: string; notes: string
}

const EMPTY_FORM: EmployeeFormValues = {
  name: '', position: '', phone: '', email: '', hired_at: '', notes: '',
}

function EmployeeFormModal({
  open, onClose, initial, portalUserId, prefill,
}: {
  open:          boolean
  onClose:       () => void
  initial?:      EmployeeHR
  portalUserId?: string            // quando cria HR a partir de um usuário do portal
  prefill?:      { name?: string; phone?: string; email?: string }
}) {
  const initValues = (): EmployeeFormValues => {
    if (initial) {
      return {
        name:     initial.name,
        position: initial.position ?? '',
        phone:    maskPhone(initial.phone ?? ''),
        email:    initial.email    ?? '',
        hired_at: initial.hired_at ?? '',
        notes:    initial.notes    ?? '',
      }
    }
    if (prefill) {
      return {
        ...EMPTY_FORM,
        name:  prefill.name  ?? '',
        phone: maskPhone(prefill.phone ?? ''),
        email: prefill.email ?? '',
      }
    }
    return EMPTY_FORM
  }

  const [form, setForm] = useState<EmployeeFormValues>(initValues)

  const create = useCreateEmployee()
  const update = useUpdateEmployee()
  const isPending = create.isPending || update.isPending

  // Email é obrigatório só quando não há vínculo direto via portalUserId
  const emailRequired = !portalUserId

  function set(field: keyof EmployeeFormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (emailRequired && !form.email.trim()) return

    const payload = {
      name:           form.name.trim(),
      position:       form.position.trim() || undefined,
      phone:          form.phone.trim()    || undefined,
      email:          form.email.trim()    || undefined,
      hired_at:       form.hired_at        || undefined,
      notes:          form.notes.trim()    || undefined,
      linked_user_id: portalUserId,
    }

    if (initial) {
      await update.mutateAsync({ id: initial.id, ...payload })
    } else {
      await create.mutateAsync(payload)
    }

    onClose()
  }

  const canSubmit = form.name.trim() && (emailRequired ? form.email.trim() : true)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-secondary/10">
            <HardHat className="h-5 w-5 text-brand-secondary" />
          </div>
          <div>
            <DialogTitle className="text-base">
              {(initial || portalUserId) ? 'Editar funcionário' : 'Adicionar funcionário'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(initial || portalUserId) ? 'Atualize os dados do cadastro' : 'Adicione um membro à equipe'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nome completo <span className="text-brand-accent normal-case font-normal">*</span>
            </label>
            <Input
              placeholder="Ex: Carlos Souza"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Briefcase className="h-3 w-3" /> Cargo
              </label>
              <Input placeholder="Ex: Mecânico" value={form.position} onChange={(e) => set('position', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Phone className="h-3 w-3" /> Telefone
              </label>
              <Input placeholder="(11) 99999-0000" value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} className="h-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Mail className="h-3 w-3" />
                E-mail {emailRequired && <span className="text-brand-accent normal-case font-normal">*</span>}
              </label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required={emailRequired}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-3 w-3" /> Admissão
              </label>
              <Input type="date" value={form.hired_at} onChange={(e) => set('hired_at', e.target.value)} className="h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3 w-3" /> Observações
            </label>
            <Input placeholder="Informações adicionais..." value={form.notes} onChange={(e) => set('notes', e.target.value)} className="h-10" />
          </div>

          {!portalUserId && form.email && (
            <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2.5">
              <p className="text-xs text-brand-primary/80">
                Quando este funcionário acessar o portal com <strong>{form.email}</strong>, o cadastro será vinculado automaticamente.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="accent" size="sm" disabled={!canSubmit || isPending}>
              {isPending ? 'Salvando...' : (initial || portalUserId) ? 'Salvar alterações' : 'Adicionar funcionário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Linha: funcionário com ficha HR ─────────────────────────────────────────

function EmployeeHRRow({
  employee, onEdit, onDelete, deleting,
}: {
  employee: EmployeeHR
  onEdit:   (e: EmployeeHR) => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-brand-secondary/20 text-brand-secondary text-xs font-semibold">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{employee.name}</p>
              {employee.linked_user_id ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Portal
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Sem acesso
                </span>
              )}
            </div>
            {employee.email && (
              <p className="text-xs text-muted-foreground">{employee.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{employee.position ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{displayPhone(employee.phone)}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {employee.hired_at ? format(parseISO(employee.hired_at), 'dd/MM/yyyy') : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(employee)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(employee.id)}
            disabled={deleting}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            aria-label="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Linha: usuário do portal sem ficha HR ────────────────────────────────────

function PortalOnlyRow({
  emp, onCreateHR, onRevoke, revoking,
}: {
  emp:        EmployeeRow
  onCreateHR: (userId: string, name: string, phone: string | null, email: string | null) => void
  onRevoke:   (linkId: string) => void
  revoking:   boolean
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
              {getInitials(emp.employee?.full_name ?? '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{emp.employee?.full_name ?? '(sem nome)'}</p>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                <ShieldOff className="h-2.5 w-2.5" />
                Sem ficha
              </span>
            </div>
            {emp.employee?.email && (
              <p className="text-xs text-muted-foreground">{emp.employee.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{displayPhone(emp.employee?.phone)}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onCreateHR(
              emp.employee_id,
              emp.employee?.full_name ?? '',
              emp.employee?.phone     ?? null,
              emp.employee?.email     ?? null,
            )}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Criar ficha"
            title="Criar ficha HR para este funcionário"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onRevoke(emp.id)}
            disabled={revoking}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            aria-label="Revogar acesso"
            title="Revogar acesso ao portal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; employee: EmployeeHR }
  | { mode: 'createFromPortal'; userId: string; name: string; phone: string | null; email: string | null }

export function AdminFuncionariosPage() {
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const { data: hrEmployees = [],     isLoading: hrLoading,     isError: hrError, refetch } = useEmployeesHR()
  const { data: portalEmployees = [], isLoading: portalLoading                             } = useWorkshopEmployees()
  const deleteEmployee = useDeleteEmployee()
  const removeEmployee = useRemoveEmployee()

  const isLoading = hrLoading || portalLoading

  const linkedUserIds = new Set(hrEmployees.map((e) => e.linked_user_id).filter(Boolean))
  const portalOnly = portalEmployees.filter((e) => !linkedUserIds.has(e.employee_id))

  if (isLoading) return <LoadingState />
  if (hrError)   return <ErrorState onRetry={refetch} />

  async function handleDelete(id: string) {
    if (!confirm('Remover este funcionário do cadastro?')) return
    await deleteEmployee.mutateAsync(id)
  }

  async function handleRevoke(linkId: string) {
    if (!confirm('Revogar acesso ao portal deste funcionário?')) return
    await removeEmployee.mutateAsync(linkId)
  }

  const isEmpty = hrEmployees.length === 0 && portalOnly.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        description="Cadastro de equipe"
        actions={
          <Button
            variant="accent"
            size="sm"
            className="gap-2"
            onClick={() => setModal({ mode: 'create' })}
          >
            <UserPlus className="h-4 w-4" />
            Adicionar funcionário
          </Button>
        }
      />

      <InviteLinkCard />

      <Card>
        <CardContent className="p-0">
          {isEmpty ? (
            <EmptyState
              title="Nenhum funcionário no cadastro"
              description='Clique em "Adicionar funcionário" para começar.'
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Funcionário', 'Cargo', 'Telefone', 'Admissão', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hrEmployees.map((emp) => (
                    <EmployeeHRRow
                      key={emp.id}
                      employee={emp}
                      onEdit={(e) => setModal({ mode: 'edit', employee: e })}
                      onDelete={handleDelete}
                      deleting={deleteEmployee.isPending}
                    />
                  ))}
                  {portalOnly.map((emp) => (
                    <PortalOnlyRow
                      key={emp.id}
                      emp={emp}
                      onCreateHR={(userId, name, phone, email) =>
                        setModal({ mode: 'createFromPortal', userId, name, phone, email })
                      }
                      onRevoke={handleRevoke}
                      revoking={removeEmployee.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {modal.mode === 'create' && (
        <EmployeeFormModal
          open
          onClose={() => setModal({ mode: 'closed' })}
        />
      )}

      {modal.mode === 'edit' && (
        <EmployeeFormModal
          open
          onClose={() => setModal({ mode: 'closed' })}
          initial={modal.employee}
        />
      )}

      {modal.mode === 'createFromPortal' && (
        <EmployeeFormModal
          open
          onClose={() => setModal({ mode: 'closed' })}
          portalUserId={modal.userId}
          prefill={{ name: modal.name, phone: modal.phone ?? '', email: modal.email ?? '' }}
        />
      )}
    </div>
  )
}
