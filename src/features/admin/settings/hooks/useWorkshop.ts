import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import type { Workshop } from '@/types/database'

export function useWorkshop() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['workshop', 'mine'],
    queryFn: async (): Promise<Workshop> => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('owner_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useUpdateWorkshop() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id, name, slug, address, phone, cnpj, capacity,
    }: { id: string; name: string; slug: string; address?: string; phone?: string; cnpj?: string; capacity?: number }) => {
      const { data, error } = await supabase
        .from('workshops')
        .update({ name, slug, address: address || null, phone: phone || null, cnpj: cnpj || null, capacity: capacity ?? null })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop', 'mine'] })
    },
  })
}
