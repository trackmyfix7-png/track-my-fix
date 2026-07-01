import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Workshop } from '@/types/database'
import {
  fetchWorkshopActiveOrders,
  fetchOrderDetail,
  updateOrderStatus,
} from '@/features/admin/veiculos/services/admin-vehicles.service'
import {
  fetchPendingServiceRequests,
  fetchWorkshopBudgets,
} from '@/features/admin/orcamentos/services/admin-budgets.service'
import type { ServiceOrderStatus } from '@/types/database'

// ─── Contexto do funcionário (workshop + permissões em uma query) ─────────────

export interface EmployeeContext {
  workshop:          Workshop
  linkId:            string
  canApproveBudgets: boolean
}

async function fetchEmployeeContext(): Promise<EmployeeContext | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('workshop_employees')
    .select('id, can_approve_budgets, workshop:workshops(*)')
    .eq('employee_id', session.user.id)
    .maybeSingle()

  if (error) throw error
  const row = data as any
  if (!row?.workshop) return null

  return {
    workshop:          row.workshop as Workshop,
    linkId:            row.id as string,
    canApproveBudgets: (row.can_approve_budgets as boolean) ?? false,
  }
}

export function useEmployeeContext() {
  return useQuery({
    queryKey: ['employee', 'context'],
    queryFn:  fetchEmployeeContext,
  })
}

// Compat shims — consumidos internamente e por outras features
export function useEmployeeWorkshop() {
  const { data: ctx, ...rest } = useEmployeeContext()
  return { ...rest, data: ctx?.workshop ?? null }
}

export function useEmployeePermissions() {
  const { data: ctx, ...rest } = useEmployeeContext()
  return {
    ...rest,
    data: ctx ? { linkId: ctx.linkId, canApproveBudgets: ctx.canApproveBudgets } : null,
  }
}

// ─── Rascunhos do funcionário ─────────────────────────────────────────────────

export interface MyDraftBudget {
  id: string
  budget_number: string
  total_amount: number
  issued_at: string
  review_notes: string | null
  service_request: { problem_description: string; category: string | null } | null
  vehicle: { brand: string; model: string; year: number; plate: string }
  items: { description: string; category: string; quantity: number; unit_price: number; total_price: number }[]
}

async function fetchMyDraftBudgets(linkId: string): Promise<MyDraftBudget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      id, budget_number, total_amount, issued_at, review_notes,
      service_request:service_requests(problem_description, category),
      vehicle:vehicles(brand, model, year, plate),
      items:budget_items(description, category, quantity, unit_price, total_price)
    `)
    .eq('created_by_employee_id', linkId)
    .eq('is_draft', true)
    .order('issued_at', { ascending: false })

  if (error) throw error
  return data as unknown as MyDraftBudget[]
}

export function useMyDraftBudgets() {
  const { data: perms } = useEmployeePermissions()
  return useQuery({
    queryKey: ['employee', 'my-drafts', perms?.linkId],
    queryFn:  () => fetchMyDraftBudgets(perms!.linkId),
    enabled:  !!perms?.linkId,
  })
}

// ─── Criar orçamento (funcionário) ───────────────────────────────────────────

export interface EmployeeBudgetItem {
  description: string
  category: 'part' | 'service'
  quantity: number
  unit_price: number
}

export interface CreateEmployeeBudgetPayload {
  workshopId:        string
  vehicleId:         string
  serviceRequestId:  string
  items:             EmployeeBudgetItem[]
  notes?:            string
}

async function createEmployeeBudget(payload: CreateEmployeeBudgetPayload) {
  const { data, error } = await supabase.rpc('create_employee_budget', {
    p_workshop_id:        payload.workshopId,
    p_vehicle_id:         payload.vehicleId,
    p_service_request_id: payload.serviceRequestId,
    p_items:              payload.items,
    p_notes:              payload.notes ?? null,
  })
  if (error) throw error
  return data as { budget_id: string; budget_number: string; is_draft: boolean }
}

export function useCreateEmployeeBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployeeBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['employee', 'my-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['employee', 'budgets'] })
    },
  })
}

export function useCreateEmployeeBudgets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payloads: CreateEmployeeBudgetPayload[]) =>
      Promise.all(payloads.map(createEmployeeBudget)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['employee', 'my-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['employee', 'budgets'] })
    },
  })
}

// ─── Ordens da oficina ────────────────────────────────────────────────────────

export function useEmployeeOrders() {
  const { data: workshop } = useEmployeeWorkshop()
  return useQuery({
    queryKey: ['employee', 'orders', workshop?.id],
    queryFn:  () => fetchWorkshopActiveOrders(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

// ─── Detalhe da ordem ────────────────────────────────────────────────────────

export function useEmployeeOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['employee', 'order', orderId],
    queryFn:  () => fetchOrderDetail(orderId),
    enabled:  !!orderId,
  })
}

// ─── Atualizar status ─────────────────────────────────────────────────────────

// ─── Orçamentos (somente leitura) ─────────────────────────────────────────────

export function useEmployeeServiceRequests() {
  const { data: workshop } = useEmployeeWorkshop()
  return useQuery({
    queryKey: ['employee', 'service-requests', workshop?.id],
    queryFn:  () => fetchPendingServiceRequests(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useEmployeeBudgets() {
  const { data: workshop } = useEmployeeWorkshop()
  return useQuery({
    queryKey: ['employee', 'budgets', workshop?.id],
    queryFn:  () => fetchWorkshopBudgets(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

// ─── Atualizar status ─────────────────────────────────────────────────────────

export function useEmployeeUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      notes,
    }: {
      orderId: string
      status:  ServiceOrderStatus
      notes:   string | null
    }) => updateOrderStatus(orderId, status, notes),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['employee', 'order', orderId] })
    },
  })
}
