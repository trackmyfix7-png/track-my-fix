import { supabase } from '@/lib/supabase'
import type { Vehicle, ServiceOrder } from '@/types/database'
import type { VehicleFormData } from '../schemas/vehicleSchema'

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function fetchVehicleHistory(vehicleId: string): Promise<ServiceOrder[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*, vehicle:vehicles(*)')
    .eq('vehicle_id', vehicleId)
    .order('entry_date', { ascending: false })

  if (error) throw error
  return data
}

export async function createVehicle(
  formData: VehicleFormData,
  photo?: File | null
): Promise<Vehicle> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert({
      owner_id: session.user.id,
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      plate: formData.plate,
      color: formData.color || null,
      mileage: formData.mileage ?? null,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) throw error

  if (photo) {
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const path = `${session.user.id}/${vehicle.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('vehicle-photos')
      .upload(path, photo, { upsert: true })

    if (uploadError) {
      console.error('[Vehicle] Upload da foto falhou:', uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ photo_url: publicUrl })
        .eq('id', vehicle.id)

      if (updateError) {
        console.error('[Vehicle] Update de photo_url falhou:', updateError.message)
      } else {
        // Re-fetch para retornar o registro atualizado
        const { data: updated } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicle.id)
          .single()
        if (updated) return updated
      }
    }
  }

  return vehicle
}
