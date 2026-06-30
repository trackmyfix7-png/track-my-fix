import { supabase } from '@/lib/supabase'
import type { ServiceOrderStatus, EntryChecklist, ServiceOrderStatusHistory } from '@/types/database'

// ─── List ─────────────────────────────────────────────────────────────────────

export interface WorkshopOrderRow {
  id: string
  status: ServiceOrderStatus
  entry_date: string
  problem_description: string | null
  vehicle: {
    id: string
    brand: string
    model: string
    year: number
    plate: string
    mileage: number | null
    owner: { id: string; full_name: string; avatar_url: string | null }
  }
}

export async function fetchWorkshopActiveOrders(workshopId: string): Promise<WorkshopOrderRow[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      id, status, entry_date, problem_description,
      vehicle:vehicles(
        id, brand, model, year, plate, mileage,
        owner:profiles!owner_id(id, full_name, avatar_url)
      )
    `)
    .eq('workshop_id', workshopId)
    .order('entry_date', { ascending: false })

  if (error) throw error
  return data as unknown as WorkshopOrderRow[]
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface WorkshopOrderDetail {
  id: string
  status: ServiceOrderStatus
  entry_date: string
  exit_date: string | null
  problem_description: string | null
  workshop_notes: string | null
  vehicle: {
    id: string
    brand: string
    model: string
    year: number
    plate: string
    color: string | null
    fuel_type: string | null
    mileage: number | null
    owner: { id: string; full_name: string; avatar_url: string | null; phone: string | null }
  }
  history: (ServiceOrderStatusHistory & { changer: { full_name: string } | null })[]
  checklist: EntryChecklist[]
}

export async function fetchOrderDetail(orderId: string): Promise<WorkshopOrderDetail | null> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      id, status, entry_date, exit_date, problem_description, workshop_notes,
      vehicle:vehicles(
        id, brand, model, year, plate, color, fuel_type, mileage,
        owner:profiles!owner_id(id, full_name, avatar_url, phone)
      ),
      history:service_order_status_history(
        id, status, notes, changed_at,
        changer:profiles!changed_by(full_name)
      ),
      checklist:entry_checklist(id, item, is_ok, notes, checked_at, created_at)
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as unknown as WorkshopOrderDetail
}

// ─── Status update ────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  status: ServiceOrderStatus,
  notes: string | null
): Promise<void> {
  const { error } = await supabase
    .from('service_orders')
    .update({
      status,
      workshop_notes: notes || null,
      ...(status === 'delivered' ? { exit_date: new Date().toISOString() } : {}),
    })
    .eq('id', orderId)

  if (error) throw error

  // Atualiza o campo notes na entrada de histórico criada pelo trigger
  if (notes) {
    const { data: latest } = await supabase
      .from('service_order_status_history')
      .select('id')
      .eq('service_order_id', orderId)
      .order('changed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest) {
      await supabase
        .from('service_order_status_history')
        .update({ notes })
        .eq('id', latest.id)
    }
  }
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export interface WorkshopClient {
  id: string
  full_name: string
  avatar_url: string | null
}

export async function fetchWorkshopClients(workshopId: string): Promise<WorkshopClient[]> {
  const { data, error } = await supabase
    .from('client_workshops')
    .select('client:profiles!client_id(id, full_name, avatar_url)')
    .eq('workshop_id', workshopId)

  if (error) throw error
  return (data as any[]).map((d) => d.client) as WorkshopClient[]
}

// ─── Register vehicle + service order ────────────────────────────────────────

export interface RegisterVehiclePayload {
  clientId: string
  workshopId: string
  brand: string
  model: string
  year: number
  plate: string
  color?: string
  fuelType?: string
  mileage?: number
  problemDescription?: string
  checklist: { item: string; isOk: boolean }[]
  checklistNotes?: string
}

export async function registerVehicleAndOrder(payload: RegisterVehiclePayload): Promise<string> {
  // 1. Cria veículo em nome do cliente via função SECURITY DEFINER
  const { data: vehicleId, error: vehicleError } = await supabase.rpc(
    'register_vehicle_for_client',
    {
      p_client_id: payload.clientId,
      p_brand:     payload.brand,
      p_model:     payload.model,
      p_year:      payload.year,
      p_plate:     payload.plate.toUpperCase(),
      p_color:     payload.color     || null,
      p_fuel_type: payload.fuelType  || null,
      p_mileage:   payload.mileage   || null,
      p_notes:     payload.problemDescription || null,
    }
  )
  if (vehicleError) throw vehicleError

  // 2. Cria ordem de serviço
  const { data: order, error: orderError } = await supabase
    .from('service_orders')
    .insert({
      vehicle_id:          vehicleId,
      workshop_id:         payload.workshopId,
      problem_description: payload.problemDescription || null,
      status:              'received',
    })
    .select('id')
    .single()
  if (orderError) throw orderError

  // 3. Insere itens do check-list
  if (payload.checklist.length > 0) {
    const items = payload.checklist.map((c) => ({
      service_order_id: order.id,
      item:             c.item,
      is_ok:            c.isOk,
      notes:            !c.isOk && payload.checklistNotes ? payload.checklistNotes : null,
      checked_at:       c.isOk ? new Date().toISOString() : null,
    }))
    const { error: clError } = await supabase.from('entry_checklist').insert(items)
    if (clError) throw clError
  }

  return order.id
}
