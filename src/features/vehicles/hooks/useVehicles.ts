import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchVehicles,
  fetchVehicleById,
  fetchVehicleHistory,
  createVehicle,
} from '../services/vehicles.service'
import type { VehicleFormData } from '../schemas/vehicleSchema'

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => fetchVehicleById(id),
    enabled: !!id,
  })
}

export function useVehicleHistory(vehicleId: string) {
  return useQuery({
    queryKey: ['vehicles', vehicleId, 'history'],
    queryFn: () => fetchVehicleHistory(vehicleId),
    enabled: !!vehicleId,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ formData, photo }: { formData: VehicleFormData; photo?: File | null }) =>
      createVehicle(formData, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
