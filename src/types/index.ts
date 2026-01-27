// Vodiči
export interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export type DriverInsert = Omit<Driver, 'id' | 'created_at' | 'updated_at'>
export type DriverUpdate = Partial<DriverInsert>

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
  initial_odometer: number
  responsible_driver_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  responsible_driver?: Driver
}

export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
export type VehicleUpdate = Partial<VehicleInsert>

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
  odometer: number
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
