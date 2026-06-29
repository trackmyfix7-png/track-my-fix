import { supabase } from '@/lib/supabase'
import type { DashboardSummary, ServiceOrder } from '@/types/database'

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const [vehiclesRes, pendingBudgetsRes, invoicesRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    supabase
      .from('budgets')
      .select('total_amount')
      .eq('status', 'awaiting_approval'),

    supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'paid'),
  ])

  if (vehiclesRes.error)      throw vehiclesRes.error
  if (pendingBudgetsRes.error) throw pendingBudgetsRes.error
  if (invoicesRes.error)       throw invoicesRes.error

  const pendingBudgets = pendingBudgetsRes.data?.length ?? 0
  const pendingBudgetsAmount = pendingBudgetsRes.data?.reduce(
    (sum, b) => sum + Number(b.total_amount), 0
  ) ?? 0
  const totalHistory = invoicesRes.data?.reduce(
    (sum, i) => sum + Number(i.amount), 0
  ) ?? 0

  return {
    activeVehicles: vehiclesRes.count ?? 0,
    pendingBudgets,
    pendingBudgetsAmount,
    totalHistory,
  }
}

export async function fetchActiveServiceOrders(): Promise<ServiceOrder[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      id, vehicle_id, workshop_id, status, entry_date, exit_date,
      problem_description, workshop_notes, created_at, updated_at,
      vehicle:vehicles(*)
    `)
    .neq('status', 'delivered')
    .order('entry_date', { ascending: false })

  if (error) throw error
  return data as unknown as ServiceOrder[]
}

export async function fetchRecentHistory(): Promise<ServiceOrder[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      id, vehicle_id, workshop_id, status, entry_date, exit_date,
      problem_description, workshop_notes, created_at, updated_at,
      vehicle:vehicles(*)
    `)
    .eq('status', 'delivered')
    .order('exit_date', { ascending: false })
    .limit(10)

  if (error) throw error
  return data as unknown as ServiceOrder[]
}
