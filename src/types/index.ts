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
  created_at: string
  updated_at: string
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
