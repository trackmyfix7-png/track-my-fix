import { supabase } from '@/lib/supabase'
import type { ServiceRequest } from '@/types/database'

export interface CreateServiceRequestPayload {
  vehicle_id: string
  category: string
  problem_description: string
  service_id?: string
  images?: File[]
}

export async function fetchPendingServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*)')
    .in('status', ['pending', 'analyzing'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function getClientWorkshopId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('client_workshops')
    .select('workshop_id')
    .eq('client_id', userId)
    .order('linked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Nenhuma oficina vinculada à sua conta.')
  return data.workshop_id
}

export async function createServiceRequest(
  payload: CreateServiceRequestPayload
): Promise<ServiceRequest> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Usuário não autenticado')

  const workshopId = await getClientWorkshopId(session.user.id)

  const { data: request, error } = await supabase
    .from('service_requests')
    .insert({
      owner_id:            session.user.id,
      vehicle_id:          payload.vehicle_id,
      category:            payload.category,
      problem_description: payload.problem_description,
      workshop_id:         workshopId,
      ...(payload.service_id ? { service_id: payload.service_id } : {}),
    })
    .select('*, vehicle:vehicles(*)')
    .single()

  if (error) throw error

  if (payload.images?.length) {
    await Promise.all(
      payload.images.map(async (file, index) => {
        const ext  = file.name.split('.').pop() ?? 'jpg'
        const path = `${session.user.id}/${request.id}/${index + 1}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('service-requests')
          .upload(path, file, { upsert: false })

        if (uploadError) return

        await supabase.from('service_request_images').insert({
          request_id:   request.id,
          storage_path: path,
        })
      })
    )
  }

  return request
}
