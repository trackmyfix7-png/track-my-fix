import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, ArrowLeft, Wrench } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCreateServiceRequest } from '../hooks/useServiceRequest'
import {
  serviceRequestSchema,
  type ServiceRequestFormData,
  SERVICE_CATEGORIES,
} from '../schemas/serviceRequestSchema'
import { z } from 'zod'

// Quando o serviço já é conhecido, observações são opcionais
const serviceSpecificSchema = serviceRequestSchema.extend({
  problem_description: z.string().max(1000).optional().default(''),
})
import { ImageUpload } from '../components/ImageUpload'
import { useVehicles } from '@/features/vehicles/hooks/useVehicles'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LocationState { serviceId?: string; serviceName?: string; category?: string }

export function ServiceRequestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill  = (location.state ?? {}) as LocationState
  const fromService = !!prefill.serviceName

  const [images,    setImages]    = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(fromService ? serviceSpecificSchema : serviceRequestSchema),
    defaultValues: {
      category:            prefill.category ?? '',
      problem_description: '',
    },
  })

  // Quando vem de um serviço, trava a categoria (usa "Outros" se não definida)
  useEffect(() => {
    if (fromService) setValue('category', prefill.category || 'Outros', { shouldValidate: false })
  }, [])

  const mutation = useCreateServiceRequest()

  async function onSubmit(data: ServiceRequestFormData) {
    await mutation.mutateAsync({
      ...data,
      images,
      ...(prefill.serviceId ? { service_id: prefill.serviceId } : {}),
    })
    setSubmitted(true)
  }

  if (loadingVehicles) return <LoadingState />

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-brand-primary">Solicitação enviada!</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          A oficina recebeu sua solicitação e retornará com um orçamento formal em breve.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => navigate('/orcamentos')}>Ver orçamentos</Button>
          <Button variant="accent" onClick={() => { setSubmitted(false); setImages([]) }}>
            Nova solicitação
          </Button>
        </div>
      </div>
    )
  }

  // Garante que a categoria do serviço aparece no select mesmo não estando na lista padrão
  const categoryOptions = prefill.category && !SERVICE_CATEGORIES.includes(prefill.category as never)
    ? [prefill.category, ...SERVICE_CATEGORIES]
    : [...SERVICE_CATEGORIES]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/servicos')}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para serviços
        </button>

        {fromService ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Solicitação de orçamento
            </p>
            <h1 className="text-xl font-bold text-brand-primary">{prefill.serviceName}</h1>
            {prefill.category && (
              <span className="mt-1.5 inline-block rounded-full bg-brand-secondary/10 px-2.5 py-0.5 text-xs font-medium text-brand-secondary">
                {prefill.category}
              </span>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-brand-primary">Solicitar orçamento livre</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Descreva o que precisa e a oficina retornará com um orçamento formal.
            </p>
          </div>
        )}
      </div>

      {/* Contexto do serviço — só aparece quando vem de um serviço específico */}
      {fromService && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
            <Wrench className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-primary">{prefill.serviceName}</p>
            <p className="text-xs text-muted-foreground">
              Confirme o veículo e adicione observações úteis para a oficina
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* Veículo */}
          <div className="space-y-1.5">
            <Label>Veículo</Label>
            <Select onValueChange={(v) => setValue('vehicle_id', v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model} · {v.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicle_id && (
              <p className="text-xs text-destructive">{errors.vehicle_id.message}</p>
            )}
          </div>

          {/* Categoria — read-only quando vem de serviço específico */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            {fromService ? (
              <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 text-sm text-foreground">
                {prefill.category || 'Outros'}
              </div>
            ) : (
              <Select
                onValueChange={(v) => setValue('category', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* Descrição / Observações */}
        <div className="space-y-1.5">
          <Label>{fromService ? 'Observações adicionais' : 'Descrição do problema'}</Label>
          <Textarea
            placeholder={
              fromService
                ? 'Ex: prefiro o serviço na próxima semana, tenho urgência, há um barulho ao frear, etc.'
                : 'Descreva o problema com detalhes: quando começou, sintomas, barulhos, etc.'
            }
            className="min-h-[120px]"
            {...register('problem_description')}
          />
          <div className="flex items-center justify-between">
            {errors.problem_description ? (
              <p className="text-xs text-destructive">{errors.problem_description.message}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">
              {watch('problem_description')?.length ?? 0}/1000
            </span>
          </div>
        </div>

        {/* Fotos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-brand-primary">
              Fotos <span className="font-normal text-muted-foreground">(opcional, máx. 5)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload value={images} onChange={setImages} />
          </CardContent>
        </Card>

        {mutation.isError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive">
            Erro ao enviar solicitação. Tente novamente.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Solicitar orçamento'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
