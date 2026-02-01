import { SupabaseClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format, eachMonthOfInterval } from 'date-fns'
import { sk } from 'date-fns/locale'
import { getVehicleIdsForDriver, getVehiclesForDriver } from './driver-vehicles'
import { Vehicle } from '@/types'

const DATE_FORMAT = 'yyyy-MM-dd'
const TOLERANCE_MULTIPLIER = 1.2

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
 * Vypočíta priemernú spotrebu v l/100km
 */
function calculateConsumption(totalLiters: number, totalKm: number): number | null {
  if (totalKm <= 0 || totalLiters <= 0) return null
  return (totalLiters / totalKm) * 100
}

/**
 * Formátuje dátum pre DB query
 */
function formatDateForQuery(date: Date): string {
  return format(date, DATE_FORMAT)
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

const EMPTY_STATS: DriverStats = { totalKm: 0, tripCount: 0, averageConsumption: null, kmPerTrip: 0 }

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
    return EMPTY_STATS
  }

  const dateFrom = formatDateForQuery(from)
  const dateTo = formatDateForQuery(to)

  const [{ data: trips }, { data: fuelRecords }] = await Promise.all([
    supabase
      .from('trips')
      .select('distance')
      .eq('driver_id', driverId)
      .in('vehicle_id', vehicleIds)
      .gte('date', dateFrom)
      .lte('date', dateTo),
    supabase
      .from('fuel_records')
      .select('liters')
      .eq('driver_id', driverId)
      .in('vehicle_id', vehicleIds)
      .gte('date', dateFrom)
      .lte('date', dateTo)
  ])

  const totalKm = (trips || []).reduce((sum, trip) => sum + (trip.distance || 0), 0)
  const tripCount = trips?.length || 0
  const totalLiters = (fuelRecords || []).reduce((sum, fuelRecord) => sum + fuelRecord.liters, 0)

  return {
    totalKm,
    tripCount,
    averageConsumption: calculateConsumption(totalLiters, totalKm),
    kmPerTrip: tripCount > 0 ? totalKm / tripCount : 0
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

  const { data: trips } = await supabase
    .from('trips')
    .select('date, distance')
    .eq('driver_id', driverId)
    .in('vehicle_id', vehicleIds)
    .gte('date', formatDateForQuery(from))
    .lte('date', formatDateForQuery(to))
    .order('date')

  const monthsInPeriod = eachMonthOfInterval({ start: from, end: to })

  return monthsInPeriod.map(monthDate => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    const tripsInMonth = (trips || []).filter(trip => {
      const tripDate = new Date(trip.date)
      return tripDate >= monthStart && tripDate <= monthEnd
    })

    return {
      month: format(monthDate, 'MMM yyyy', { locale: sk }),
      km: tripsInMonth.reduce((sum, trip) => sum + (trip.distance || 0), 0)
    }
  })
}

/**
 * Určí status spotreby voči norme
 */
function getConsumptionStatus(
  consumption: number | null,
  ratedConsumption: number | null
): 'ok' | 'warning' | 'over' {
  if (consumption === null || ratedConsumption === null) return 'ok'

  const toleranceLimit = ratedConsumption * TOLERANCE_MULTIPLIER
  if (consumption > toleranceLimit) return 'over'
  if (consumption > ratedConsumption) return 'warning'
  return 'ok'
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

  const vehicleIds = vehicles.map(vehicle => vehicle.id)
  const dateFrom = formatDateForQuery(from)
  const dateTo = formatDateForQuery(to)

  const [{ data: trips }, { data: fuelRecords }] = await Promise.all([
    supabase
      .from('trips')
      .select('vehicle_id, distance')
      .eq('driver_id', driverId)
      .in('vehicle_id', vehicleIds)
      .gte('date', dateFrom)
      .lte('date', dateTo),
    supabase
      .from('fuel_records')
      .select('vehicle_id, liters')
      .eq('driver_id', driverId)
      .in('vehicle_id', vehicleIds)
      .gte('date', dateFrom)
      .lte('date', dateTo)
  ])

  return vehicles
    .map(vehicle => {
      const vehicleTrips = (trips || []).filter(trip => trip.vehicle_id === vehicle.id)
      const vehicleFuelRecords = (fuelRecords || []).filter(fuelRecord => fuelRecord.vehicle_id === vehicle.id)

      const totalKm = vehicleTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0)
      const totalLiters = vehicleFuelRecords.reduce((sum, fuelRecord) => sum + fuelRecord.liters, 0)
      const consumption = calculateConsumption(totalLiters, totalKm)

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        licensePlate: vehicle.license_plate,
        consumption,
        ratedConsumption: vehicle.rated_consumption,
        status: getConsumptionStatus(consumption, vehicle.rated_consumption),
        totalKm,
        totalLiters
      }
    })
    .filter(vehicleStats => vehicleStats.totalKm > 0 || vehicleStats.totalLiters > 0)
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
