import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkshop } from '@/features/admin/settings/hooks/useWorkshop'
import {
  fetchPreRegisteredClients,
  fetchLinkedClients,
  createClient,
  updateClient,
  deleteClient,
  type CreateClientPayload,
} from '../services/admin-clients-register.service'

const KEY        = (wid?: string) => ['admin', 'clients-pre',    wid]
const LINKED_KEY = (wid?: string) => ['admin', 'clients-linked', wid]

export function useLinkedClients() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: LINKED_KEY(workshop?.id),
    queryFn:  () => fetchLinkedClients(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function usePreRegisteredClients() {
  const { data: workshop } = useWorkshop()
  return useQuery({
    queryKey: KEY(workshop?.id),
    queryFn:  () => fetchPreRegisteredClients(workshop!.id),
    enabled:  !!workshop?.id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  const { data: workshop } = useWorkshop()
  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClient(workshop!.id, payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: KEY(workshop?.id) })
      qc.invalidateQueries({ queryKey: LINKED_KEY(workshop?.id) })
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  const { data: workshop } = useWorkshop()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<CreateClientPayload>) =>
      updateClient(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(workshop?.id) })
      qc.invalidateQueries({ queryKey: LINKED_KEY(workshop?.id) })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  const { data: workshop } = useWorkshop()
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: KEY(workshop?.id) })
      qc.invalidateQueries({ queryKey: LINKED_KEY(workshop?.id) })
    },
  })
}
