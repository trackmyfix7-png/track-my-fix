import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createServiceRequest,
  fetchPendingServiceRequests,
} from '../services/service-requests.service'

export function usePendingServiceRequests() {
  return useQuery({
    queryKey: ['service-requests', 'pending'],
    queryFn: fetchPendingServiceRequests,
  })
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    },
  })
}
