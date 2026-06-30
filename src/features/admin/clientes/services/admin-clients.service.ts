import { supabase } from '@/lib/supabase'

export interface WorkshopClientRow {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  email: string | null
  visits: number
  vehicles: number
}

export async function fetchWorkshopClientsWithStats(workshopId: string): Promise<WorkshopClientRow[]> {
  const [clientsRes, ordersRes] = await Promise.all([
    supabase
      .from('client_workshops')
      .select('client:profiles!client_id(id, full_name, avatar_url, phone, email)')
      .eq('workshop_id', workshopId),

    supabase
      .from('service_orders')
      .select('vehicle:vehicles!vehicle_id(id, owner_id)')
      .eq('workshop_id', workshopId),
  ])

  if (clientsRes.error) throw clientsRes.error

  const visitCount: Record<string, number> = {}
  const vehicleSet: Record<string, Set<string>> = {}
  for (const row of (ordersRes.data ?? []) as any[]) {
    const ownerId  = row.vehicle?.owner_id
    const vehicleId = row.vehicle?.id
    if (!ownerId) continue
    visitCount[ownerId] = (visitCount[ownerId] ?? 0) + 1
    if (vehicleId) {
      if (!vehicleSet[ownerId]) vehicleSet[ownerId] = new Set()
      vehicleSet[ownerId].add(vehicleId)
    }
  }

  const clients = ((clientsRes.data ?? []) as any[]).map((c) => c.client)

  return clients.map((c) => ({
    id:         c.id,
    full_name:  c.full_name,
    avatar_url: c.avatar_url,
    phone:      c.phone,
    email:      c.email ?? null,
    visits:     visitCount[c.id] ?? 0,
    vehicles:   vehicleSet[c.id]?.size ?? 0,
  }))
}

export async function revokeClientAccess(workshopId: string, clientId: string): Promise<void> {
  const { error } = await supabase
    .from('client_workshops')
    .delete()
    .eq('workshop_id', workshopId)
    .eq('client_id', clientId)
  if (error) throw error
}
