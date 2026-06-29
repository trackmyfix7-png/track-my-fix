import { supabase } from '@/lib/supabase'
import { startOfMonth, differenceInDays, parseISO } from 'date-fns'

export interface FinanceiroStats {
  monthlyRevenue: number
  avgTicket: number
  approvalRate: number
  avgDaysInShop: number
}

export interface InvoiceRow {
  id: string
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  issued_at: string
  due_date: string | null
  vehicle: { brand: string; model: string }
  owner: { full_name: string } | null
}

export async function fetchFinanceiroStats(workshopId: string): Promise<FinanceiroStats> {
  const monthStart = startOfMonth(new Date()).toISOString()

  const [invoicesRes, budgetsRes, ordersRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('amount, status')
      .eq('workshop_id', workshopId)
      .gte('issued_at', monthStart),

    supabase
      .from('budgets')
      .select('status')
      .eq('workshop_id', workshopId)
      .in('status', ['approved', 'rejected', 'completed']),

    supabase
      .from('service_orders')
      .select('entry_date, exit_date')
      .eq('workshop_id', workshopId)
      .eq('status', 'delivered')
      .not('exit_date', 'is', null)
      .gte('exit_date', monthStart),
  ])

  const paidInvoices = (invoicesRes.data ?? []).filter((i) => i.status === 'paid')
  const monthlyRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0)
  const avgTicket = paidInvoices.length > 0 ? monthlyRevenue / paidInvoices.length : 0

  const budgets = budgetsRes.data ?? []
  const approved = budgets.filter((b) => b.status === 'approved' || b.status === 'completed').length
  const approvalRate = budgets.length > 0 ? (approved / budgets.length) * 100 : 0

  const deliveredOrders = ordersRes.data ?? []
  const avgDaysInShop =
    deliveredOrders.length > 0
      ? deliveredOrders.reduce((s, o) => {
          return s + differenceInDays(parseISO(o.exit_date!), parseISO(o.entry_date))
        }, 0) / deliveredOrders.length
      : 0

  return { monthlyRevenue, avgTicket, approvalRate, avgDaysInShop }
}

export async function fetchRecentInvoices(workshopId: string): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, amount, status, issued_at, due_date,
      vehicle:vehicles!vehicle_id(brand, model,
        owner:profiles!owner_id(full_name)
      )
    `)
    .eq('workshop_id', workshopId)
    .order('issued_at', { ascending: false })
    .limit(20)

  if (error) throw error

  return (data as any[]).map((row) => ({
    ...row,
    owner: row.vehicle?.owner ?? null,
  })) as InvoiceRow[]
}
