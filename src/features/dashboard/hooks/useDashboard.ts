import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardSummary,
  fetchActiveServiceOrders,
  fetchRecentHistory,
} from '../services/dashboard.service'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  })
}

export function useActiveServiceOrders() {
  return useQuery({
    queryKey: ['dashboard', 'active-orders'],
    queryFn: fetchActiveServiceOrders,
  })
}

export function useRecentHistory() {
  return useQuery({
    queryKey: ['dashboard', 'recent-history'],
    queryFn: fetchRecentHistory,
  })
}
