import { createClient } from '@/lib/supabase/server'
import { FuelStockCalculation, FuelInventory, Vehicle } from '@/types'
import { getLocalDateString } from '@/lib/utils'

// Koeficient navýšenia normovanej spotreby (1.2 = 20% rezerva)
const CONSUMPTION_COEFFICIENT = 1.2

interface CalculateFuelStockParams {
  vehicleId: string
  targetDate: string  // ISO date string (YYYY-MM-DD)
}

/**
 * Vypočíta stav nádrže k danému dátumu
 * Princíp: Posledný referenčný bod + Natankované - Spotrebované
 * Spotrebované = Najazdené km × Normovaná spotreba × 1.2 / 100
 */
export async function calculateFuelStock(params: CalculateFuelStockParams): Promise<{
  fuelStock: number
  isEstimate: boolean
  referenceDate: string | null
  referenceSource: string | null
  warning: string | null
}> {
  const { vehicleId, targetDate } = params
  const supabase = await createClient()

  // Načítanie vozidla
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) {
    return {
      fuelStock: 0,
      isEstimate: true,
      referenceDate: null,
      referenceSource: null,
      warning: 'Vozidlo nebolo nájdené'
    }
  }

  // Nájsť posledný referenčný bod pred alebo v cieľovom dátume
  const { data: lastReference } = await supabase
    .from('fuel_inventory')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .lte('date', targetDate)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (!lastReference) {
    return {
      fuelStock: 0,
      isEstimate: true,
      referenceDate: null,
      referenceSource: null,
      warning: 'Chýba referenčný bod (počiatočný stav alebo tankovanie do plna)'
    }
  }

  // Získať tankovania od referenčného bodu do cieľového dátumu
  const { data: fuelRecords } = await supabase
    .from('fuel_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gt('date', lastReference.date)
    .lte('date', targetDate)

  const totalRefueled = (fuelRecords || []).reduce((sum, r) => sum + Number(r.liters), 0)

  // Získať jazdy od referenčného bodu do cieľového dátumu
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gt('date', lastReference.date)
    .lte('date', targetDate)

  const totalKm = (trips || []).reduce((sum, t) => sum + (t.distance || 0), 0)

  // Výpočet spotrebovaného paliva
  const ratedConsumption = vehicle.rated_consumption || 0
  const consumedFuel = (totalKm * ratedConsumption * CONSUMPTION_COEFFICIENT) / 100

  // Výpočet stavu nádrže
  let fuelStock = Number(lastReference.fuel_amount) + totalRefueled - consumedFuel

  // Zabrániť záporným hodnotám
  if (fuelStock < 0) {
    fuelStock = 0
  }

  // Zabrániť prekročeniu kapacity nádrže
  if (vehicle.tank_capacity && fuelStock > vehicle.tank_capacity) {
    fuelStock = vehicle.tank_capacity
  }

  return {
    fuelStock: Math.round(fuelStock * 100) / 100,
    isEstimate: false,
    referenceDate: lastReference.date,
    referenceSource: lastReference.source,
    warning: ratedConsumption === 0
      ? 'Vozidlo nemá nastavenú normovanú spotrebu - výpočet neberie do úvahy spotrebu'
      : null
  }
}

interface CalculateMonthlyParams {
  vehicleId: string
  year: number
  month: number
}

/**
 * Vypočíta počiatočný a konečný stav nádrže pre daný mesiac
 */
export async function calculateMonthlyFuelStocks(params: CalculateMonthlyParams): Promise<FuelStockCalculation> {
  const { vehicleId, year, month } = params
  const supabase = await createClient()

  const warnings: string[] = []

  // Načítanie vozidla
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) {
    return {
      initialFuelStock: 0,
      finalFuelStock: 0,
      isEstimate: true,
      hasReferencePoint: false,
      referenceDate: null,
      referenceSource: null,
      tankCapacity: null,
      ratedConsumption: null,
      totalKm: 0,
      totalRefueled: 0,
      warnings: [],
      error: 'Vozidlo nebolo nájdené'
    }
  }

  // Kontrola či má vozidlo potrebné údaje
  if (!vehicle.tank_capacity) {
    warnings.push('Vozidlo nemá nastavený objem nádrže')
  }
  if (!vehicle.rated_consumption) {
    warnings.push('Vozidlo nemá nastavenú normovanú spotrebu')
  }

  // Dátumy
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDayOfMonth = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
  const dayBeforeStart = getLocalDateString(new Date(year, month - 1, 0))

  // Nájsť posledný referenčný bod pred alebo na začiatku mesiaca
  const { data: initialReference } = await supabase
    .from('fuel_inventory')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .lte('date', dayBeforeStart)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // Nájsť posledný referenčný bod pred alebo na konci mesiaca
  const { data: finalReference } = await supabase
    .from('fuel_inventory')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // Tankovania v mesiaci
  const { data: fuelRecords } = await supabase
    .from('fuel_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('date', startDate)
    .lte('date', endDate)

  const totalRefueled = (fuelRecords || []).reduce((sum, r) => sum + Number(r.liters), 0)

  // Jazdy v mesiaci
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('date', startDate)
    .lte('date', endDate)

  const totalKm = (trips || []).reduce((sum, t) => sum + (t.distance || 0), 0)

  // Ak nemáme žiadny referenčný bod
  if (!initialReference && !finalReference) {
    return {
      initialFuelStock: 0,
      finalFuelStock: 0,
      isEstimate: true,
      hasReferencePoint: false,
      referenceDate: null,
      referenceSource: null,
      tankCapacity: vehicle.tank_capacity,
      ratedConsumption: vehicle.rated_consumption,
      totalKm,
      totalRefueled,
      warnings: ['Chýba referenčný bod - zadajte počiatočný stav alebo tankovanie do plna'],
      error: null
    }
  }

  // Výpočet počiatočného stavu (stav na konci predchádzajúceho dňa)
  const initialResult = await calculateFuelStock({
    vehicleId,
    targetDate: dayBeforeStart
  })

  // Výpočet konečného stavu
  const finalResult = await calculateFuelStock({
    vehicleId,
    targetDate: endDate
  })

  if (initialResult.warning) {
    warnings.push(initialResult.warning)
  }

  // Kontrola zápornej hodnoty
  if (finalResult.fuelStock < 0) {
    warnings.push('Vypočítaný konečný stav je záporný - skontrolujte údaje o jazdách a tankovaniach')
  }

  return {
    initialFuelStock: initialResult.fuelStock,
    finalFuelStock: finalResult.fuelStock,
    isEstimate: initialResult.isEstimate || finalResult.isEstimate,
    hasReferencePoint: !!initialReference || !!finalReference,
    referenceDate: finalResult.referenceDate,
    referenceSource: finalResult.referenceSource as FuelStockCalculation['referenceSource'],
    tankCapacity: vehicle.tank_capacity,
    ratedConsumption: vehicle.rated_consumption,
    totalKm,
    totalRefueled,
    warnings,
    error: null
  }
}

/**
 * Overí či má vozidlo potrebné údaje pre automatický výpočet stavu nádrže
 */
export function canCalculateFuelStock(vehicle: Vehicle): {
  canCalculate: boolean
  missingFields: string[]
} {
  const missingFields: string[] = []

  if (!vehicle.tank_capacity) {
    missingFields.push('objem nádrže')
  }
  if (!vehicle.rated_consumption) {
    missingFields.push('normovaná spotreba')
  }

  return {
    canCalculate: missingFields.length === 0,
    missingFields
  }
}

interface CreateFuelInventoryParams {
  vehicleId: string
  date: string
  fuelAmount: number
  source: 'initial' | 'full_tank' | 'manual_correction'
  fuelRecordId?: string
  notes?: string
}

/**
 * Vytvorí nový záznam v fuel_inventory
 */
export async function createFuelInventory(params: CreateFuelInventoryParams): Promise<{
  success: boolean
  data?: FuelInventory
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fuel_inventory')
    .insert({
      vehicle_id: params.vehicleId,
      date: params.date,
      fuel_amount: params.fuelAmount,
      source: params.source,
      fuel_record_id: params.fuelRecordId || null,
      notes: params.notes || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating fuel inventory:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Spracuje tankovanie s príznakom "plná nádrž"
 * Vytvorí záznam v fuel_inventory s aktuálnou kapacitou nádrže
 */
export async function handleFullTankRefuel(params: {
  vehicleId: string
  fuelRecordId: string
  date: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Načítanie kapacity nádrže vozidla
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('tank_capacity')
    .eq('id', params.vehicleId)
    .single()

  if (!vehicle?.tank_capacity) {
    return {
      success: false,
      error: 'Vozidlo nemá nastavenú kapacitu nádrže'
    }
  }

  return createFuelInventory({
    vehicleId: params.vehicleId,
    date: params.date,
    fuelAmount: vehicle.tank_capacity,
    source: 'full_tank',
    fuelRecordId: params.fuelRecordId
  })
}
