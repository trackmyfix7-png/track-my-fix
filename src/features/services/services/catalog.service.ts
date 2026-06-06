import { supabase } from '@/lib/supabase'
import type { Service } from '@/types/database'

export async function fetchServices(query?: string): Promise<Service[]> {
  let q = supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (query?.trim()) {
    q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return data
}
