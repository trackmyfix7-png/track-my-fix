import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Workshop } from '@/types/database'
import {
  fetchWorkshopActiveOrders,
  fetchOrderDetail,
  updateOrderStatus,
} from '@/features/admin/veiculos/services/admin-vehicles.service'
import type { ServiceOrderStatus } from '@/types/database'

// ─── Workshop do funcionário ──────────────────────────────────────────────────

async function fetchEmployeeWorkshop(): Promise<Workshop | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('workshop_employees')
    .select('workshop:workshops(*)')
    .eq('employee_id', session.user.id)
    .maybeSingle()

  if (error) throw error
  return (data as any)?.workshop ?? null
}

export function useEmployeeWorkshop() {
  return useQuery({
    queryKey: ['employee', 'workshop'],
    queryFn:  fetchEmployeeWorkshop,
  })
}

// ─── Ordens da oficina ────────────────────────────────────────────────────────

export function useEmployeeOrders() {
  const { data: workshop } = useEmployeeWorkshop()
  return useQuery({
    queryKey: ['employee', 'orders', workshop?.id],
    queryFn:  () => fetchWorkshopActiveOrders(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

// ─── Detalhe da ordem ────────────────────────────────────────────────────────

export function useEmployeeOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['employee', 'order', orderId],
    queryFn:  () => fetchOrderDetail(orderId),
    enabled:  !!orderId,
  })
}

// ─── Atualizar status ─────────────────────────────────────────────────────────

export function useEmployeeUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      notes,
    }: {
      orderId: string
      status:  ServiceOrderStatus
      notes:   string | null
    }) => updateOrderStatus(orderId, status, notes),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['employee', 'order', orderId] })
    },
  })
}
