import { supabase } from '@/lib/supabase'
import type { BudgetStatus } from '@/types/database'

// ─── Service requests pendentes ───────────────────────────────────────────────

export interface PendingRequest {
  id: string
  owner_id: string
  vehicle_id: string
  problem_description: string
  category: string | null
  service_id: string | null
  service_base_price: number | null
  status: 'pending' | 'analyzing' | 'budget_created'
  created_at: string
  vehicle: { id: string; brand: string; model: string; year: number; plate: string } | null
  owner: { id: string; full_name: string; avatar_url: string | null } | null
  images: Array<{ id: string; storage_path: string; url?: string | null }> | null
}

export interface RequestService {
  name: string
  description: string | null
  base_price: number
}

async function attachRequestImageUrls(requests: PendingRequest[]): Promise<PendingRequest[]> {
  return Promise.all(
    requests.map(async (req) => {
      if (!req.images?.length) return req
      const signed = await Promise.all(
        req.images.map(async (img) => {
          const { data } = await supabase.storage
            .from('service-requests')
            .createSignedUrl(img.storage_path, 3600)
          return { ...img, url: data?.signedUrl ?? null }
        })
      )
      return { ...req, images: signed }
    })
  )
}

export async function fetchPendingServiceRequests(workshopId: string): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      id, owner_id, vehicle_id, problem_description, category, service_id, status, created_at,
      vehicle:vehicles(id, brand, model, year, plate),
      owner:profiles!owner_id(id, full_name, avatar_url),
      images:service_request_images!request_id(id, storage_path)
    `)
    .eq('workshop_id', workshopId)
    .in('status', ['pending', 'analyzing'])
    .order('created_at', { ascending: false })

  if (error) throw error

  const raw = data as unknown as PendingRequest[]

  // Batch-fetch base_price for all requests that have a linked catalog service
  const serviceIds = [...new Set(raw.map((r) => r.service_id).filter(Boolean) as string[])]
  let priceMap: Record<string, number> = {}
  if (serviceIds.length > 0) {
    const { data: prices } = await supabase
      .from('services')
      .select('id, base_price')
      .in('id', serviceIds)
    if (prices) {
      priceMap = Object.fromEntries(prices.map((p: { id: string; base_price: number }) => [p.id, p.base_price]))
    }
  }

  const withPrices = raw.map((r) => ({
    ...r,
    service_base_price: r.service_id ? (priceMap[r.service_id] ?? null) : null,
  }))

  return attachRequestImageUrls(withPrices)
}

export async function fetchServiceById(id: string): Promise<RequestService | null> {
  const { data, error } = await supabase
    .from('services')
    .select('name, description, base_price')
    .eq('id', id)
    .single()

  if (error) return null
  return data
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
  service_request: { category: string | null } | null
}

export async function fetchWorkshopBudgets(workshopId: string): Promise<WorkshopBudgetRow[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      id, budget_number, status, total_amount, issued_at, valid_until,
      vehicle:vehicles(brand, model, year, plate,
        owner:profiles!owner_id(full_name)
      ),
      service_request:service_requests(category)
    `)
    .eq('workshop_id', workshopId)
    .eq('is_draft', false)
    .order('issued_at', { ascending: false })
    .limit(30)

  if (error) throw error

  return (data as any[]).map((row) => ({
    ...row,
    owner: row.vehicle?.owner ?? null,
  })) as WorkshopBudgetRow[]
}

// ─── Rascunhos de funcionários ────────────────────────────────────────────────

export interface DraftBudgetRow {
  id: string
  budget_number: string
  total_amount: number
  issued_at: string
  review_notes: string | null
  service_request_id: string | null
  vehicle: { brand: string; model: string; year: number; plate: string }
  owner: { full_name: string } | null
  service_request: { problem_description: string; category: string | null } | null
  items: { description: string; category: string; quantity: number; unit_price: number; total_price: number }[]
  creator: { full_name: string } | null
}

export async function fetchDraftBudgets(workshopId: string): Promise<DraftBudgetRow[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      id, budget_number, total_amount, issued_at, review_notes, service_request_id,
      vehicle:vehicles(brand, model, year, plate,
        owner:profiles!owner_id(full_name)
      ),
      service_request:service_requests(problem_description, category),
      items:budget_items(description, category, quantity, unit_price, total_price),
      created_by:workshop_employees!created_by_employee_id(
        employee:profiles!employee_id(full_name)
      )
    `)
    .eq('workshop_id', workshopId)
    .eq('is_draft', true)
    .order('issued_at', { ascending: false })

  if (error) throw error

  return (data as any[]).map((row) => ({
    ...row,
    owner:   row.vehicle?.owner ?? null,
    creator: row.created_by?.employee ?? null,
  })) as DraftBudgetRow[]
}

export async function publishDraft(budgetId: string, serviceRequestId: string | null): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .update({ is_draft: false })
    .eq('id', budgetId)

  if (error) throw error

  if (serviceRequestId) {
    await supabase
      .from('service_requests')
      .update({ status: 'budget_created' })
      .eq('id', serviceRequestId)
  }
}

export async function returnDraft(budgetId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .update({ review_notes: notes })
    .eq('id', budgetId)

  if (error) throw error
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
      budget_number:      budgetNumber,
      vehicle_id:         payload.vehicleId,
      workshop_id:        payload.workshopId,
      service_request_id: payload.serviceRequestId || null,
      status:             'awaiting_approval',
      total_amount:       totalAmount,
      workshop_notes:     payload.notes    || null,
      valid_until:        payload.validUntil || null,
      issued_at:          new Date().toISOString(),
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

// ─── Criar orçamento em lote (mesmos itens p/ várias solicitações) ────────────

export async function createBudgets(
  payloads: Omit<CreateBudgetPayload, 'workshopId'>[],
  workshopId: string
): Promise<string[]> {
  const ids: string[] = []
  for (const payload of payloads) {
    ids.push(await createBudget({ ...payload, workshopId }))
  }
  return ids
}
