import { useState } from 'react'
import {
  Trash2, Users, Link, Copy, CheckCheck,
  UserPlus, Pencil, GraduationCap, Plus, X,
  Phone, Mail, Briefcase, Calendar, FileText, HardHat,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { getInitials } from '@/lib/utils'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { useWorkshopEmployees, useRemoveEmployee } from '../hooks/useAdminEmployees'
import {
  useEmployeesHR,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useEmployeeTrainings,
  useCreateTraining,
  useDeleteTraining,
} from '../hooks/useEmployeesHR'
import type { EmployeeHR, EmployeeTraining } from '../services/admin-employees-hr.service'

// ─── Formulário de funcionário (modal) ───────────────────────────────────────

type EmployeeFormValues = {
  name: string; position: string; phone: string
  email: string; hired_at: string; notes: string
}

const EMPTY_FORM: EmployeeFormValues = {
  name: '', position: '', phone: '', email: '', hired_at: '', notes: '',
}

function EmployeeFormModal({
  open, onClose, initial,
}: {
  open: boolean
  onClose: () => void
  initial?: EmployeeHR
}) {
  const [form, setForm] = useState<EmployeeFormValues>(
    initial
      ? {
          name:     initial.name,
          position: initial.position ?? '',
          phone:    initial.phone ?? '',
          email:    initial.email ?? '',
          hired_at: initial.hired_at ?? '',
          notes:    initial.notes ?? '',
        }
      : EMPTY_FORM,
  )

  const create = useCreateEmployee()
  const update = useUpdateEmployee()
  const isPending = create.isPending || update.isPending

  function set(field: keyof EmployeeFormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    const payload = {
      name:     form.name.trim(),
      position: form.position.trim() || undefined,
      phone:    form.phone.trim() || undefined,
      email:    form.email.trim() || undefined,
      hired_at: form.hired_at || undefined,
      notes:    form.notes.trim() || undefined,
    }

    if (initial) {
      await update.mutateAsync({ id: initial.id, ...payload })
    } else {
      await create.mutateAsync(payload)
    }

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-secondary/10">
            <HardHat className="h-5 w-5 text-brand-secondary" />
          </div>
          <div>
            <DialogTitle className="text-base">
              {initial ? 'Editar funcionário' : 'Novo funcionário'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initial ? 'Atualize os dados do cadastro' : 'Adicione um membro à equipe'}
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nome */}
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

          {/* Cargo + Telefone */}
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
              <Input placeholder="(11) 99999-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="h-10" />
            </div>
          </div>

          {/* E-mail + Admissão */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Mail className="h-3 w-3" /> E-mail
              </label>
              <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => set('email', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-3 w-3" /> Admissão
              </label>
              <Input type="date" value={form.hired_at} onChange={(e) => set('hired_at', e.target.value)} className="h-10" />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3 w-3" /> Observações
            </label>
            <Input placeholder="Informações adicionais..." value={form.notes} onChange={(e) => set('notes', e.target.value)} className="h-10" />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="accent" size="sm" disabled={!form.name.trim() || isPending}>
              {isPending ? 'Salvando...' : initial ? 'Salvar alterações' : 'Adicionar funcionário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modal de treinamentos ────────────────────────────────────────────────────

function TrainingsModal({ employee, onClose }: { employee: EmployeeHR; onClose: () => void }) {
  const { data: trainings = [], isLoading } = useEmployeeTrainings(employee.id)
  const add    = useCreateTraining(employee.id)
  const remove = useDeleteTraining(employee.id)

  const [form, setForm] = useState({ title: '', provider: '', completed_at: '', valid_until: '', notes: '' })

  function setF(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await add.mutateAsync({
      title:        form.title.trim(),
      provider:     form.provider.trim() || undefined,
      completed_at: form.completed_at || undefined,
      valid_until:  form.valid_until || undefined,
      notes:        form.notes.trim() || undefined,
    })
    setForm({ title: '', provider: '', completed_at: '', valid_until: '', notes: '' })
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand-secondary" />
            Treinamentos — {employee.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Lista */}
          {isLoading ? (
            <LoadingState className="py-6" />
          ) : trainings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum treinamento registrado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {trainings.map((t) => (
                <TrainingItem
                  key={t.id}
                  training={t}
                  onDelete={() => remove.mutateAsync(t.id)}
                  deleting={remove.isPending}
                />
              ))}
            </ul>
          )}

          {/* Formulário de adição */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Adicionar treinamento
            </p>
            <form onSubmit={handleAdd} className="space-y-2.5">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input
                  placeholder="Ex: NR-12, Alinhamento e balanceamento..."
                  value={form.title}
                  onChange={(e) => setF('title', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label>Instituição / Provedor</Label>
                  <Input
                    placeholder="Ex: SENAI, Fabricante"
                    value={form.provider}
                    onChange={(e) => setF('provider', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de conclusão</Label>
                  <Input
                    type="date"
                    value={form.completed_at}
                    onChange={(e) => setF('completed_at', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label>Válido até</Label>
                  <Input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setF('valid_until', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Input
                    placeholder="Notas..."
                    value={form.notes}
                    onChange={(e) => setF('notes', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="accent"
                  className="gap-1.5"
                  disabled={!form.title.trim() || add.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {add.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TrainingItem({
  training, onDelete, deleting,
}: {
  training: EmployeeTraining
  onDelete: () => void
  deleting: boolean
}) {
  const isExpired = training.valid_until && new Date(training.valid_until) < new Date()

  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{training.title}</p>
          {isExpired && (
            <span className="text-[10px] font-medium bg-red-100 text-red-600 rounded-full px-2 py-0.5">
              Expirado
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {training.provider && <span>{training.provider}</span>}
          {training.completed_at && (
            <span>Concluído: {format(parseISO(training.completed_at), 'dd/MM/yyyy')}</span>
          )}
          {training.valid_until && (
            <span className={isExpired ? 'text-red-500' : ''}>
              Válido até: {format(parseISO(training.valid_until), 'dd/MM/yyyy')}
            </span>
          )}
        </div>
        {training.notes && (
          <p className="mt-0.5 text-xs text-muted-foreground">{training.notes}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="mt-0.5 text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-40"
        aria-label="Remover treinamento"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

// ─── Linha HR de funcionário ──────────────────────────────────────────────────

function EmployeeHRRow({
  employee,
  onEdit,
  onDelete,
  onTrainings,
  deleting,
}: {
  employee:    EmployeeHR
  onEdit:      (e: EmployeeHR) => void
  onDelete:    (id: string) => void
  onTrainings: (e: EmployeeHR) => void
  deleting:    boolean
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
            <p className="text-sm font-medium text-foreground">{employee.name}</p>
            {employee.email && (
              <p className="text-xs text-muted-foreground">{employee.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {employee.position ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {employee.phone ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {employee.hired_at
          ? format(parseISO(employee.hired_at), 'dd/MM/yyyy')
          : '—'}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onTrainings(employee)}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand-secondary/10 text-brand-secondary hover:bg-brand-secondary/20 transition-colors"
        >
          <GraduationCap className="h-3 w-3" />
          {employee.trainings_count ?? 0}
        </button>
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

// ─── Card de link de convite ──────────────────────────────────────────────────

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link className="h-4 w-4 text-brand-secondary" />
          Link de acesso ao portal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Compartilhe com o funcionário para que ele acesse o portal e veja as ordens de serviço.
        </p>

        {inviteUrl ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <span className="flex-1 truncate text-xs text-muted-foreground font-mono">
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
          <div className="h-9 animate-pulse rounded-md bg-muted" />
        )}
        <p className="text-xs text-muted-foreground">
          O link é permanente. Ao clicar, o funcionário faz login com o Google e já fica vinculado à oficina.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Lista de funcionários com acesso ao portal ───────────────────────────────

function PortalAccessList() {
  const { data: employees = [], isLoading } = useWorkshopEmployees()
  const removeEmployee = useRemoveEmployee()

  async function handleRemove(linkId: string) {
    if (!confirm('Revogar acesso ao portal deste funcionário?')) return
    await removeEmployee.mutateAsync(linkId)
  }

  if (isLoading) return <LoadingState className="py-4" />

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Com acesso ao portal</CardTitle>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {employees.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {employees.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Nenhum acesso concedido ainda.
          </p>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 group">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-brand-secondary/20 text-brand-secondary text-[10px] font-semibold">
                  {getInitials(emp.employee?.full_name ?? '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{emp.employee?.full_name ?? '(sem nome)'}</p>
                <p className="text-[10px] text-muted-foreground">
                  Desde {format(parseISO(emp.linked_at), "d 'de' MMM", { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => handleRemove(emp.id)}
                disabled={removeEmployee.isPending}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                aria-label="Revogar acesso"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'equipe' | 'portal'

export function AdminFuncionariosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('equipe')
  const [formOpen,        setFormOpen]        = useState(false)
  const [editTarget,      setEditTarget]      = useState<EmployeeHR | null>(null)
  const [trainingsTarget, setTrainingsTarget] = useState<EmployeeHR | null>(null)

  const { data: employees = [], isLoading, isError, refetch } = useEmployeesHR()
  const deleteEmployee = useDeleteEmployee()

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState onRetry={refetch} />

  async function handleDelete(id: string) {
    if (!confirm('Remover este funcionário do cadastro? Os treinamentos também serão excluídos.')) return
    await deleteEmployee.mutateAsync(id)
  }

  function openEdit(emp: EmployeeHR) {
    setEditTarget(emp)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        description="Cadastro de equipe e treinamentos"
        actions={
          activeTab === 'equipe' ? (
            <Button
              variant="accent"
              size="sm"
              className="gap-2"
              onClick={() => { setEditTarget(null); setFormOpen(true) }}
            >
              <UserPlus className="h-4 w-4" />
              Adicionar funcionário
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: 'equipe', label: 'Equipe e treinamentos' },
          { key: 'portal', label: 'Acesso ao portal' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Aba: Equipe e treinamentos */}
      {activeTab === 'equipe' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {employees.length === 0 ? (
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
                        {['Funcionário', 'Cargo', 'Telefone', 'Admissão', 'Treinamentos', ''].map((h) => (
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
                      {employees.map((emp) => (
                        <EmployeeHRRow
                          key={emp.id}
                          employee={emp}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          onTrainings={setTrainingsTarget}
                          deleting={deleteEmployee.isPending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aba: Acesso ao portal */}
      {activeTab === 'portal' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InviteLinkCard />
          <PortalAccessList />
        </div>
      )}

      {/* Modais */}
      {formOpen && (
        <EmployeeFormModal
          open={formOpen}
          onClose={closeForm}
          initial={editTarget ?? undefined}
        />
      )}

      {trainingsTarget && (
        <TrainingsModal
          employee={trainingsTarget}
          onClose={() => setTrainingsTarget(null)}
        />
      )}
    </div>
  )
}
