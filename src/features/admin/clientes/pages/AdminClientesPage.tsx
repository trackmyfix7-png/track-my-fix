import { useState, useMemo } from 'react'
import {
  Search, Car, Copy, CheckCheck, Link, UserPlus,
  Pencil, Trash2, Mail, Phone, MapPin, FileText, ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getInitials, maskPhone } from '@/lib/utils'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { useWorkshopClientsWithStats, useRevokeClientAccess } from '../hooks/useAdminClients'
import {
  usePreRegisteredClients,
  useLinkedClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '../hooks/useAdminClientsRegister'
import type { WorkshopClientRow } from '../services/admin-clients.service'
import type { PreRegisteredClient } from '../services/admin-clients-register.service'

// ─── Link de convite (compacto) ──────────────────────────────────────────────

function InviteLinkBar() {
  const { data: workshop } = useWorkshop()
  const [copied, setCopied] = useState(false)

  const inviteUrl = workshop?.slug
    ? `${window.location.origin}/acesso/${workshop.slug}`
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

// ─── Modal de cadastro / edição ───────────────────────────────────────────────

type ClientFormValues = { name: string; phone: string; email: string; address: string; notes: string }
const EMPTY: ClientFormValues = { name: '', phone: '', email: '', address: '', notes: '' }

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; record: PreRegisteredClient }
  | { kind: 'fromPortal'; prefill: { name: string; phone: string; email: string }; linkedUserId: string }

function ClientFormModal({
  state, onClose,
}: {
  state:   Exclude<ModalState, { kind: 'closed' }>
  onClose: () => void
}) {
  const initial    = state.kind === 'edit' ? state.record : null
  const prefill    = state.kind === 'fromPortal' ? state.prefill : null
  const linkedUser = state.kind === 'fromPortal' ? state.linkedUserId : null

  const [form, setForm] = useState<ClientFormValues>(() => {
    if (initial) return {
      name:    initial.name,
      phone:   maskPhone(initial.phone ?? ''),
      email:   initial.email   ?? '',
      address: initial.address ?? '',
      notes:   initial.notes   ?? '',
    }
    if (prefill) return {
      name:    prefill.name,
      phone:   maskPhone(prefill.phone ?? ''),
      email:   prefill.email,
      address: '',
      notes:   '',
    }
    return EMPTY
  })

  const create    = useCreateClient()
  const update    = useUpdateClient()
  const isPending = create.isPending || update.isPending

  function set(field: keyof ClientFormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    const payload = {
      name:    form.name.trim(),
      phone:   form.phone.trim()   || undefined,
      email:   form.email.trim(),
      address: form.address.trim() || undefined,
      notes:   form.notes.trim()   || undefined,
    }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...payload })
    } else {
      await create.mutateAsync({ ...payload, linked_user_id: linkedUser ?? undefined })
    }
    onClose()
  }

  const title = initial
    ? 'Editar cliente'
    : linkedUser
    ? 'Registrar cliente'
    : 'Adicionar cliente'

  const subtitle = initial
    ? 'Atualize os dados do cadastro'
    : linkedUser
    ? 'Crie um cadastro para este cliente do portal'
    : 'Pré-cadastre um cliente na oficina'

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
            <UserPlus className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <DialogTitle className="text-base">{title}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nome completo <span className="text-brand-accent normal-case font-normal">*</span>
            </label>
            <Input
              placeholder="Ex: João Silva"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Phone className="h-3 w-3" /> Telefone
              </label>
              <Input
                placeholder="(11) 99999-0000"
                value={form.phone}
                onChange={(e) => set('phone', maskPhone(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Mail className="h-3 w-3" /> E-mail <span className="text-brand-accent normal-case font-normal">*</span>
              </label>
              {linkedUser ? (
                <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground select-all">
                  {form.email || '—'}
                </div>
              ) : (
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                  className="h-10"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3 w-3" /> Endereço
            </label>
            <Input
              placeholder="Rua, número, bairro, cidade..."
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3 w-3" /> Observações
            </label>
            <Input
              placeholder="Notas internas..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="h-10"
            />
          </div>

          {!initial && !linkedUser && form.email && (
            <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-3 py-2.5">
              <p className="text-xs text-brand-primary/80">
                Quando este cliente acessar o portal com <strong>{form.email}</strong>, o cadastro será vinculado automaticamente.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={!form.name.trim() || !form.email.trim() || isPending}
            >
              {isPending
                ? 'Salvando...'
                : initial
                ? 'Salvar alterações'
                : linkedUser
                ? 'Registrar'
                : 'Adicionar cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Linha: cliente com acesso ao portal ─────────────────────────────────────

function ActiveClientRow({
  client, linkedRecord, onEdit, onRevoke, revoking,
}: {
  client:        WorkshopClientRow
  linkedRecord?: PreRegisteredClient
  onEdit:        () => void
  onRevoke:      () => void
  revoking:      boolean
}) {
  const subtitle = linkedRecord?.email ?? client.email ?? (client.phone ? maskPhone(client.phone) : null)

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-semibold">
              {getInitials(client.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{client.full_name}</p>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">
                <ShieldCheck className="h-2.5 w-2.5" />
                Portal
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-center">
        <div className="flex items-center justify-center gap-1">
          <Car className="h-3.5 w-3.5" />
          <span>{client.vehicles}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-center">
        {client.visits}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={linkedRecord ? 'Editar cadastro' : 'Registrar cliente'}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRevoke}
            disabled={revoking}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            aria-label="Revogar acesso"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Linha: cliente pré-cadastrado (aguardando acesso) ───────────────────────

function PreRegisteredRow({
  client, onEdit, onDelete, deleting,
}: {
  client:   PreRegisteredClient
  onEdit:   (c: PreRegisteredClient) => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{client.name}</p>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                Aguardando
              </span>
            </div>
            {client.email && (
              <p className="text-xs text-muted-foreground">{client.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-center">—</td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-center">—</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(client)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(client.id)}
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminClientesPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<ModalState>({ kind: 'closed' })

  const { data: clients = [],       isLoading: loadingAuth, isError, refetch } = useWorkshopClientsWithStats()
  const { data: preClients = [],    isLoading: loadingPre  } = usePreRegisteredClients()
  const { data: linkedClients = [] }                         = useLinkedClients()

  const deleteClient = useDeleteClient()
  const revoke       = useRevokeClientAccess()

  // Map linked_user_id → clients record (portal clients que já têm cadastro)
  const linkedMap = useMemo(
    () => new Map(linkedClients.map((c) => [c.linked_user_id!, c])),
    [linkedClients],
  )

  if (loadingAuth || loadingPre) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />

  const filteredActive = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()),
  )
  const filteredPre = preClients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )
  const isEmpty = filteredActive.length === 0 && filteredPre.length === 0

  async function handleDelete(id: string) {
    if (!confirm('Remover este cliente do cadastro?')) return
    await deleteClient.mutateAsync(id)
  }

  async function handleRevoke(clientId: string) {
    if (!confirm('Revogar o acesso ao portal deste cliente?')) return
    await revoke.mutateAsync(clientId)
  }

  function handleActiveEdit(client: WorkshopClientRow) {
    const existing = linkedMap.get(client.id)
    if (existing) {
      setModal({ kind: 'edit', record: existing })
    } else {
      setModal({
        kind: 'fromPortal',
        prefill: {
          name:  client.full_name,
          phone: client.phone ?? '',
          email: client.email ?? '',
        },
        linkedUserId: client.id,
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro e acesso ao portal"
        actions={
          <Button
            variant="accent"
            size="sm"
            className="gap-2"
            onClick={() => setModal({ kind: 'create' })}
          >
            <UserPlus className="h-4 w-4" />
            Adicionar cliente
          </Button>
        }
      />

      <InviteLinkBar />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {(clients.length > 0 || preClients.length > 0) && (
              <span className="text-xs text-muted-foreground shrink-0">
                {clients.length + preClients.length} cliente{clients.length + preClients.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isEmpty ? (
            <EmptyState
              title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente no cadastro'}
              description={!search ? 'Clique em "Adicionar cliente" para começar.' : undefined}
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Veículos</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visitas</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredActive.map((c) => (
                    <ActiveClientRow
                      key={c.id}
                      client={c}
                      linkedRecord={linkedMap.get(c.id)}
                      onEdit={() => handleActiveEdit(c)}
                      onRevoke={() => handleRevoke(c.id)}
                      revoking={revoke.isPending}
                    />
                  ))}
                  {filteredPre.map((c) => (
                    <PreRegisteredRow
                      key={c.id}
                      client={c}
                      onEdit={(rec) => setModal({ kind: 'edit', record: rec })}
                      onDelete={handleDelete}
                      deleting={deleteClient.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {modal.kind !== 'closed' && (
        <ClientFormModal
          state={modal}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
    </div>
  )
}
