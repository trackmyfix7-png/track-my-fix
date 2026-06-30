import { supabase } from '@/lib/supabase'
import { startOfMonth, subMonths } from 'date-fns'

export interface DashboardStats {
  activeVehicles: number
  pendingBudgets: number
  monthlyRevenue: number
  prevMonthRevenue: number
  revenueChange: number | null
  alertCount: number
}

export async function fetchDashboardStats(workshopId: string): Promise<DashboardStats> {
  const now          = new Date()
  const monthStart   = startOfMonth(now).toISOString()
  const prevStart    = startOfMonth(subMonths(now, 1)).toISOString()

  const [ordersRes, budgetsRes, invoicesRes, prevInvoicesRes] = await Promise.all([
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

    supabase
      .from('invoices')
      .select('amount')
      .eq('workshop_id', workshopId)
      .eq('status', 'paid')
      .gte('issued_at', prevStart)
      .lt('issued_at', monthStart),
  ])

  const alertCount = (ordersRes.data ?? []).filter((o) => {
    const days = (now.getTime() - new Date(o.entry_date).getTime()) / 86_400_000
    return days >= 4
  }).length

  const monthlyRevenue  = (invoicesRes.data     ?? []).reduce((s, i) => s + (i.amount ?? 0), 0)
  const prevMonthRevenue = (prevInvoicesRes.data ?? []).reduce((s, i) => s + (i.amount ?? 0), 0)
  const revenueChange    = prevMonthRevenue > 0
    ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : null

  return {
    activeVehicles: ordersRes.data?.length ?? 0,
    pendingBudgets: budgetsRes.count ?? 0,
    monthlyRevenue,
    prevMonthRevenue,
    revenueChange,
    alertCount,
  }
}
