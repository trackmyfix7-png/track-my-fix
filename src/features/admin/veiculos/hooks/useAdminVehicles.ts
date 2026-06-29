import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchWorkshopActiveOrders,
  fetchWorkshopClients,
  fetchOrderDetail,
  registerVehicleAndOrder,
  updateOrderStatus,
  type RegisterVehiclePayload,
} from '../services/admin-vehicles.service'
import type { ServiceOrderStatus } from '@/types/database'

export function useWorkshopOrders() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: ['admin', 'orders', workshop?.id],
    queryFn:  () => fetchWorkshopActiveOrders(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useWorkshopClients() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: ['admin', 'clients', workshop?.id],
    queryFn:  () => fetchWorkshopClients(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn:  () => fetchOrderDetail(orderId),
    enabled:  !!orderId,
  })
}

export function useRegisterVehicle() {
  const queryClient = useQueryClient()
  const { data: workshop } = useWorkshop()

  return useMutation({
    mutationFn: (payload: Omit<RegisterVehiclePayload, 'workshopId'>) =>
      registerVehicleAndOrder({ ...payload, workshopId: workshop!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      notes,
    }: {
      orderId: string
      status: ServiceOrderStatus
      notes: string | null
    }) => updateOrderStatus(orderId, status, notes),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] })
    },
  })
}
