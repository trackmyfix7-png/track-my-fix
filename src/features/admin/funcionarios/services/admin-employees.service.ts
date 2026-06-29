import { supabase } from '@/lib/supabase'

export interface EmployeeRow {
  id: string
  employee_id: string
  linked_at: string
  employee: {
    id: string
    full_name: string
    phone: string | null
    avatar_url: string | null
  }
}

export async function fetchWorkshopEmployees(workshopId: string): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from('workshop_employees')
    .select(`
      id, employee_id, linked_at,
      employee:profiles!employee_id(id, full_name, phone, avatar_url)
    `)
    .eq('workshop_id', workshopId)
    .order('linked_at', { ascending: false })

  if (error) throw error
  return data as unknown as EmployeeRow[]
}

export async function addEmployee(
  workshopId: string,
  email: string
): Promise<{ employee_id: string; name: string }> {
  const { data, error } = await supabase.rpc('add_workshop_employee', {
    p_employee_email: email.trim().toLowerCase(),
    p_workshop_id:    workshopId,
  })

  if (error) {
    if (error.message.includes('user_not_found')) {
      throw new Error('Nenhum usuário cadastrado com este e-mail.')
    }
    if (error.message.includes('not_authorized')) {
      throw new Error('Você não tem permissão para gerenciar esta oficina.')
    }
    throw error
  }

  return data as { employee_id: string; name: string }
}

export async function removeEmployee(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('workshop_employees')
    .delete()
    .eq('id', linkId)

  if (error) throw error
}
