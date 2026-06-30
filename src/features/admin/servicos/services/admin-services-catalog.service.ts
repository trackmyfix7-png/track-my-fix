import { supabase } from '@/lib/supabase'

export interface AdminServiceRow {
  id: string
  name: string
  category: string | null
  description: string | null
  estimated_time: string | null
  base_price: number
  is_active: boolean
}

export interface CreateServiceData {
  name: string
  category: string
  description: string
  estimated_time: string
  base_price: number
}

// NUMERIC(10,2) no banco → overflow acima de 10^8
const MAX_PRICE = 9_999_999.99

function assertPrice(price: number) {
  if (price <= 0 || price > MAX_PRICE) {
    throw new Error(
      `Preço inválido. Informe um valor entre R$ 0,01 e R$ ${MAX_PRICE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
    )
  }
}

export async function fetchWorkshopServices(workshopId: string): Promise<AdminServiceRow[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, category, description, estimated_time, base_price, is_active')
    .eq('workshop_id', workshopId)
    .order('category', { ascending: true })
    .order('name',     { ascending: true })

  if (error) throw error
  return data as AdminServiceRow[]
}

export async function toggleServiceActive(serviceId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive, visible_to_client: isActive })
    .eq('id', serviceId)

  if (error) throw error
}

export async function createService(workshopId: string, data: CreateServiceData): Promise<void> {
  assertPrice(data.base_price)
  const { error } = await supabase.from('services').insert({
    workshop_id:    workshopId,
    name:           data.name,
    category:       data.category       || null,
    description:    data.description    || null,
    estimated_time: data.estimated_time || null,
    base_price:     data.base_price,
    is_active:      true,
  })
  if (error) throw error
}

export async function updateService(serviceId: string, data: Partial<CreateServiceData>): Promise<void> {
  if (data.base_price !== undefined) assertPrice(data.base_price)
  const { error } = await supabase
    .from('services')
    .update({
      name:           data.name,
      category:       data.category       || null,
      description:    data.description    || null,
      estimated_time: data.estimated_time || null,
      base_price:     data.base_price,
    })
    .eq('id', serviceId)
  if (error) throw error
}

export async function deleteService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId)
  if (error) throw error
}
