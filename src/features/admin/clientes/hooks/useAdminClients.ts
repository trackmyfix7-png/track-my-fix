import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { fetchWorkshopClientsWithStats, revokeClientAccess } from '../services/admin-clients.service'

const STATS_KEY = (wid?: string) => ['admin', 'clients-stats', wid]

export function useWorkshopClientsWithStats() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: STATS_KEY(workshop?.id),
    queryFn:  () => fetchWorkshopClientsWithStats(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useRevokeClientAccess() {
  const qc = useQueryClient()
  const { data: workshop } = useWorkshop()
  return useMutation({
    mutationFn: (clientId: string) => revokeClientAccess(workshop!.id, clientId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: STATS_KEY(workshop?.id) }),
  })
}
