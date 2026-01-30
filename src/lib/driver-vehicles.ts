import { SupabaseClient } from '@supabase/supabase-js'
import { Vehicle, Driver, DriverVehicle, VehicleWithDetails } from '@/types'

/**
 * Načíta vozidlá priradené vodičovi
 */
export async function getVehiclesForDriver(
  supabase: SupabaseClient,
  driverId: string
): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('driver_vehicles')
    .select('vehicle:vehicles(*)')
    .eq('driver_id', driverId)

  if (error) {
    console.error('Error loading vehicles for driver:', error)
    return []
  }

  return (data || [])
    .map((row) => row.vehicle as unknown as Vehicle)
    .filter((v): v is Vehicle => v !== null && v !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Načíta ID vozidiel priradených vodičovi
 */
export async function getVehicleIdsForDriver(
  supabase: SupabaseClient,
  driverId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('driver_vehicles')
    .select('vehicle_id')
    .eq('driver_id', driverId)

  if (error) {
    console.error('Error loading vehicle IDs for driver:', error)
    return []
  }

  return (data || []).map((row) => row.vehicle_id)
}

/**
 * Načíta vodičov s prístupom k vozidlu
 */
export async function getDriversForVehicle(
  supabase: SupabaseClient,
  vehicleId: string
): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('driver_vehicles')
    .select('driver:drivers(*)')
    .eq('vehicle_id', vehicleId)

  if (error) {
    console.error('Error loading drivers for vehicle:', error)
    return []
  }

  return (data || [])
    .map((row) => row.driver as unknown as Driver)
    .filter((d): d is Driver => d !== null && d !== undefined)
    .sort((a, b) => a.last_name.localeCompare(b.last_name))
}

/**
 * Kontrola či má vodič prístup k vozidlu
 */
export async function canDriverAccessVehicle(
  supabase: SupabaseClient,
  driverId: string,
  vehicleId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('driver_vehicles')
    .select('id')
    .eq('driver_id', driverId)
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (error) {
    console.error('Error checking vehicle access:', error)
    return false
  }

  return data !== null
}

/**
 * Načíta počet priradených vozidiel pre vodiča
 */
export async function getAssignedVehicleCount(
  supabase: SupabaseClient,
  driverId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('driver_vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('driver_id', driverId)

  if (error) {
    console.error('Error counting assigned vehicles:', error)
    return 0
  }

  return count || 0
}

/**
 * Načíta existujúce priradenia vozidiel pre vodiča
 */
export async function getDriverVehicles(
  supabase: SupabaseClient,
  driverId: string
): Promise<DriverVehicle[]> {
  const { data, error } = await supabase
    .from('driver_vehicles')
    .select('*')
    .eq('driver_id', driverId)

  if (error) {
    console.error('Error loading driver vehicles:', error)
    return []
  }

  return data || []
}

/**
 * Uloží priradenia vozidiel pre vodiča (nahradí existujúce)
 */
export async function saveDriverVehicles(
  supabase: SupabaseClient,
  driverId: string,
  vehicleIds: string[],
  createdBy?: string
): Promise<{ success: boolean; error?: string }> {
  // Vymazať existujúce priradenia
  const { error: deleteError } = await supabase
    .from('driver_vehicles')
    .delete()
    .eq('driver_id', driverId)

  if (deleteError) {
    console.error('Error deleting driver vehicles:', deleteError)
    return { success: false, error: 'Nepodarilo sa vymazať existujúce priradenia' }
  }

  // Ak nie sú žiadne vozidlá, sme hotovi
  if (vehicleIds.length === 0) {
    return { success: true }
  }

  // Vložiť nové priradenia
  const insertData = vehicleIds.map((vehicleId) => ({
    driver_id: driverId,
    vehicle_id: vehicleId,
    created_by: createdBy || null,
  }))

  const { error: insertError } = await supabase
    .from('driver_vehicles')
    .insert(insertData)

  if (insertError) {
    console.error('Error inserting driver vehicles:', insertError)
    return { success: false, error: 'Nepodarilo sa uložiť priradenia vozidiel' }
  }

  return { success: true }
}

/**
 * Načíta vozidlá priradené vodičovi s detailmi (STK, EK, známky, tachometer)
 */
export async function getVehiclesWithDetails(
  supabase: SupabaseClient,
  driverId: string
): Promise<VehicleWithDetails[]> {
  // Načítaj priradené vozidlá
  const { data: driverVehicles } = await supabase
    .from('driver_vehicles')
    .select('vehicle_id')
    .eq('driver_id', driverId)

  if (!driverVehicles || driverVehicles.length === 0) {
    return []
  }

  const vehicleIds = driverVehicles.map(dv => dv.vehicle_id)

  // Načítaj vozidlá
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .in('id', vehicleIds)
    .order('name')

  if (!vehicles) return []

  // Pre každé vozidlo načítaj termíny
  const vehiclesWithDetails = await Promise.all(
    vehicles.map(async (vehicle) => {
      // Načítaj STK a EK
      const { data: inspections } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('valid_until', { ascending: false })

      // Načítaj diaľničné známky
      const { data: vignettes } = await supabase
        .from('vehicle_vignettes')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('valid_until', { ascending: true })

      // Načítaj posledný stav tachometra z jázd
      const { data: lastTrip } = await supabase
        .from('trips')
        .select('odometer_end')
        .eq('vehicle_id', vehicle.id)
        .not('odometer_end', 'is', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const stk = inspections?.find(i => i.inspection_type === 'stk') || null
      const ek = inspections?.find(i => i.inspection_type === 'ek') || null

      return {
        ...vehicle,
        currentOdometer: lastTrip?.odometer_end || vehicle.initial_odometer || 0,
        stk,
        ek,
        vignettes: vignettes || []
      } as VehicleWithDetails
    })
  )

  return vehiclesWithDetails
}
