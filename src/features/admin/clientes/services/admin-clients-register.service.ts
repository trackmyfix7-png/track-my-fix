import { supabase } from '@/lib/supabase'

export interface PreRegisteredClient {
  id: string
  workshop_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  linked_user_id: string | null
  created_at: string
}

export type CreateClientPayload = {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export async function fetchPreRegisteredClients(workshopId: string): Promise<PreRegisteredClient[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('workshop_id', workshopId)
    .is('linked_user_id', null)   // somente os ainda não vinculados
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createClient(workshopId: string, payload: CreateClientPayload): Promise<PreRegisteredClient> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      workshop_id: workshopId,
      name:        payload.name,
      phone:       payload.phone  || null,
      email:       payload.email  || null,
      address:     payload.address || null,
      notes:       payload.notes  || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClient(id: string, payload: Partial<CreateClientPayload>): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({
      name:    payload.name,
      phone:   payload.phone   ?? null,
      email:   payload.email   ?? null,
      address: payload.address ?? null,
      notes:   payload.notes   ?? null,
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}
