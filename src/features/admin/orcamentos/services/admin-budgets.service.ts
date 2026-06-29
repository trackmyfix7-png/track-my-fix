import { supabase } from '@/lib/supabase'
import type { BudgetStatus } from '@/types/database'

// ─── Service requests pendentes ───────────────────────────────────────────────

export interface PendingRequest {
  id: string
  owner_id: string
  vehicle_id: string
  problem_description: string
  category: string | null
  status: 'pending' | 'analyzing' | 'budget_created'
  created_at: string
  vehicle: { id: string; brand: string; model: string; year: number; plate: string }
  owner: { id: string; full_name: string; avatar_url: string | null }
}

export async function fetchPendingServiceRequests(workshopId: string): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      id, owner_id, vehicle_id, problem_description, category, status, created_at,
      vehicle:vehicles(id, brand, model, year, plate),
      owner:profiles!owner_id(id, full_name, avatar_url)
    `)
    .eq('workshop_id', workshopId)
    .in('status', ['pending', 'analyzing'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as PendingRequest[]
}

// ─── Veículos do cliente ──────────────────────────────────────────────────────

export interface ClientVehicle {
  id: string
  brand: string
  model: string
  year: number
  plate: string
}

export async function fetchClientVehicles(clientId: string): Promise<ClientVehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, brand, model, year, plate')
    .eq('owner_id', clientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ClientVehicle[]
}

// ─── Orçamentos da oficina ────────────────────────────────────────────────────

export interface WorkshopBudgetRow {
  id: string
  budget_number: string
  status: BudgetStatus
  total_amount: number
  issued_at: string
  valid_until: string | null
  vehicle: { brand: string; model: string; year: number; plate: string }
  owner: { full_name: string } | null
}

export async function fetchWorkshopBudgets(workshopId: string): Promise<WorkshopBudgetRow[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      id, budget_number, status, total_amount, issued_at, valid_until,
      vehicle:vehicles(brand, model, year, plate,
        owner:profiles!owner_id(full_name)
      )
    `)
    .eq('workshop_id', workshopId)
    .order('issued_at', { ascending: false })
    .limit(30)

  if (error) throw error

  return (data as any[]).map((row) => ({
    ...row,
    owner: row.vehicle?.owner ?? null,
  })) as WorkshopBudgetRow[]
}

// ─── Criar orçamento ──────────────────────────────────────────────────────────

export interface CreateBudgetItem {
  description: string
  category: 'part' | 'service'
  quantity: number
  unitPrice: number
}

export interface CreateBudgetPayload {
  workshopId: string
  vehicleId: string
  serviceRequestId?: string
  items: CreateBudgetItem[]
  notes?: string
  validUntil?: string
}

export async function createBudget(payload: CreateBudgetPayload): Promise<string> {
  const totalAmount = payload.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  // 1. Gera número sequencial do orçamento
  const { data: budgetNumber, error: numError } = await supabase.rpc(
    'next_workshop_number',
    { p_workshop_id: payload.workshopId, p_type: 'budget' }
  )
  if (numError) throw numError

  // 2. Cria o orçamento
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .insert({
      budget_number:   budgetNumber,
      vehicle_id:      payload.vehicleId,
      workshop_id:     payload.workshopId,
      status:          'awaiting_approval',
      total_amount:    totalAmount,
      workshop_notes:  payload.notes    || null,
      valid_until:     payload.validUntil || null,
      issued_at:       new Date().toISOString(),
    })
    .select('id')
    .single()
  if (budgetError) throw budgetError

  // 3. Insere os itens
  const items = payload.items.map((i) => ({
    budget_id:   budget.id,
    description: i.description,
    category:    i.category,
    quantity:    i.quantity,
    unit_price:  i.unitPrice,
    total_price: i.quantity * i.unitPrice,
  }))
  const { error: itemsError } = await supabase.from('budget_items').insert(items)
  if (itemsError) throw itemsError

  // 4. Atualiza status da solicitação de origem
  if (payload.serviceRequestId) {
    await supabase
      .from('service_requests')
      .update({ status: 'budget_created' })
      .eq('id', payload.serviceRequestId)
  }

  return budget.id
}
