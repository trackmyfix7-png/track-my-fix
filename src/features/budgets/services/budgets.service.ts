import { supabase } from '@/lib/supabase'
import type { Budget } from '@/types/database'

const BUDGET_SELECT = '*, vehicle:vehicles(*), items:budget_items(*)'

export async function fetchBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(BUDGET_SELECT)
    .order('issued_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchBudgetById(id: string): Promise<Budget | null> {
  const { data, error } = await supabase
    .from('budgets')
    .select(BUDGET_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function approveBudget(id: string): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ status: 'approved' })
    .eq('id', id)
    .select(BUDGET_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function rejectBudget(id: string): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select(BUDGET_SELECT)
    .single()

  if (error) throw error
  return data
}
