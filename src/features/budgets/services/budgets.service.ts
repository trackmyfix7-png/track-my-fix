import { supabase } from '@/lib/supabase'
import type { Budget } from '@/types/database'

const BUDGET_SELECT_LIST   = '*, vehicle:vehicles(*), workshop:workshops(name), items:budget_items(*), service_request:service_requests(problem_description, category, service_id, service:services(name, description, estimated_time, base_price))'
const BUDGET_SELECT_DETAIL = '*, vehicle:vehicles(*), workshop:workshops(name, phone), items:budget_items(*), service_request:service_requests(problem_description, category, service_id, service:services!service_id(name, description, estimated_time, base_price), images:service_request_images!request_id(id, storage_path))'

async function attachImageUrls(budget: Budget): Promise<Budget> {
  const imgs = budget.service_request?.images
  if (!imgs?.length) return budget

  const signed = await Promise.all(
    imgs.map(async (img) => {
      const { data } = await supabase.storage
        .from('service-requests')
        .createSignedUrl(img.storage_path, 3600)
      return { ...img, url: data?.signedUrl ?? null }
    })
  )

  return {
    ...budget,
    service_request: { ...budget.service_request!, images: signed },
  }
}

export async function fetchBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(BUDGET_SELECT_LIST)
    .eq('is_draft', false)
    .order('issued_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchBudgetById(id: string): Promise<Budget | null> {
  const { data, error } = await supabase
    .from('budgets')
    .select(BUDGET_SELECT_DETAIL)
    .eq('id', id)
    .eq('is_draft', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return attachImageUrls(data)
}

export async function approveBudget(id: string): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ status: 'approved' })
    .eq('id', id)
    .select(BUDGET_SELECT_DETAIL)
    .single()

  if (error) throw error
  return attachImageUrls(data)
}

export async function rejectBudget(id: string): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select(BUDGET_SELECT_DETAIL)
    .single()

  if (error) throw error
  return attachImageUrls(data)
}
