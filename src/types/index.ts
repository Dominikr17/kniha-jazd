// Vodiči
export interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  position: string | null  // Pracovná pozícia/funkcia
  created_at: string
  updated_at: string
  // Joined fields pre priradené vozidlá
  assigned_vehicles?: Vehicle[]
  driver_vehicles?: DriverVehicle[]
  vehicle_count?: number
}

export type DriverInsert = Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'assigned_vehicles' | 'driver_vehicles' | 'vehicle_count'>
export type DriverUpdate = Partial<DriverInsert>

// Priradenie vozidla vodičovi
export interface DriverVehicle {
  id: string
  driver_id: string
  vehicle_id: string
  created_at: string
  created_by: string | null
  // Joined fields
  driver?: Driver
  vehicle?: Vehicle
}

export type DriverVehicleInsert = Omit<DriverVehicle, 'id' | 'created_at' | 'driver' | 'vehicle'>

// Vozidlá
export interface Vehicle {
  id: string
  name: string
  license_plate: string
  vin: string
  brand: string | null
  model: string | null
  year: number | null
  fuel_type: 'benzin' | 'nafta' | 'lpg' | 'elektro' | 'hybrid'
  tire_type: TireType | null  // Typ pneumatík (letné/zimné/celoročné)
  initial_odometer: number
  responsible_driver_id: string | null
  rated_consumption: number | null  // Normovaná spotreba v l/100km podľa výrobcu
  tank_capacity: number | null  // Objem palivovej nádrže v litroch
  created_at: string
  updated_at: string
  // Joined fields
  responsible_driver?: Driver
  assigned_drivers?: Driver[]
  driver_vehicles?: DriverVehicle[]
}

export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'responsible_driver' | 'assigned_drivers' | 'driver_vehicles'>
export type VehicleUpdate = Partial<VehicleInsert>

// Vozidlo s detailmi pre vodičovskú sekciu
export interface VehicleWithDetails extends Vehicle {
  currentOdometer: number
  stk: VehicleInspection | null
  ek: VehicleInspection | null
  vignettes: VehicleVignette[]
}

// Dokumenty vozidiel
export interface VehicleDocument {
  id: string
  vehicle_id: string
  document_type: 'technicak' | 'pzp' | 'havarijne' | 'ine'
  name: string
  file_url: string | null
  valid_from: string | null
  valid_until: string | null
  notes: string | null
  created_at: string
}

export type VehicleDocumentInsert = Omit<VehicleDocument, 'id' | 'created_at'>

// STK/EK
export interface VehicleInspection {
  id: string
  vehicle_id: string
  inspection_type: 'stk' | 'ek'
  inspection_date: string
  valid_until: string
  notes: string | null
  created_at: string
}

export type VehicleInspectionInsert = Omit<VehicleInspection, 'id' | 'created_at'>

// Diaľničné známky
export interface VehicleVignette {
  id: string
  vehicle_id: string
  country: 'SK' | 'CZ' | 'AT' | 'HU' | 'PL' | 'DE' | 'SI'
  vignette_type: 'rocna' | 'mesacna' | '10dnovka' | 'ina'
  valid_from: string
  valid_until: string
  price: number | null
  notes: string | null
  created_at: string
}

export type VehicleVignetteInsert = Omit<VehicleVignette, 'id' | 'created_at'>

// Jazdy
export interface Trip {
  id: string
  trip_number: number
  vehicle_id: string
  driver_id: string
  date: string
  time_start: string
  time_end: string | null
  route_from: string
  route_to: string
  purpose: string
  trip_type: TripType
  odometer_start: number
  odometer_end: number | null
  distance: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  vehicle?: Vehicle
  driver?: Driver
}

export type TripInsert = Omit<Trip, 'id' | 'trip_number' | 'created_at' | 'updated_at' | 'vehicle' | 'driver'>
export type TripUpdate = Partial<TripInsert>

// Tankovanie PHM
export interface FuelRecord {
  id: string
  vehicle_id: string
  driver_id: string | null
  date: string
  odometer: number | null
  liters: number
  price_per_liter: number
  total_price: number
  price_without_vat: number | null
  country: FuelCountry
  payment_method: PaymentMethod
  fuel_type: string
  gas_station: string | null
  receipt_url: string | null
  notes: string | null
  full_tank: boolean  // Či sa jedná o dotankovanie do plnej nádrže
  created_at: string
  // Joined fields
  vehicle?: Vehicle
  driver?: Driver
}

export type FuelRecordInsert = Omit<FuelRecord, 'id' | 'created_at' | 'vehicle' | 'driver'>

// Preddefinované účely cesty
export const TRIP_PURPOSES = [
  'Služobná cesta',
  'Preprava tovaru',
  'Preprava osôb',
  'Návšteva zákazníka',
  'Školenie',
  'Servis vozidla',
  'Nákup materiálu',
  'Iné',
] as const

// Krajiny pre diaľničné známky
export const VIGNETTE_COUNTRIES = {
  SK: 'Slovensko',
  CZ: 'Česko',
  AT: 'Rakúsko',
  HU: 'Maďarsko',
  PL: 'Poľsko',
  DE: 'Nemecko',
  SI: 'Slovinsko',
} as const

// Typy paliva
export const FUEL_TYPES = {
  benzin: 'Benzín',
  nafta: 'Nafta',
  lpg: 'LPG',
  elektro: 'Elektro',
  hybrid: 'Hybrid',
} as const

// Typy pneumatík
export const TIRE_TYPES = {
  summer: 'Letné',
  winter: 'Zimné',
  all_season: 'Celoročné',
} as const

export type TireType = keyof typeof TIRE_TYPES

// Typy jázd
export const TRIP_TYPES = {
  sluzobna: 'Služobná',
  sukromna: 'Súkromná'
} as const

// Krajiny pre tankovanie s DPH sadzbami
export const FUEL_COUNTRIES = {
  SK: { name: 'Slovensko', flag: '🇸🇰', vatRate: 0.20 },
  CZ: { name: 'Česko', flag: '🇨🇿', vatRate: 0.21 },
  PL: { name: 'Poľsko', flag: '🇵🇱', vatRate: 0.23 },
  AT: { name: 'Rakúsko', flag: '🇦🇹', vatRate: 0.20 },
  HU: { name: 'Maďarsko', flag: '🇭🇺', vatRate: 0.27 },
  DE: { name: 'Nemecko', flag: '🇩🇪', vatRate: 0.19 },
  other: { name: 'Iná krajina', flag: '🌍', vatRate: 0.20 }
} as const

// Spôsoby platby
export const PAYMENT_METHODS = {
  company_card: 'Firemná karta',
  cash: 'Hotovosť',
  advance: 'Záloha',
  invoice: 'Faktúra'
} as const

export type TripType = keyof typeof TRIP_TYPES
export type FuelCountry = keyof typeof FUEL_COUNTRIES
export type PaymentMethod = keyof typeof PAYMENT_METHODS

// Audit log
export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  user_type: 'admin' | 'driver'
  user_id: string | null
  user_name: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  description: string | null
  created_at: string
}

export const AUDIT_TABLES = {
  trips: 'Jazda',
  fuel_records: 'Tankovanie',
  drivers: 'Vodič',
  vehicles: 'Vozidlo',
  vehicle_inspections: 'STK/EK',
  vehicle_vignettes: 'Diaľničná známka',
  driver_vehicles: 'Priradenie vozidla'
} as const

export const AUDIT_OPERATIONS = {
  INSERT: 'Vytvorenie',
  UPDATE: 'Úprava',
  DELETE: 'Zmazanie'
} as const

// Časový limit na úpravu jazdy vodičom (v minútach)
export const DRIVER_EDIT_TIME_LIMIT_MINUTES = 15

// Názvy mesiacov po slovensky
export const MONTHS_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
] as const

// Status mesačného výkazu
export const REPORT_STATUS = {
  draft: 'Rozpracovaný',
  submitted: 'Predložený',
  approved: 'Schválený'
} as const

export type ReportStatus = keyof typeof REPORT_STATUS

// Mesačný výkaz - DB záznam
export interface MonthlyReport {
  id: string
  vehicle_id: string
  year: number
  month: number
  initial_fuel_stock: number
  final_fuel_stock: number
  initial_odometer: number
  final_odometer: number
  status: ReportStatus
  submitted_at: string | null
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  vehicle?: Vehicle
}

export type MonthlyReportInsert = Omit<MonthlyReport, 'id' | 'created_at' | 'updated_at' | 'vehicle'>
export type MonthlyReportUpdate = Partial<MonthlyReportInsert>

// Mesačný výkaz - kalkulované dáta
export interface MonthlyReportData {
  // Identifikácia
  reportId: string | null  // ID existujúceho výkazu v DB (null ak ešte nebol uložený)
  vehicleId: string
  vehicleName: string
  licensePlate: string
  year: number
  month: number

  // Zodpovedný vodič (predkladateľ)
  responsibleDriverId: string | null
  responsibleDriverName: string | null

  // Zásoby PHM (editovateľné)
  initialFuelStock: number
  finalFuelStock: number

  // Automatický výpočet zásob PHM
  fuelStockCalculation: FuelStockCalculation | null

  // Nákup PHM (automaticky z fuel_records)
  fuelPurchaseDomestic: number  // SK
  fuelPurchaseForeign: number   // ostatné krajiny
  fuelPurchaseTotal: number
  fuelCostDomestic: number
  fuelCostForeign: number
  fuelCostTotal: number

  // Tachometer (automaticky z trips)
  initialOdometer: number
  finalOdometer: number

  // Kilometre podľa typu (automaticky z trips)
  kmBusiness: number   // služobné
  kmPrivate: number    // súkromné
  kmTotal: number

  // Spotreba (kalkulovaná)
  fuelConsumption: number        // počiatočná + nákup - konečná
  averageConsumption: number     // (spotreba / km) * 100
  ratedConsumption: number | null // normovaná spotreba vozidla

  // Status
  status: ReportStatus
  submittedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  notes: string | null
}

// Referenčný bod stavu nádrže
export type FuelInventorySource = 'initial' | 'full_tank' | 'manual_correction'

export interface FuelInventory {
  id: string
  vehicle_id: string
  date: string
  fuel_amount: number
  source: FuelInventorySource
  fuel_record_id: string | null
  notes: string | null
  created_at: string
}

export type FuelInventoryInsert = Omit<FuelInventory, 'id' | 'created_at'>

// Výsledok výpočtu stavu nádrže
export interface FuelStockCalculation {
  // Vypočítané hodnoty
  initialFuelStock: number
  finalFuelStock: number

  // Informácie o výpočte
  isEstimate: boolean  // true ak nie je k dispozícii referenčný bod
  hasReferencePoint: boolean  // či existuje referenčný bod pre výpočet
  referenceDate: string | null  // dátum posledného referenčného bodu
  referenceSource: FuelInventorySource | null  // zdroj referenčného bodu

  // Vstupné údaje použité pre výpočet
  tankCapacity: number | null
  ratedConsumption: number | null
  totalKm: number
  totalRefueled: number

  // Upozornenia
  warnings: string[]
  error: string | null
}
