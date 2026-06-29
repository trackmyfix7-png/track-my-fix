import { useQuery } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import { fetchWorkshopClientsWithStats } from '../services/admin-clients.service'

export function useWorkshopClientsWithStats() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: ['admin', 'clients-stats', workshop?.id],
    queryFn:  () => fetchWorkshopClientsWithStats(workshop!.id),
    enabled:  !!workshop?.id,
  })
}
