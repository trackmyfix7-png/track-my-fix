import { supabase } from '@/lib/supabase'
import type { Service } from '@/types/database'

async function getClientWorkshopIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('client_workshops')
    .select('workshop_id')
    .eq('client_id', userId)

  return (data ?? []).map((r) => r.workshop_id)
}

export async function fetchServices(query?: string): Promise<Service[]> {
  const { data: { session } } = await supabase.auth.getSession()

  let q = supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (session?.user?.id) {
    const workshopIds = await getClientWorkshopIds(session.user.id)
    if (workshopIds.length > 0) {
      q = q.in('workshop_id', workshopIds)
    }
  }

  if (query?.trim()) {
    q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return data
}
