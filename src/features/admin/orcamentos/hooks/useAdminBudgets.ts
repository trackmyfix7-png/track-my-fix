import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchPendingServiceRequests,
  fetchClientVehicles,
  fetchWorkshopBudgets,
  fetchDraftBudgets,
  fetchServiceById,
  createBudget,
  createBudgets,
  publishDraft,
  returnDraft,
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

export function useServiceById(serviceId: string | null) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn:  () => fetchServiceById(serviceId!),
    enabled:  !!serviceId,
    staleTime: 5 * 60 * 1000,
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

export function useDraftBudgets() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: ['admin', 'drafts', workshop?.id],
    queryFn:  () => fetchDraftBudgets(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

function invalidateAfterBudget(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'budgets'] })
  queryClient.invalidateQueries({ queryKey: ['admin', 'drafts'] })
  queryClient.invalidateQueries({ queryKey: ['admin', 'service-requests'] })
  queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['employee', 'my-drafts'] })
}

export function usePublishDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ budgetId, serviceRequestId }: { budgetId: string; serviceRequestId: string | null }) =>
      publishDraft(budgetId, serviceRequestId),
    onSuccess: () => invalidateAfterBudget(queryClient),
  })
}

export function useReturnDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ budgetId, notes }: { budgetId: string; notes: string }) =>
      returnDraft(budgetId, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'drafts'] }),
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (payload: Omit<CreateBudgetPayload, 'workshopId'>) =>
      createBudget({ ...payload, workshopId: workshop!.id }),
    onSuccess: () => invalidateAfterBudget(queryClient),
  })
}

export function useCreateBudgets() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (payloads: Omit<CreateBudgetPayload, 'workshopId'>[]) =>
      createBudgets(payloads, workshop!.id),
    onSuccess: () => invalidateAfterBudget(queryClient),
  })
}
