import { z } from 'zod'

export const SERVICE_CATEGORIES = [
  'Elétrica',
  'Mecânica',
  'Funilaria',
  'Revisão',
  'Pneus',
  'Freios',
  'Suspensão',
  'Ar-condicionado',
  'Outro',
] as const

export const serviceRequestSchema = z.object({
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  category: z.string().min(1, 'Selecione uma categoria'),
  problem_description: z
    .string()
    .min(10, 'Descreva o problema com pelo menos 10 caracteres')
    .max(1000, 'Descrição muito longa'),
})

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>
