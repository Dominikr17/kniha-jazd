import { createClient } from '@/lib/supabase/server'
import { MonthlyReport, MonthlyReportData, ReportStatus } from '@/types'

interface CalculateParams {
  vehicleId: string
  year: number
  month: number
}

export async function calculateMonthlyReportData(params: CalculateParams): Promise<MonthlyReportData | null> {
  const { vehicleId, year, month } = params
  const supabase = await createClient()

  // Načítanie vozidla s zodpovedným vodičom
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select(`
      *,
      responsible_driver:drivers(id, first_name, last_name)
    `)
    .eq('id', vehicleId)
    .single()

  if (!vehicle) return null

  // Dátumy pre filtrovanie
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Posledný deň mesiaca

  // Načítanie jázd za mesiac
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  // Načítanie tankovaní za mesiac
  const { data: fuelRecords } = await supabase
    .from('fuel_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('date', startDate)
    .lte('date', endDate)

  // Načítanie existujúceho výkazu (ak existuje)
  const { data: existingReport } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('year', year)
    .eq('month', month)
    .single()

  // Výpočet km podľa typu
  const kmBusiness = (trips || [])
    .filter(t => t.trip_type === 'sluzobna')
    .reduce((sum, t) => sum + (t.distance || 0), 0)

  const kmPrivate = (trips || [])
    .filter(t => t.trip_type === 'sukromna')
    .reduce((sum, t) => sum + (t.distance || 0), 0)

  const kmTotal = kmBusiness + kmPrivate

  // Tachometer - prvá a posledná jazda
  const firstTrip = trips && trips.length > 0 ? trips[0] : null
  const lastTrip = trips && trips.length > 0 ? trips[trips.length - 1] : null

  const initialOdometer = existingReport?.initial_odometer ||
    firstTrip?.odometer_start ||
    vehicle.initial_odometer ||
    0

  const finalOdometer = existingReport?.final_odometer ||
    lastTrip?.odometer_end ||
    initialOdometer

  // Nákup PHM
  const domesticRecords = (fuelRecords || []).filter(r => r.country === 'SK')
  const foreignRecords = (fuelRecords || []).filter(r => r.country !== 'SK')

  const fuelPurchaseDomestic = domesticRecords.reduce((sum, r) => sum + Number(r.liters), 0)
  const fuelPurchaseForeign = foreignRecords.reduce((sum, r) => sum + Number(r.liters), 0)
  const fuelPurchaseTotal = fuelPurchaseDomestic + fuelPurchaseForeign

  const fuelCostDomestic = domesticRecords.reduce((sum, r) => sum + Number(r.total_price), 0)
  const fuelCostForeign = foreignRecords.reduce((sum, r) => sum + Number(r.total_price), 0)
  const fuelCostTotal = fuelCostDomestic + fuelCostForeign

  // Zásoby PHM (z existujúceho výkazu alebo default 0)
  const initialFuelStock = existingReport?.initial_fuel_stock || 0
  const finalFuelStock = existingReport?.final_fuel_stock || 0

  // Spotreba = počiatočná zásoba + nákup - konečná zásoba
  const fuelConsumption = initialFuelStock + fuelPurchaseTotal - finalFuelStock

  // Priemerná spotreba = (spotreba / km) * 100
  const averageConsumption = kmTotal > 0 ? (fuelConsumption / kmTotal) * 100 : 0

  // Zodpovedný vodič
  const responsibleDriver = vehicle.responsible_driver as { id: string; first_name: string; last_name: string } | null

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    licensePlate: vehicle.license_plate,
    year,
    month,
    responsibleDriverId: responsibleDriver?.id || null,
    responsibleDriverName: responsibleDriver
      ? `${responsibleDriver.first_name} ${responsibleDriver.last_name}`
      : null,
    initialFuelStock,
    finalFuelStock,
    fuelPurchaseDomestic,
    fuelPurchaseForeign,
    fuelPurchaseTotal,
    fuelCostDomestic,
    fuelCostForeign,
    fuelCostTotal,
    initialOdometer,
    finalOdometer,
    kmBusiness,
    kmPrivate,
    kmTotal,
    fuelConsumption,
    averageConsumption,
    ratedConsumption: vehicle.rated_consumption,
    status: (existingReport?.status as ReportStatus) || 'draft',
    submittedAt: existingReport?.submitted_at || null,
    approvedBy: existingReport?.approved_by || null,
    approvedAt: existingReport?.approved_at || null,
    notes: existingReport?.notes || null
  }
}

interface SaveParams {
  vehicleId: string
  year: number
  month: number
  initialFuelStock: number
  finalFuelStock: number
  initialOdometer: number
  finalOdometer: number
  status?: ReportStatus
  approvedBy?: string | null
  notes?: string | null
}

export async function saveMonthlyReport(params: SaveParams): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    vehicleId,
    year,
    month,
    initialFuelStock,
    finalFuelStock,
    initialOdometer,
    finalOdometer,
    status = 'draft',
    approvedBy = null,
    notes = null
  } = params

  const reportData = {
    vehicle_id: vehicleId,
    year,
    month,
    initial_fuel_stock: initialFuelStock,
    final_fuel_stock: finalFuelStock,
    initial_odometer: initialOdometer,
    final_odometer: finalOdometer,
    status,
    approved_by: approvedBy,
    approved_at: status === 'approved' ? new Date().toISOString() : null,
    submitted_at: status === 'submitted' || status === 'approved' ? new Date().toISOString() : null,
    notes
  }

  const { error } = await supabase
    .from('monthly_reports')
    .upsert(reportData, {
      onConflict: 'vehicle_id,year,month'
    })

  if (error) {
    console.error('Error saving monthly report:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function generateReportsForAllVehicles(year: number, month: number): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = await createClient()

  // Načítanie všetkých vozidiel
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('id')

  if (vehiclesError) {
    return { success: false, count: 0, error: vehiclesError.message }
  }

  let count = 0

  for (const vehicle of vehicles || []) {
    const data = await calculateMonthlyReportData({
      vehicleId: vehicle.id,
      year,
      month
    })

    if (data) {
      const result = await saveMonthlyReport({
        vehicleId: vehicle.id,
        year,
        month,
        initialFuelStock: data.initialFuelStock,
        finalFuelStock: data.finalFuelStock,
        initialOdometer: data.initialOdometer,
        finalOdometer: data.finalOdometer,
        status: 'draft'
      })

      if (result.success) {
        count++
      }
    }
  }

  return { success: true, count }
}

export async function getMonthlyReports(filters: {
  year?: number
  month?: number
  vehicleId?: string
  status?: ReportStatus
}): Promise<(MonthlyReport & { vehicle: { id: string; name: string; license_plate: string; responsible_driver: { first_name: string; last_name: string } | null } })[]> {
  const supabase = await createClient()

  let query = supabase
    .from('monthly_reports')
    .select(`
      *,
      vehicle:vehicles(
        id,
        name,
        license_plate,
        responsible_driver:drivers(first_name, last_name)
      )
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (filters.year) {
    query = query.eq('year', filters.year)
  }
  if (filters.month) {
    query = query.eq('month', filters.month)
  }
  if (filters.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error loading monthly reports:', error)
    return []
  }

  return data || []
}
