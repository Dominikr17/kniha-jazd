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
  // Podpora pre cudziu menu
  original_currency: FuelCurrency
  original_total_price: number | null  // Suma v pôvodnej mene
  original_price_per_liter: number | null  // Cena za liter v pôvodnej mene
  eur_confirmed: boolean  // Či bola EUR suma potvrdená
  eur_confirmed_at: string | null
  eur_confirmed_by: string | null
  exchange_rate: number | null  // Použitý kurz
  created_at: string
  // Joined fields
  vehicle?: Vehicle
  driver?: Driver
}

export type FuelRecordInsert = Omit<FuelRecord, 'id' | 'created_at' | 'vehicle' | 'driver' | 'eur_confirmed_at' | 'eur_confirmed_by'>

// Preddefinované účely cesty
export const TRIP_PURPOSES = [
  'Služobná cesta',
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

// Meny pre tankovanie
export const FUEL_CURRENCIES = {
  EUR: { name: 'Euro', symbol: '€' },
  CZK: { name: 'Česká koruna', symbol: 'Kč' },
  PLN: { name: 'Poľský zlotý', symbol: 'zł' },
  HUF: { name: 'Maďarský forint', symbol: 'Ft' },
} as const

// Mapovanie krajín na meny
export const COUNTRY_CURRENCY_MAP: Record<FuelCountry, FuelCurrency> = {
  SK: 'EUR',
  AT: 'EUR',
  DE: 'EUR',
  CZ: 'CZK',
  PL: 'PLN',
  HU: 'HUF',
  other: 'EUR', // pre "inú krajinu" default EUR, ale vodič môže zmeniť
} as const

export type TripType = keyof typeof TRIP_TYPES
export type FuelCountry = keyof typeof FUEL_COUNTRIES
export type PaymentMethod = keyof typeof PAYMENT_METHODS
export type FuelCurrency = keyof typeof FUEL_CURRENCIES

// OCR výsledok z pokladničného bloku
export interface ReceiptScanResult {
  liters?: number
  pricePerLiter?: number
  totalPrice?: number
  gasStation?: string
  date?: string  // formát YYYY-MM-DD
  country?: FuelCountry
}

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
  driver_vehicles: 'Priradenie vozidla',
  business_trips: 'Služobná cesta',
  border_crossings: 'Prechod hraníc',
  trip_allowances: 'Stravné',
  trip_expenses: 'Výdavok SC'
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

// ============================================
// Služobné cesty
// ============================================

// Status workflow služobnej cesty
export const BUSINESS_TRIP_STATUS = {
  draft: 'Rozpracovaná',
  submitted: 'Odoslaná',
  approved: 'Schválená',
  rejected: 'Vrátená',
  paid: 'Preplatená'
} as const

export type BusinessTripStatus = keyof typeof BUSINESS_TRIP_STATUS

// Dopravné prostriedky
export const TRANSPORT_TYPES = {
  AUS: 'Vlastné auto – služobná cesta',
  AUV: 'Vlastné auto – súkromné',
  AUS_sluzobne: 'Služobné auto',
  MOS: 'Vlastný motocykel – služobný',
  MOV: 'Vlastný motocykel – súkromný',
  vlak: 'Vlak',
  autobus: 'Autobus',
  lietadlo: 'Lietadlo'
} as const

export type TransportType = keyof typeof TRANSPORT_TYPES

// Typy výdavkov
export const EXPENSE_TYPES = {
  accommodation: 'Ubytovanie',
  parking: 'Parkovné',
  toll: 'Mýto',
  fuel: 'Palivo',
  insurance: 'Poistenie',
  taxi: 'Taxi',
  public_transport: 'MHD',
  other: 'Iné'
} as const

export type ExpenseType = keyof typeof EXPENSE_TYPES

// Tuzemské sadzby stravného (EUR, platné od 1.1.2026)
export const DOMESTIC_ALLOWANCE_RATES = {
  '5_12h': 9.30,
  '12_18h': 13.80,
  'nad_18h': 20.60
} as const

// Krátenie stravného (zo základnej 100% sadzby)
export const ALLOWANCE_DEDUCTION_RATES = {
  breakfast: 0.25,
  lunch: 0.40,
  dinner: 0.35
} as const

// Amortizácia vlastného vozidla (EUR/km)
export const VEHICLE_AMORTIZATION = {
  AUV: 0.313,
  MOV: 0.090
} as const

// Zahraničné sadzby stravného (EUR/deň pri 100%)
export const FOREIGN_ALLOWANCE_RATES: Record<string, { name: string; rate: number }> = {
  // Susedné krajiny
  CZ: { name: 'Česko', rate: 45 },
  PL: { name: 'Poľsko', rate: 45 },
  HU: { name: 'Maďarsko', rate: 45 },
  AT: { name: 'Rakúsko', rate: 55 },
  UA: { name: 'Ukrajina', rate: 45 },
  // Západná Európa
  DE: { name: 'Nemecko', rate: 55 },
  FR: { name: 'Francúzsko', rate: 55 },
  BE: { name: 'Belgicko', rate: 55 },
  NL: { name: 'Holandsko', rate: 55 },
  LU: { name: 'Luxembursko', rate: 50 },
  CH: { name: 'Švajčiarsko', rate: 60 },
  GB: { name: 'Veľká Británia', rate: 55 },
  IE: { name: 'Írsko', rate: 53 },
  // Škandinávske krajiny
  DK: { name: 'Dánsko', rate: 51 },
  SE: { name: 'Švédsko', rate: 40 },
  NO: { name: 'Nórsko', rate: 36 },
  FI: { name: 'Fínsko', rate: 50 },
  IS: { name: 'Island', rate: 55 },
  // Pobaltské krajiny
  EE: { name: 'Estónsko', rate: 42 },
  LV: { name: 'Lotyšsko', rate: 40 },
  LT: { name: 'Litva', rate: 40 },
  // Južná Európa
  IT: { name: 'Taliansko', rate: 55 },
  ES: { name: 'Španielsko', rate: 43 },
  PT: { name: 'Portugalsko', rate: 43 },
  GR: { name: 'Grécko', rate: 42 },
  CY: { name: 'Cyprus', rate: 41 },
  MT: { name: 'Malta', rate: 45 },
  // Balkán a juhovýchod
  SI: { name: 'Slovinsko', rate: 50 },
  HR: { name: 'Chorvátsko', rate: 50 },
  RS: { name: 'Srbsko', rate: 40 },
  BA: { name: 'Bosna a Hercegovina', rate: 40 },
  ME: { name: 'Čierna Hora', rate: 40 },
  MK: { name: 'Severné Macedónsko', rate: 37 },
  AL: { name: 'Albánsko', rate: 33 },
  XK: { name: 'Kosovo', rate: 35 },
  RO: { name: 'Rumunsko', rate: 40 },
  BG: { name: 'Bulharsko', rate: 40 },
  TR: { name: 'Turecko', rate: 44 },
  MD: { name: 'Moldavsko', rate: 40 },
  // Východná Európa
  RU: { name: 'Rusko', rate: 45 },
  BY: { name: 'Bielorusko', rate: 45 },
} as const

// Slovenské názvy krajín
export const COUNTRY_NAMES: Record<string, string> = {
  SK: 'Slovensko',
  CZ: 'Česko',
  PL: 'Poľsko',
  HU: 'Maďarsko',
  AT: 'Rakúsko',
  UA: 'Ukrajina',
  DE: 'Nemecko',
  FR: 'Francúzsko',
  BE: 'Belgicko',
  NL: 'Holandsko',
  LU: 'Luxembursko',
  CH: 'Švajčiarsko',
  GB: 'Veľká Británia',
  IE: 'Írsko',
  DK: 'Dánsko',
  SE: 'Švédsko',
  NO: 'Nórsko',
  FI: 'Fínsko',
  IS: 'Island',
  EE: 'Estónsko',
  LV: 'Lotyšsko',
  LT: 'Litva',
  IT: 'Taliansko',
  ES: 'Španielsko',
  PT: 'Portugalsko',
  GR: 'Grécko',
  CY: 'Cyprus',
  MT: 'Malta',
  SI: 'Slovinsko',
  HR: 'Chorvátsko',
  RS: 'Srbsko',
  BA: 'Bosna a Hercegovina',
  ME: 'Čierna Hora',
  MK: 'Severné Macedónsko',
  AL: 'Albánsko',
  XK: 'Kosovo',
  RO: 'Rumunsko',
  BG: 'Bulharsko',
  TR: 'Turecko',
  MD: 'Moldavsko',
  RU: 'Rusko',
  BY: 'Bielorusko',
} as const

// Hraničné prechody SR podľa susedných krajín
export const BORDER_CROSSINGS_SK: Record<string, string[]> = {
  CZ: ['Drietoma', 'Svrčinovec', 'Makov', 'Lysá pod Makytou', 'Horné Srnie', 'Vrbovce', 'Holíč', 'Brodské', 'Skalica'],
  PL: ['Trstená', 'Suchá Hora', 'Mnišek nad Popradom', 'Vyšný Komárnik', 'Barwinek/Vyšný Komárnik', 'Chyžné', 'Lysá Poľana'],
  HU: ['Rajka', 'Rusovce', 'Komárno', 'Štúrovo', 'Šahy', 'Slovenské Ďarmoty', 'Šiatorská Bukovinka', 'Milhosť'],
  AT: ['Bratislava - Petržalka', 'Bratislava - Jarovce', 'Bratislava - Berg', 'Kittsee/Jarovce'],
  UA: ['Vyšné Nemecké', 'Ubľa', 'Veľké Slemence']
} as const

// Služobná cesta - hlavná entita
export interface BusinessTrip {
  id: string
  trip_number: string
  driver_id: string
  trip_type: 'tuzemska' | 'zahranicna'
  destination_country: string | null
  destination_city: string
  purpose: string
  transport_type: TransportType
  companion: string | null
  group_id: string | null
  departure_date: string
  return_date: string
  advance_amount: number
  advance_currency: string
  total_allowance: number
  total_expenses: number
  total_amortization: number
  total_amount: number
  balance: number
  status: BusinessTripStatus
  rejection_reason: string | null
  submitted_at: string | null
  approved_by: string | null
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  driver?: Driver
  border_crossings?: BorderCrossing[]
  allowances?: TripAllowance[]
  expenses?: TripExpense[]
  linked_trips?: BusinessTripTrip[]
}

export type BusinessTripInsert = Omit<BusinessTrip, 'id' | 'created_at' | 'updated_at' | 'driver' | 'border_crossings' | 'allowances' | 'expenses' | 'linked_trips'>
export type BusinessTripUpdate = Partial<BusinessTripInsert>

// Prechod hraníc
export interface BorderCrossing {
  id: string
  business_trip_id: string
  crossing_date: string
  crossing_name: string
  country_from: string
  country_to: string
  direction: 'outbound' | 'inbound'
  created_at: string
}

export type BorderCrossingInsert = Omit<BorderCrossing, 'id' | 'created_at'>

// Denné stravné
export interface TripAllowance {
  id: string
  business_trip_id: string
  date: string
  country: string
  hours: number
  base_rate: number
  rate_percentage: number
  gross_amount: number
  breakfast_deduction: number
  lunch_deduction: number
  dinner_deduction: number
  net_amount: number
  currency: string
  created_at: string
}

export type TripAllowanceInsert = Omit<TripAllowance, 'id' | 'created_at'>

// Výdavok služobnej cesty
export interface TripExpense {
  id: string
  business_trip_id: string
  expense_type: ExpenseType
  description: string
  amount: number
  currency: string
  date: string
  receipt_number: string | null
  created_at: string
}

export type TripExpenseInsert = Omit<TripExpense, 'id' | 'created_at'>

// Väzba služobná cesta → jazda
export interface BusinessTripTrip {
  id: string
  business_trip_id: string
  trip_id: string
  created_at: string
  // Joined fields
  trip?: Trip
}

export type BusinessTripTripInsert = Omit<BusinessTripTrip, 'id' | 'created_at' | 'trip'>
