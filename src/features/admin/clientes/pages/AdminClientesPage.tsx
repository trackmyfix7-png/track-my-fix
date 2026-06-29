import { useState } from 'react'
import { Search, Car, Copy, CheckCheck, Link, UserPlus, Pencil, Trash2, Mail, Phone } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getInitials } from '@/lib/utils'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { useWorkshopClientsWithStats } from '../hooks/useAdminClients'
import {
  usePreRegisteredClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '../hooks/useAdminClientsRegister'
import type { WorkshopClientRow } from '../services/admin-clients.service'
import type { PreRegisteredClient } from '../services/admin-clients-register.service'

// ─── Card de link de convite ──────────────────────────────────────────────────

function ClientInviteLinkCard() {
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link className="h-4 w-4 text-brand-secondary" />
          Link de convite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Compartilhe com o cliente para que ele acesse o portal pelo celular.
        </p>
        {inviteUrl ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <span className="flex-1 truncate text-xs text-muted-foreground font-mono">{inviteUrl}</span>
            <Button
              size="sm"
              variant={copied ? 'default' : 'outline'}
              className="shrink-0 h-7 gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied
                ? <><CheckCheck className="h-3.5 w-3.5" /> Copiado</>
                : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
            </Button>
          </div>
        ) : (
          <div className="h-9 animate-pulse rounded-md bg-muted" />
        )}
        <p className="text-xs text-muted-foreground">
          Se o cliente já estiver pré-cadastrado aqui, o sistema vincula os dados automaticamente ao fazer login.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Modal de cadastro de cliente ─────────────────────────────────────────────

type ClientFormValues = { name: string; phone: string; email: string; address: string; notes: string }
const EMPTY: ClientFormValues = { name: '', phone: '', email: '', address: '', notes: '' }

function ClientFormModal({
  open, onClose, initial,
}: {
  open: boolean
  onClose: () => void
  initial?: PreRegisteredClient
}) {
  const [form, setForm] = useState<ClientFormValues>(
    initial
      ? { name: initial.name, phone: initial.phone ?? '', email: initial.email ?? '',
          address: initial.address ?? '', notes: initial.notes ?? '' }
      : EMPTY,
  )

  const create = useCreateClient()
  const update = useUpdateClient()
  const isPending = create.isPending || update.isPending

  function set(field: keyof ClientFormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name:    form.name.trim(),
      phone:   form.phone.trim()   || undefined,
      email:   form.email.trim()   || undefined,
      address: form.address.trim() || undefined,
      notes:   form.notes.trim()   || undefined,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar cliente' : 'Adicionar cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              placeholder="Nome completo"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input placeholder="Rua, número, bairro..." value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Input placeholder="Notas internas..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {form.email && (
            <p className="text-xs text-muted-foreground bg-muted/60 rounded-md px-3 py-2">
              Se este cliente usar o link de convite com o e-mail <strong>{form.email}</strong>, os dados serão vinculados automaticamente à conta dele.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="accent" disabled={!form.name.trim() || isPending}>
              {isPending ? 'Salvando...' : initial ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Linha de cliente com conta (auth) ───────────────────────────────────────

function ClientRow({ client }: { client: WorkshopClientRow }) {
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
            <p className="text-sm font-medium text-foreground">{client.full_name}</p>
            {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{client.vehicles}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-medium">{client.visits}</span>
      </td>
    </tr>
  )
}

// ─── Linha de cliente pré-cadastrado (sem conta ainda) ───────────────────────

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
            <p className="text-sm font-medium text-foreground">{client.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {client.phone && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-2.5 w-2.5" />{client.phone}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-2.5 w-2.5" />{client.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          Aguardando acesso
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(client)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(client.id)}
            disabled={deleting}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
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
  const [formOpen,   setFormOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<PreRegisteredClient | null>(null)

  const { data: clients = [],       isLoading: loadingAuth, isError, refetch } = useWorkshopClientsWithStats()
  const { data: preClients = [],    isLoading: loadingPre  } = usePreRegisteredClients()
  const deleteClient = useDeleteClient()

  if (loadingAuth || loadingPre) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Remover este cliente do cadastro?')) return
    await deleteClient.mutateAsync(id)
  }

  function openEdit(c: PreRegisteredClient) {
    setEditTarget(c)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de clientes"
        description={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} com acesso ao portal`}
        actions={
          <Button
            variant="accent"
            size="sm"
            className="gap-2"
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
          >
            <UserPlus className="h-4 w-4" />
            Adicionar cliente
          </Button>
        }
      />

      {/* Pills de resumo */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5">
          <span className="text-xs text-muted-foreground">Com acesso</span>
          <span className="text-sm font-bold text-brand-primary">{clients.length}</span>
        </div>
        {preClients.length > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5">
            <span className="text-xs text-amber-700">Pré-cadastrados</span>
            <span className="text-sm font-bold text-amber-700">{preClients.length}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Tabelas */}
        <div className="lg:col-span-2 space-y-4">

          {/* Clientes com conta */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex-1">Clientes com acesso ao portal</CardTitle>
                <div className="relative w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-8 h-8 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <EmptyState
                  title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente com acesso ainda'}
                  description={!search ? 'Compartilhe o link de convite ou adicione um cliente manualmente.' : undefined}
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Veículos</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => <ClientRow key={c.id} client={c} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pré-cadastrados aguardando acesso */}
          {preClients.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Pré-cadastrados — aguardando acesso ao portal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {preClients.map((c) => (
                        <PreRegisteredRow
                          key={c.id}
                          client={c}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          deleting={deleteClient.isPending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Link de convite */}
        <div className="lg:col-span-1">
          <ClientInviteLinkCard />
        </div>
      </div>

      {formOpen && (
        <ClientFormModal
          open={formOpen}
          onClose={closeForm}
          initial={editTarget ?? undefined}
        />
      )}
    </div>
  )
}
