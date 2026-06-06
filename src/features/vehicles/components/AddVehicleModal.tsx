import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Loader2, Plus, X } from 'lucide-react'
import { vehicleSchema, type VehicleFormData } from '../schemas/vehicleSchema'
import { useCreateVehicle } from '../hooks/useVehicles'
import { useFipeBrands, useFipeModels, useFipeYears } from '@/lib/fipe'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from '@/components/ui/dialog'

interface AddVehicleModalProps {
  open: boolean
  onClose: () => void
}

export function AddVehicleModal({ open, onClose }: AddVehicleModalProps) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [brandCode, setBrandCode] = useState('')
  const [modelCode, setModelCode] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  const createVehicle = useCreateVehicle()
  const brands = useFipeBrands()
  const models = useFipeModels(brandCode)
  const years = useFipeYears(brandCode, modelCode)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({ resolver: zodResolver(vehicleSchema) })

  const brandValue = watch('brand') ?? ''
  const modelValue = watch('model') ?? ''
  const yearValue  = watch('year')  ?? ''

  function handleBrandSelect(code: string, label: string) {
    setBrandCode(code)
    setModelCode('')
    setValue('brand', label, { shouldValidate: true })
    setValue('model', '',    { shouldValidate: false })
    setValue('year',  '' as unknown as number, { shouldValidate: false })
  }

  function handleModelSelect(code: string, label: string) {
    setModelCode(code)
    setValue('model', label, { shouldValidate: true })
    setValue('year',  '' as unknown as number, { shouldValidate: false })
  }

  function handleYearSelect(_code: string, label: string) {
    setValue('year', Number(label), { shouldValidate: true })
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  function handleClose() {
    reset()
    removePhoto()
    setBrandCode('')
    setModelCode('')
    onClose()
  }

  async function onSubmit(data: VehicleFormData) {
    await createVehicle.mutateAsync({ formData: data, photo })
    handleClose()
  }

  // Combobox value helpers — find the brand/model code from current text value
  const selectedBrandCode = brands.data?.find((b) => b.label === brandValue)?.value ?? brandCode
  const selectedModelCode = models.data?.find((m) => m.label === modelValue)?.value ?? modelCode
  const selectedYear = String(yearValue)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar veículo</DialogTitle>
          <DialogDescription>
            Selecione a marca e o modelo para preenchimento automático.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogBody className="space-y-5">

            {/* Foto */}
            <div className="flex justify-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-brand-secondary/40 bg-muted transition-colors hover:border-brand-secondary"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="h-6 w-6 text-muted-foreground group-hover:text-brand-secondary transition-colors" />
                      <span className="text-[10px] text-muted-foreground">Foto</span>
                    </div>
                  )}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {/* Marca */}
            <div className="space-y-1.5">
              <Label>Marca *</Label>
              <Combobox
                options={brands.data ?? []}
                value={selectedBrandCode}
                onChange={handleBrandSelect}
                placeholder="Selecione a marca"
                searchPlaceholder="Buscar marca..."
                isLoading={brands.isLoading}
              />
              {errors.brand && (
                <p className="text-xs text-destructive">{errors.brand.message}</p>
              )}
            </div>

            {/* Modelo */}
            <div className="space-y-1.5">
              <Label>Modelo *</Label>
              <Combobox
                options={models.data ?? []}
                value={selectedModelCode}
                onChange={handleModelSelect}
                placeholder={!brandCode ? 'Selecione a marca primeiro' : 'Selecione o modelo'}
                searchPlaceholder="Buscar modelo..."
                isLoading={models.isLoading}
                disabled={!brandCode}
              />
              {errors.model && (
                <p className="text-xs text-destructive">{errors.model.message}</p>
              )}
            </div>

            {/* Ano + Placa */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ano *</Label>
                {years.data && years.data.length > 0 ? (
                  <Combobox
                    options={years.data}
                    value={selectedYear}
                    onChange={handleYearSelect}
                    placeholder="Selecione o ano"
                    searchPlaceholder="Buscar ano..."
                    disabled={!modelCode}
                  />
                ) : (
                  <Input
                    type="number"
                    placeholder="2021"
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    disabled={!modelCode && !!brandCode}
                    {...register('year')}
                  />
                )}
                {errors.year && (
                  <p className="text-xs text-destructive">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plate">Placa *</Label>
                <Input
                  id="plate"
                  placeholder="ABC-1234"
                  className="uppercase"
                  {...register('plate')}
                />
                {errors.plate && (
                  <p className="text-xs text-destructive">{errors.plate.message}</p>
                )}
              </div>
            </div>

            {/* Cor + Quilometragem */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="color">Cor</Label>
                <Input id="color" placeholder="Prata" {...register('color')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mileage">Quilometragem (km)</Label>
                <Input
                  id="mileage"
                  type="number"
                  placeholder="31000"
                  min={0}
                  {...register('mileage')}
                />
                {errors.mileage && (
                  <p className="text-xs text-destructive">{errors.mileage.message}</p>
                )}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre o veículo..."
                className="min-h-[72px]"
                {...register('notes')}
              />
            </div>

            {createVehicle.isError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive">
                Erro ao cadastrar veículo. Tente novamente.
              </p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Adicionar veículo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
