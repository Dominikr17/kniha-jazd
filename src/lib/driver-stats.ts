import { SupabaseClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format, eachMonthOfInterval } from 'date-fns'
import { sk } from 'date-fns/locale'
import { getVehicleIdsForDriver, getVehiclesForDriver } from './driver-vehicles'
import { Trip, FuelRecord, Vehicle } from '@/types'

export type StatsPeriod = 'this_month' | 'this_year' | 'last_12_months'

export interface DateRange {
  from: Date
  to: Date
}

export interface DriverStats {
  totalKm: number
  tripCount: number
  averageConsumption: number | null
  kmPerTrip: number
}

export interface MonthlyKm {
  month: string
  km: number
}

export interface VehicleConsumption {
  vehicleId: string
  vehicleName: string
  licensePlate: string
  consumption: number | null
  ratedConsumption: number | null
  status: 'ok' | 'warning' | 'over'
  totalKm: number
  totalLiters: number
}

export interface RecentTrip {
  id: string
  date: string
  routeFrom: string
  routeTo: string
  distance: number
  vehicleName: string
}

/**
 * Vráti dátumový rozsah pre dané obdobie
 */
export function getDateRange(period: StatsPeriod): DateRange {
  const now = new Date()

  switch (period) {
    case 'this_month':
      return {
        from: startOfMonth(now),
        to: endOfMonth(now)
      }
    case 'this_year':
      return {
        from: startOfYear(now),
        to: endOfYear(now)
      }
    case 'last_12_months':
      return {
        from: startOfMonth(subMonths(now, 11)),
        to: endOfMonth(now)
      }
  }
}

/**
 * Načíta základné štatistiky vodiča
 */
export async function getDriverStats(
  supabase: SupabaseClient,
  driverId: string,
  period: StatsPeriod
): Promise<DriverStats> {
  const { from, to } = getDateRange(period)
  const vehicleIds = await getVehicleIdsForDriver(supabase, driverId)

  if (vehicleIds.length === 0) {
    return { totalKm: 0, tripCount: 0, averageConsumption: null, kmPerTrip: 0 }
  }

  // Načítaj jazdy vodiča za dané obdobie
  const { data: trips } = await supabase
    .from('trips')
    .select('distance')
    .eq('driver_id', driverId)
    .in('vehicle_id', vehicleIds)
    .gte('date', format(from, 'yyyy-MM-dd'))
    .lte('date', format(to, 'yyyy-MM-dd'))

  // Načítaj tankovania vodiča za dané obdobie
  const { data: fuelRecords } = await supabase
    .from('fuel_records')
    .select('liters')
    .eq('driver_id', driverId)
    .in('vehicle_id', vehicleIds)
    .gte('date', format(from, 'yyyy-MM-dd'))
    .lte('date', format(to, 'yyyy-MM-dd'))

  const totalKm = (trips || []).reduce((sum, trip) => sum + (trip.distance || 0), 0)
  const tripCount = trips?.length || 0
  const totalLiters = (fuelRecords || []).reduce((sum, record) => sum + record.liters, 0)

  const averageConsumption = totalKm > 0 && totalLiters > 0
    ? (totalLiters / totalKm) * 100
    : null

  const kmPerTrip = tripCount > 0 ? totalKm / tripCount : 0

  return {
    totalKm,
    tripCount,
    averageConsumption,
    kmPerTrip
  }
}

/**
 * Načíta mesačné kilometre pre graf
 */
export async function getMonthlyKm(
  supabase: SupabaseClient,
  driverId: string,
  period: StatsPeriod
): Promise<MonthlyKm[]> {
  const { from, to } = getDateRange(period)
  const vehicleIds = await getVehicleIdsForDriver(supabase, driverId)

  if (vehicleIds.length === 0) {
    return []
  }

  // Načítaj všetky jazdy za obdobie
  const { data: trips } = await supabase
    .from('trips')
    .select('date, distance')
    .eq('driver_id', driverId)
    .in('vehicle_id', vehicleIds)
    .gte('date', format(from, 'yyyy-MM-dd'))
    .lte('date', format(to, 'yyyy-MM-dd'))
    .order('date')

  // Vytvor zoznam všetkých mesiacov v období
  const months = eachMonthOfInterval({ start: from, end: to })

  // Agreguj km podľa mesiaca
  const monthlyData = months.map(monthDate => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    const monthTrips = (trips || []).filter(trip => {
      const tripDate = new Date(trip.date)
      return tripDate >= monthStart && tripDate <= monthEnd
    })

    const km = monthTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0)

    return {
      month: format(monthDate, 'MMM yyyy', { locale: sk }),
      km
    }
  })

  return monthlyData
}

/**
 * Načíta spotrebu podľa vozidla
 */
export async function getConsumptionByVehicle(
  supabase: SupabaseClient,
  driverId: string,
  period: StatsPeriod
): Promise<VehicleConsumption[]> {
  const { from, to } = getDateRange(period)
  const vehicles = await getVehiclesForDriver(supabase, driverId)

  if (vehicles.length === 0) {
    return []
  }

  const vehicleIds = vehicles.map(v => v.id)

  // Načítaj jazdy za obdobie
  const { data: trips } = await supabase
    .from('trips')
    .select('vehicle_id, distance')
    .eq('driver_id', driverId)
    .in('vehicle_id', vehicleIds)
    .gte('date', format(from, 'yyyy-MM-dd'))
    .lte('date', format(to, 'yyyy-MM-dd'))

  // Načítaj tankovania za obdobie
  const { data: fuelRecords } = await supabase
    .from('fuel_records')
    .select('vehicle_id, liters')
    .eq('driver_id', driverId)
    .in('vehicle_id', vehicleIds)
    .gte('date', format(from, 'yyyy-MM-dd'))
    .lte('date', format(to, 'yyyy-MM-dd'))

  // Agreguj podľa vozidla
  return vehicles.map(vehicle => {
    const vehicleTrips = (trips || []).filter(t => t.vehicle_id === vehicle.id)
    const vehicleFuel = (fuelRecords || []).filter(f => f.vehicle_id === vehicle.id)

    const totalKm = vehicleTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0)
    const totalLiters = vehicleFuel.reduce((sum, record) => sum + record.liters, 0)

    const consumption = totalKm > 0 && totalLiters > 0
      ? (totalLiters / totalKm) * 100
      : null

    const ratedConsumption = vehicle.rated_consumption
    const toleranceLimit = ratedConsumption ? ratedConsumption * 1.2 : null

    let status: 'ok' | 'warning' | 'over' = 'ok'
    if (consumption !== null && ratedConsumption !== null && toleranceLimit !== null) {
      if (consumption > toleranceLimit) {
        status = 'over'
      } else if (consumption > ratedConsumption) {
        status = 'warning'
      }
    }

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      licensePlate: vehicle.license_plate,
      consumption,
      ratedConsumption,
      status,
      totalKm,
      totalLiters
    }
  }).filter(v => v.totalKm > 0 || v.totalLiters > 0)
}

/**
 * Načíta posledné jazdy vodiča
 */
export async function getRecentTrips(
  supabase: SupabaseClient,
  driverId: string,
  limit: number = 5
): Promise<RecentTrip[]> {
  const vehicleIds = await getVehicleIdsForDriver(supabase, driverId)

  if (vehicleIds.length === 0) {
    return []
  }

  const { data: trips } = await supabase
    .from('trips')
    .select('id, date, route_from, route_to, distance, vehicle:vehicles(name)')
    .eq('driver_id', driverId)
    .in('vehicle_id', vehicleIds)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  return (trips || []).map(trip => ({
    id: trip.id,
    date: trip.date,
    routeFrom: trip.route_from,
    routeTo: trip.route_to,
    distance: trip.distance || 0,
    vehicleName: (trip.vehicle as unknown as Vehicle)?.name || ''
  }))
}

/**
 * Validácia period parametra
 */
export function isValidPeriod(period: string | null): period is StatsPeriod {
  return period === 'this_month' || period === 'this_year' || period === 'last_12_months'
}
