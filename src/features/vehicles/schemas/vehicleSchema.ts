import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const vehicleSchema = z.object({
  brand: z.string().min(1, 'Marca obrigatória'),
  model: z.string().min(1, 'Modelo obrigatório'),
  year: z.coerce
    .number({ invalid_type_error: 'Ano inválido' })
    .int()
    .min(1950, 'Ano inválido')
    .max(currentYear + 1, `Máximo ${currentYear + 1}`),
  plate: z
    .string()
    .min(7, 'Placa deve ter pelo menos 7 caracteres')
    .max(8)
    .transform((v) => v.toUpperCase().replace(/\s/g, '')),
  color: z.string().optional(),
  mileage: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(0, 'Quilometragem inválida').optional()
  ),
  notes: z.string().optional(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
