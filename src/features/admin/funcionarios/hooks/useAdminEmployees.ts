import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchWorkshopEmployees,
  addEmployee,
  removeEmployee,
  toggleBudgetApproval,
} from '../services/admin-employees.service'

const KEY = (id?: string) => ['admin', 'employees', id]

export function useWorkshopEmployees() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: KEY(workshop?.id),
    queryFn:  () => fetchWorkshopEmployees(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useAddEmployee() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (email: string) => addEmployee(workshop!.id, email),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: KEY(workshop?.id) }),
  })
}

export function useRemoveEmployee() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (linkId: string) => removeEmployee(linkId),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: KEY(workshop?.id) }),
  })
}

export function useToggleBudgetApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ linkId, value }: { linkId: string; value: boolean }) =>
      toggleBudgetApproval(linkId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] })
      // Invalida o contexto do funcionário (mesmo browser/sessão de teste)
      queryClient.invalidateQueries({ queryKey: ['employee', 'context'] })
    },
  })
}
