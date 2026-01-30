import { Trip, FuelRecord, Vehicle, Driver } from '@/types'

/**
 * Vypočíta priemernú spotrebu paliva z fuel records (l/100km)
 */
export function calculateAvgConsumption(
  fuelRecords: FuelRecord[],
  vehicleId?: string
): number {
  const records = vehicleId
    ? fuelRecords.filter(f => f.vehicle_id === vehicleId && f.odometer !== null)
    : fuelRecords.filter(f => f.odometer !== null)

  if (records.length < 2) return 0

  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let totalLiters = 0
  let totalDistance = 0

  for (let i = 1; i < sorted.length; i++) {
    const currentOdometer = sorted[i].odometer
    const prevOdometer = sorted[i - 1].odometer
    if (currentOdometer !== null && prevOdometer !== null) {
      const distance = currentOdometer - prevOdometer
      if (distance > 0) {
        totalDistance += distance
        totalLiters += Number(sorted[i].liters)
      }
    }
  }

  return totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0
}

/**
 * Vypočíta náklady na kilometer
 */
export function calculateCostPerKm(
  totalCost: number,
  totalDistance: number
): number {
  return totalDistance > 0 ? totalCost / totalDistance : 0
}

/**
 * Získa status spotreby v porovnaní s normou
 */
export function getConsumptionStatus(
  actual: number,
  rated: number | null
): 'excellent' | 'good' | 'warning' | 'critical' | 'unknown' {
  if (!rated || actual === 0) return 'unknown'

  const tolerance = rated * 0.2 // 20% tolerancia
  const limit = rated + tolerance

  if (actual <= rated) return 'excellent'
  if (actual <= rated * 1.1) return 'good' // do 10% nad normu
  if (actual <= limit) return 'warning' // 10-20% nad normu
  return 'critical' // nad 20% normu
}

/**
 * Vypočíta percentuálnu zmenu
 */
export function calculatePercentChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

/**
 * Agreguje dáta pre vozidlo
 */
export interface VehicleStats {
  vehicleId: string
  vehicleName: string
  licensePlate: string
  totalDistance: number
  totalFuelCost: number
  totalLiters: number
  tripCount: number
  avgConsumption: number
  costPerKm: number
  ratedConsumption: number | null
}

export function aggregateVehicleStats(
  vehicle: Vehicle,
  trips: Trip[],
  fuelRecords: FuelRecord[]
): VehicleStats {
  const vehicleTrips = trips.filter(t => t.vehicle_id === vehicle.id)
  const vehicleFuel = fuelRecords.filter(f => f.vehicle_id === vehicle.id)

  const totalDistance = vehicleTrips.reduce((sum, t) => sum + (t.distance || 0), 0)
  const totalFuelCost = vehicleFuel.reduce((sum, f) => sum + Number(f.total_price), 0)
  const totalLiters = vehicleFuel.reduce((sum, f) => sum + Number(f.liters), 0)
  const avgConsumption = calculateAvgConsumption(fuelRecords, vehicle.id)

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    licensePlate: vehicle.license_plate,
    totalDistance,
    totalFuelCost,
    totalLiters,
    tripCount: vehicleTrips.length,
    avgConsumption,
    costPerKm: calculateCostPerKm(totalFuelCost, totalDistance),
    ratedConsumption: vehicle.rated_consumption,
  }
}

/**
 * Agreguje dáta pre vodiča
 */
export interface DriverStats {
  driverId: string
  driverName: string
  totalDistance: number
  tripCount: number
  fuelRefueledLiters: number
  fuelCost: number
  avgConsumption: number
  vehicles: string[]
}

export function aggregateDriverStats(
  driver: Driver,
  trips: Trip[],
  fuelRecords: FuelRecord[],
  vehicles: Vehicle[]
): DriverStats {
  const driverTrips = trips.filter(t => t.driver_id === driver.id)
  const driverFuel = fuelRecords.filter(f => f.driver_id === driver.id)

  const totalDistance = driverTrips.reduce((sum, t) => sum + (t.distance || 0), 0)
  const fuelRefueledLiters = driverFuel.reduce((sum, f) => sum + Number(f.liters), 0)
  const fuelCost = driverFuel.reduce((sum, f) => sum + Number(f.total_price), 0)

  // Unikátne vozidlá
  const vehicleIds = new Set(driverTrips.map(t => t.vehicle_id))
  const vehicleNames = [...vehicleIds]
    .map(id => vehicles.find(v => v.id === id)?.name)
    .filter(Boolean) as string[]

  // Priemerná spotreba z vozidiel, ktoré vodič použil
  let avgConsumption = 0
  if (vehicleIds.size > 0) {
    const consumptions = [...vehicleIds]
      .map(id => calculateAvgConsumption(fuelRecords.filter(f => vehicleIds.has(f.vehicle_id)), id))
      .filter(c => c > 0)
    avgConsumption = consumptions.length > 0
      ? consumptions.reduce((a, b) => a + b, 0) / consumptions.length
      : 0
  }

  return {
    driverId: driver.id,
    driverName: `${driver.first_name} ${driver.last_name}`,
    totalDistance,
    tripCount: driverTrips.length,
    fuelRefueledLiters,
    fuelCost,
    avgConsumption,
    vehicles: vehicleNames,
  }
}

/**
 * Nájde min a max hodnoty v datasete
 */
export function findMinMax<T>(
  data: T[],
  getValue: (item: T) => number
): { min: T | null; max: T | null; minValue: number; maxValue: number } {
  if (data.length === 0) {
    return { min: null, max: null, minValue: 0, maxValue: 0 }
  }

  let min = data[0]
  let max = data[0]
  let minValue = getValue(data[0])
  let maxValue = getValue(data[0])

  for (const item of data) {
    const value = getValue(item)
    if (value < minValue) {
      min = item
      minValue = value
    }
    if (value > maxValue) {
      max = item
      maxValue = value
    }
  }

  return { min, max, minValue, maxValue }
}

/**
 * Formátuje číslo pre SK locale
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('sk-SK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Formátuje menu EUR
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
