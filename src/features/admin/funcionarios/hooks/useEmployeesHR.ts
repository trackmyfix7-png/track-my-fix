import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type CreateEmployeePayload,
} from '../services/admin-employees-hr.service'

const EMP_KEY = (wid?: string) => ['admin', 'employees-hr', wid]

export function useEmployeesHR() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: EMP_KEY(workshop?.id),
    queryFn:  () => fetchEmployees(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  const { data: workshop } = useWorkshop()
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => createEmployee(workshop!.id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: EMP_KEY(workshop?.id) }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  const { data: workshop } = useWorkshop()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<CreateEmployeePayload>) =>
      updateEmployee(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMP_KEY(workshop?.id) }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  const { data: workshop } = useWorkshop()
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: EMP_KEY(workshop?.id) }),
  })
}
