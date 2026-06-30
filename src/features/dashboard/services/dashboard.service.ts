import { supabase } from '@/lib/supabase'
import type { DashboardSummary, ServiceOrder } from '@/types/database'

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const [activeRes, pendingBudgetsRes, invoicesRes, visitsRes] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'delivered'),

    supabase
      .from('budgets')
      .select('total_amount')
      .eq('status', 'awaiting_approval'),

    supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'paid'),

    supabase
      .from('service_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'delivered'),
  ])

  if (activeRes.error)         throw activeRes.error
  if (pendingBudgetsRes.error) throw pendingBudgetsRes.error
  if (invoicesRes.error)       throw invoicesRes.error

  const pendingBudgets       = pendingBudgetsRes.data?.length ?? 0
  const pendingBudgetsAmount = pendingBudgetsRes.data?.reduce((s, b) => s + Number(b.total_amount), 0) ?? 0
  const totalHistory         = invoicesRes.data?.reduce((s, i) => s + Number(i.amount), 0) ?? 0

  return {
    activeVehicles: activeRes.count ?? 0,
    pendingBudgets,
    pendingBudgetsAmount,
    totalHistory,
    totalVisits: visitsRes.count ?? 0,
  }
}

export async function fetchActiveServiceOrders(): Promise<ServiceOrder[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      id, vehicle_id, workshop_id, status, entry_date, exit_date,
      problem_description, service_description, workshop_notes, created_at, updated_at,
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
      problem_description, service_description, workshop_notes, created_at, updated_at,
      vehicle:vehicles(*)
    `)
    .eq('status', 'delivered')
    .order('exit_date', { ascending: false })
    .limit(10)

  if (error) throw error
  return data as unknown as ServiceOrder[]
}
