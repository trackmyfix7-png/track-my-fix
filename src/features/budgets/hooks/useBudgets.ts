import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBudgets, fetchBudgetById, approveBudget, rejectBudget } from '../services/budgets.service'

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  })
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => fetchBudgetById(id),
    enabled: !!id,
  })
}

export function useApproveBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approveBudget,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.setQueryData(['budgets', data.id], data)
    },
  })
}

export function useRejectBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rejectBudget,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.setQueryData(['budgets', data.id], data)
    },
  })
}
