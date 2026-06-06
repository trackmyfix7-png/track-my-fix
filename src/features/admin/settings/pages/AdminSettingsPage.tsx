import { useState } from 'react'
import { Copy, Check, Pencil, MapPin, Phone, Wrench, Bell, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWorkshop, useUpdateWorkshop } from '../hooks/useWorkshop'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Mock: funcionários (feature futura)
// ---------------------------------------------------------------------------
const mockStaff = [
  { id: '1', name: 'Rafael Pereira', role: 'Mecânico', email: 'rafael@email.com' },
  { id: '2', name: 'Lucas Santos', role: 'Mecânico', email: 'lucas@email.com' },
  { id: '3', name: 'Marcos Costa', role: 'Mecânico', email: 'marcos@email.com' },
]

// ---------------------------------------------------------------------------
// Schema de edição
// ---------------------------------------------------------------------------
const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  address: z.string().optional(),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  slug: z
    .string()
    .min(2, 'Slug obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
})
type EditFormData = z.infer<typeof editSchema>

// ---------------------------------------------------------------------------
// Seção: Dados da oficina
// ---------------------------------------------------------------------------
function WorkshopDataCard() {
  const { data: workshop, isLoading } = useWorkshop()
  const { mutateAsync: updateWorkshop, isPending } = useUpdateWorkshop()
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: workshop
      ? { name: workshop.name, slug: workshop.slug, address: workshop.address ?? '', phone: workshop.phone ?? '', cnpj: workshop.cnpj ?? '' }
      : undefined,
  })

  async function onSubmit(data: EditFormData) {
    if (!workshop) return
    await updateWorkshop({ id: workshop.id, ...data })
    setEditing(false)
  }

  function handleCancel() {
    reset()
    setEditing(false)
  }

  if (isLoading) return <LoadingState />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Dados da oficina</CardTitle>
        {!editing && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-brand-secondary h-8" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome da oficina</Label>
              <Input {...register('name')} placeholder="Ex: MecânicaFix" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input {...register('address')} placeholder="Rua, número, bairro, cidade" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register('phone')} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input {...register('cnpj')} placeholder="00.000.000/0001-00" />
              </div>
            </div>
            <div className="space-y-1.5 pt-1 border-t border-border">
              <Label>
                Slug do link de acesso
                <span className="ml-1 font-normal text-muted-foreground text-xs">(somente letras, números e -)</span>
              </Label>
              <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <span className="px-2 text-xs text-muted-foreground bg-muted border-r border-input whitespace-nowrap h-9 flex items-center">
                  /acesso/
                </span>
                <Input {...register('slug')} placeholder="minha-oficina" className="border-0 rounded-none focus-visible:ring-0 shadow-none" />
              </div>
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" variant="accent" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <ul className="space-y-3">
            {[
              { icon: Wrench,   label: 'Nome',      value: workshop?.name },
              { icon: MapPin,   label: 'Endereço',  value: workshop?.address },
              { icon: Phone,    label: 'Telefone',  value: workshop?.phone },
              { icon: Building2,label: 'CNPJ',      value: workshop?.cnpj },
            ].map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Icon className="h-4 w-4 text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={value ? 'text-sm font-medium text-foreground' : 'text-sm text-muted-foreground/50'}>
                    {value || '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Notificações (mock)
// ---------------------------------------------------------------------------
function NotificationsCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Notificações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-secondary/15">
            <Bell className="h-3 w-3 text-brand-secondary" />
          </div>
          <p className="text-sm text-muted-foreground">Notif. push ativado</p>
          <Check className="ml-auto h-4 w-4 text-brand-secondary" />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Funcionários (mock)
// ---------------------------------------------------------------------------
function StaffCard() {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Funcionários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockStaff.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-brand-secondary/20 text-brand-primary text-xs font-semibold">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>
            <span className="flex-shrink-0 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-medium text-brand-primary">
              {member.role}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Link de acesso (US-03)
// ---------------------------------------------------------------------------
function AccessLinkCard() {
  const { data: workshop } = useWorkshop()
  const [copied, setCopied] = useState(false)

  const link = workshop
    ? `${window.location.origin}/acesso/${workshop.slug}`
    : ''

  function handleCopy() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Link de acesso da oficina</CardTitle>
        <p className="text-sm text-muted-foreground">
          Envie este link para seus clientes acessarem o portal
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
          <p className="flex-1 truncate text-sm font-mono text-brand-primary">
            {link || '—'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 gap-1.5 h-8"
            onClick={handleCopy}
            disabled={!link}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs text-green-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-xs">Copiar</span>
              </>
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          O link é permanente — ao clicar, o cliente faz login com Google e é vinculado automaticamente à sua oficina.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna esquerda */}
        <div className="lg:col-span-2 space-y-4">
          <WorkshopDataCard />
          <NotificationsCard />
        </div>

        {/* Coluna direita */}
        <div className="lg:col-span-1">
          <StaffCard />
        </div>
      </div>

      {/* Link de acesso — largura total */}
      <AccessLinkCard />
    </div>
  )
}
