import { supabase } from '@/lib/supabase'
import { startOfMonth } from 'date-fns'

export interface DashboardStats {
  activeVehicles: number
  pendingBudgets: number
  monthlyRevenue: number
  alertCount: number
}

export async function fetchDashboardStats(workshopId: string): Promise<DashboardStats> {
  const monthStart = startOfMonth(new Date()).toISOString()

  const [ordersRes, budgetsRes, invoicesRes] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, entry_date')
      .eq('workshop_id', workshopId)
      .neq('status', 'delivered'),

    supabase
      .from('budgets')
      .select('id', { count: 'exact', head: true })
      .eq('workshop_id', workshopId)
      .eq('status', 'awaiting_approval'),

    supabase
      .from('invoices')
      .select('amount')
      .eq('workshop_id', workshopId)
      .eq('status', 'paid')
      .gte('issued_at', monthStart),
  ])

  const now = new Date()
  const alertCount = (ordersRes.data ?? []).filter((o) => {
    const days = (now.getTime() - new Date(o.entry_date).getTime()) / 86_400_000
    return days >= 4
  }).length

  const monthlyRevenue = (invoicesRes.data ?? []).reduce(
    (s, i) => s + (i.amount ?? 0),
    0
  )

  return {
    activeVehicles: ordersRes.data?.length ?? 0,
    pendingBudgets: budgetsRes.count ?? 0,
    monthlyRevenue,
    alertCount,
  }
}
