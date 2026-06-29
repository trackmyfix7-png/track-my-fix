import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchPendingServiceRequests,
  fetchClientVehicles,
  fetchWorkshopBudgets,
  createBudget,
  type CreateBudgetPayload,
} from '../services/admin-budgets.service'

export function usePendingServiceRequests() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: ['admin', 'service-requests', workshop?.id],
    queryFn:  () => fetchPendingServiceRequests(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useClientVehicles(clientId: string | null) {
  return useQuery({
    queryKey: ['admin', 'client-vehicles', clientId],
    queryFn:  () => fetchClientVehicles(clientId!),
    enabled:  !!clientId,
  })
}

export function useWorkshopBudgets() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: ['admin', 'budgets', workshop?.id],
    queryFn:  () => fetchWorkshopBudgets(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (payload: Omit<CreateBudgetPayload, 'workshopId'>) =>
      createBudget({ ...payload, workshopId: workshop!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'budgets'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-requests'] })
    },
  })
}
