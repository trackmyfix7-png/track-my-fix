import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchWorkshopServices,
  toggleServiceActive,
  createService,
  updateService,
  deleteService,
  type CreateServiceData,
} from '../services/admin-services-catalog.service'

const KEY = (id?: string) => ['admin', 'services-catalog', id]

export function useWorkshopServices() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: KEY(workshop?.id),
    queryFn:  () => fetchWorkshopServices(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useToggleService() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleServiceActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(workshop?.id) }),
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (data: CreateServiceData) => createService(workshop!.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(workshop?.id) }),
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateServiceData> }) =>
      updateService(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(workshop?.id) }),
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(workshop?.id) }),
  })
}
