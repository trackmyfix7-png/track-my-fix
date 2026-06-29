import { supabase } from '@/lib/supabase'

export interface WorkshopClientRow {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  visits: number
  vehicles: number
  total_spent: number
}

export async function fetchWorkshopClientsWithStats(workshopId: string): Promise<WorkshopClientRow[]> {
  const [clientsRes, ordersRes, invoicesRes] = await Promise.all([
    supabase
      .from('client_workshops')
      .select('client:profiles!client_id(id, full_name, avatar_url, phone)')
      .eq('workshop_id', workshopId),

    supabase
      .from('service_orders')
      .select('vehicle:vehicles!vehicle_id(id, owner_id)')
      .eq('workshop_id', workshopId),

    supabase
      .from('invoices')
      .select('amount, vehicle:vehicles!vehicle_id(owner_id)')
      .eq('workshop_id', workshopId)
      .eq('status', 'paid'),
  ])

  if (clientsRes.error) throw clientsRes.error

  // Agregar visitas por cliente (service_orders)
  const visitCount: Record<string, number> = {}
  const vehicleSet: Record<string, Set<string>> = {}
  for (const row of (ordersRes.data ?? []) as any[]) {
    const ownerId = row.vehicle?.owner_id
    const vehicleId = row.vehicle?.id
    if (!ownerId) continue
    visitCount[ownerId] = (visitCount[ownerId] ?? 0) + 1
    if (vehicleId) {
      if (!vehicleSet[ownerId]) vehicleSet[ownerId] = new Set()
      vehicleSet[ownerId].add(vehicleId)
    }
  }

  // Agregar total gasto por cliente (invoices pagas)
  const totalSpent: Record<string, number> = {}
  for (const row of (invoicesRes.data ?? []) as any[]) {
    const ownerId = row.vehicle?.owner_id
    if (ownerId) totalSpent[ownerId] = (totalSpent[ownerId] ?? 0) + (row.amount ?? 0)
  }

  const clients = ((clientsRes.data ?? []) as any[]).map((c) => c.client)

  return clients.map((c) => ({
    id:          c.id,
    full_name:   c.full_name,
    avatar_url:  c.avatar_url,
    phone:       c.phone,
    visits:      visitCount[c.id] ?? 0,
    vehicles:    vehicleSet[c.id]?.size ?? 0,
    total_spent: totalSpent[c.id] ?? 0,
  }))
}
