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
  trainings_count?: number
}

export interface EmployeeTraining {
  id: string
  employee_id: string
  workshop_id: string
  title: string
  provider: string | null
  completed_at: string | null
  valid_until: string | null
  notes: string | null
  created_at: string
}

export type CreateEmployeePayload = {
  name: string
  position?: string
  phone?: string
  email?: string
  hired_at?: string
  notes?: string
}

export type CreateTrainingPayload = {
  title: string
  provider?: string
  completed_at?: string
  valid_until?: string
  notes?: string
}

export async function fetchEmployees(workshopId: string): Promise<EmployeeHR[]> {
  const [{ data: emps, error }, { data: trainings }] = await Promise.all([
    supabase
      .from('employees')
      .select('*')
      .eq('workshop_id', workshopId)
      .order('name'),
    supabase
      .from('employee_trainings')
      .select('employee_id')
      .eq('workshop_id', workshopId),
  ])

  if (error) throw error

  const countMap: Record<string, number> = {}
  for (const t of trainings ?? []) {
    countMap[t.employee_id] = (countMap[t.employee_id] ?? 0) + 1
  }

  return (emps ?? []).map((e) => ({ ...e, trainings_count: countMap[e.id] ?? 0 }))
}

export async function createEmployee(workshopId: string, payload: CreateEmployeePayload): Promise<EmployeeHR> {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      workshop_id: workshopId,
      name: payload.name,
      position: payload.position || null,
      phone: payload.phone || null,
      email: payload.email || null,
      hired_at: payload.hired_at || null,
      notes: payload.notes || null,
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

export async function fetchEmployeeTrainings(employeeId: string): Promise<EmployeeTraining[]> {
  const { data, error } = await supabase
    .from('employee_trainings')
    .select('*')
    .eq('employee_id', employeeId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createTraining(
  employeeId: string,
  workshopId: string,
  payload: CreateTrainingPayload,
): Promise<EmployeeTraining> {
  const { data, error } = await supabase
    .from('employee_trainings')
    .insert({
      employee_id: employeeId,
      workshop_id: workshopId,
      title: payload.title,
      provider: payload.provider || null,
      completed_at: payload.completed_at || null,
      valid_until: payload.valid_until || null,
      notes: payload.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTraining(id: string): Promise<void> {
  const { error } = await supabase.from('employee_trainings').delete().eq('id', id)
  if (error) throw error
}
