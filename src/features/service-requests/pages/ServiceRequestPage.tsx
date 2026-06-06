import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCreateServiceRequest } from '../hooks/useServiceRequest'
import {
  serviceRequestSchema,
  type ServiceRequestFormData,
  SERVICE_CATEGORIES,
} from '../schemas/serviceRequestSchema'
import { ImageUpload } from '../components/ImageUpload'
import { useVehicles } from '@/features/vehicles/hooks/useVehicles'
import { PageHeader } from '@/components/shared/PageHeader'
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

export function ServiceRequestPage() {
  const navigate = useNavigate()
  const [images, setImages] = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceRequestFormData>({ resolver: zodResolver(serviceRequestSchema) })

  const mutation = useCreateServiceRequest()

  function handleSuccess() {
    setSubmitted(true)
  }

  async function onSubmit(data: ServiceRequestFormData) {
    await mutation.mutateAsync({ ...data, images })
    handleSuccess()
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
          <Button variant="outline" onClick={() => navigate('/orcamentos')}>
            Ver orçamentos
          </Button>
          <Button variant="accent" onClick={() => { setSubmitted(false); setImages([]) }}>
            Nova solicitação
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/servicos')}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para serviços
        </button>
        <PageHeader
          title="Solicitar orçamento livre"
          description="A oficina retornará com um orçamento formal."
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Vehicle */}
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

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select onValueChange={(v) => setValue('category', v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Descrição do problema</Label>
          <Textarea
            placeholder="Descreva o problema com detalhes: quando começou, sintomas, barulhos, etc."
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

        {/* Images */}
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
