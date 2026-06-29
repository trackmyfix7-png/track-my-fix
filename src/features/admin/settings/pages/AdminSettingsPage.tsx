import { useState } from 'react'
import { Pencil, MapPin, Phone, Wrench, Building2, ParkingSquare } from 'lucide-react'
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

const editSchema = z.object({
  name:     z.string().min(2, 'Nome obrigatório'),
  address:  z.string().optional(),
  phone:    z.string().optional(),
  cnpj:     z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Mínimo 1 vaga').optional(),
  slug: z
    .string()
    .min(2, 'Slug obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
})
type EditFormData = z.infer<typeof editSchema>

function WorkshopDataCard() {
  const { data: workshop, isLoading } = useWorkshop()
  const { mutateAsync: updateWorkshop, isPending } = useUpdateWorkshop()
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: workshop
      ? {
          name:     workshop.name,
          slug:     workshop.slug,
          address:  workshop.address  ?? '',
          phone:    workshop.phone    ?? '',
          cnpj:     workshop.cnpj     ?? '',
          capacity: workshop.capacity ?? undefined,
        }
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
            <div className="space-y-1.5">
              <Label>
                Capacidade de vagas
                <span className="ml-1 font-normal text-muted-foreground text-xs">
                  (veículos simultâneos na oficina)
                </span>
              </Label>
              <Input
                {...register('capacity')}
                type="number"
                min={1}
                placeholder="Ex: 10"
                className="w-32"
              />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>
            <div className="space-y-1.5 pt-1 border-t border-border">
              <Label>
                Slug dos links de convite
                <span className="ml-1 font-normal text-muted-foreground text-xs">(somente letras, números e -)</span>
              </Label>
              <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <span className="px-2 text-xs text-muted-foreground bg-muted border-r border-input whitespace-nowrap h-9 flex items-center">
                  /acesso/
                </span>
                <Input {...register('slug')} placeholder="minha-oficina" className="border-0 rounded-none focus-visible:ring-0 shadow-none" />
              </div>
              <p className="text-xs text-muted-foreground">
                Alterar o slug invalida os links de convite já compartilhados.
              </p>
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
              { icon: Wrench,        label: 'Nome',       value: workshop?.name },
              { icon: MapPin,        label: 'Endereço',   value: workshop?.address },
              { icon: Phone,         label: 'Telefone',   value: workshop?.phone },
              { icon: Building2,     label: 'CNPJ',       value: workshop?.cnpj },
              { icon: ParkingSquare, label: 'Capacidade', value: workshop?.capacity ? `${workshop.capacity} vagas` : null },
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

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Dados e preferências da oficina"
      />
      <div className="max-w-xl">
        <WorkshopDataCard />
      </div>
    </div>
  )
}
