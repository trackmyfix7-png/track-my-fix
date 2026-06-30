import { supabase } from '@/lib/supabase'

export interface EmployeeHR {
  id: string
  workshop_id: string
  name: string
  position: string | null
  phone: string | null
  email: string | null
  hired_at: string | null
  notes: string | null
  created_at: string
  linked_user_id: string | null
}

export type CreateEmployeePayload = {
  name: string
  position?: string
  phone?: string
  email?: string
  hired_at?: string
  notes?: string
  linked_user_id?: string
}

export async function fetchEmployees(workshopId: string): Promise<EmployeeHR[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createEmployee(workshopId: string, payload: CreateEmployeePayload): Promise<EmployeeHR> {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      workshop_id:    workshopId,
      name:           payload.name,
      position:       payload.position       || null,
      phone:          payload.phone          || null,
      email:          payload.email          || null,
      hired_at:       payload.hired_at       || null,
      notes:          payload.notes          || null,
      linked_user_id: payload.linked_user_id || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEmployee(id: string, payload: Partial<CreateEmployeePayload>): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({
      name: payload.name,
      position: payload.position ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      hired_at: payload.hired_at ?? null,
      notes: payload.notes ?? null,
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
}
