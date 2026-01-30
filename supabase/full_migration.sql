-- =====================================================
-- KNIHA JÁZD - KOMPLETNÁ DATABÁZOVÁ MIGRÁCIA
-- Spustite tento SQL v Supabase Dashboard > SQL Editor
-- =====================================================

-- Tabuľka vodičov
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drivers_name ON drivers(last_name, first_name);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať vodičov" ON drivers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať vodičov" ON drivers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať vodičov" ON drivers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať vodičov" ON drivers
  FOR DELETE TO authenticated USING (true);

-- Funkcia pre updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Tabuľka vozidiel
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  vin VARCHAR(17) NOT NULL UNIQUE,
  brand VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'nafta' CHECK (fuel_type IN ('benzin', 'nafta', 'lpg', 'elektro', 'hybrid')),
  initial_odometer INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať vozidlá" ON vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať vozidlá" ON vehicles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať vozidlá" ON vehicles
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať vozidlá" ON vehicles
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Tabuľka dokumentov vozidiel
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('technicak', 'pzp', 'havarijne', 'ine')),
  name VARCHAR(100) NOT NULL,
  file_url TEXT,
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_documents_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX idx_vehicle_documents_valid_until ON vehicle_documents(valid_until);

ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať dokumenty" ON vehicle_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať dokumenty" ON vehicle_documents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať dokumenty" ON vehicle_documents
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať dokumenty" ON vehicle_documents
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Tabuľka STK/EK kontrol
CREATE TABLE vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_type VARCHAR(10) NOT NULL CHECK (inspection_type IN ('stk', 'ek')),
  inspection_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_valid_until ON vehicle_inspections(valid_until);

ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať inšpekcie" ON vehicle_inspections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať inšpekcie" ON vehicle_inspections
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať inšpekcie" ON vehicle_inspections
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať inšpekcie" ON vehicle_inspections
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "vehicle_inspections_public_select" ON vehicle_inspections
  FOR SELECT USING (true);

-- =====================================================
-- Tabuľka diaľničných známok
CREATE TABLE vehicle_vignettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  country VARCHAR(2) NOT NULL CHECK (country IN ('SK', 'CZ', 'AT', 'HU', 'PL', 'DE', 'SI')),
  vignette_type VARCHAR(20) NOT NULL CHECK (vignette_type IN ('rocna', 'mesacna', '10dnovka', 'ina')),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_vignettes_vehicle ON vehicle_vignettes(vehicle_id);
CREATE INDEX idx_vehicle_vignettes_valid_until ON vehicle_vignettes(valid_until);

ALTER TABLE vehicle_vignettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať známky" ON vehicle_vignettes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať známky" ON vehicle_vignettes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať známky" ON vehicle_vignettes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať známky" ON vehicle_vignettes
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "vehicle_vignettes_public_select" ON vehicle_vignettes
  FOR SELECT USING (true);

-- =====================================================
-- Tabuľka jázd
CREATE SEQUENCE trips_number_seq START 1;

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number INTEGER NOT NULL DEFAULT nextval('trips_number_seq'),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME,
  route_from VARCHAR(255) NOT NULL,
  route_to VARCHAR(255) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  odometer_start INTEGER NOT NULL,
  odometer_end INTEGER,
  distance INTEGER GENERATED ALWAYS AS (CASE WHEN odometer_end IS NOT NULL THEN odometer_end - odometer_start ELSE NULL END) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trips ADD CONSTRAINT trips_number_unique UNIQUE (trip_number);

CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_date ON trips(date DESC);
CREATE INDEX idx_trips_number ON trips(trip_number DESC);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať jazdy" ON trips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať jazdy" ON trips
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať jazdy" ON trips
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať jazdy" ON trips
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Tabuľka tankovania PHM
CREATE TABLE fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  odometer INTEGER,  -- voliteľné - vodič nemusí vedieť presný stav
  liters DECIMAL(10, 2) NOT NULL,
  price_per_liter DECIMAL(10, 3) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,
  gas_station VARCHAR(100),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fuel_records_vehicle ON fuel_records(vehicle_id);
CREATE INDEX idx_fuel_records_date ON fuel_records(date DESC);

ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať tankovania" ON fuel_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať tankovania" ON fuel_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať tankovania" ON fuel_records
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať tankovania" ON fuel_records
  FOR DELETE TO authenticated USING (true);


-- =====================================================
-- MIGRÁCIA: Pridanie normovanej spotreby do vozidiel
-- =====================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rated_consumption DECIMAL(4,1);
-- Normovaná spotreba v l/100km podľa výrobcu
COMMENT ON COLUMN vehicles.rated_consumption IS 'Normovaná spotreba v l/100km podľa výrobcu';

-- =====================================================
-- MIGRÁCIA: Automatický výpočet stavu nádrže
-- =====================================================

-- 1. Rozšíriť tabuľku vehicles o objem nádrže
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tank_capacity DECIMAL(10,2);
COMMENT ON COLUMN vehicles.tank_capacity IS 'Objem palivovej nádrže v litroch';

-- 2. Rozšíriť tabuľku fuel_records o príznak plnej nádrže
ALTER TABLE fuel_records ADD COLUMN IF NOT EXISTS full_tank BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN fuel_records.full_tank IS 'Či sa jedná o dotankovanie do plnej nádrže';

-- 3. Vytvoriť tabuľku fuel_inventory pre referenčné body stavu nádrže
CREATE TABLE IF NOT EXISTS fuel_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fuel_amount DECIMAL(10,2) NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('initial', 'full_tank', 'manual_correction')),
  fuel_record_id UUID REFERENCES fuel_records(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_inventory_vehicle_date ON fuel_inventory(vehicle_id, date);

COMMENT ON TABLE fuel_inventory IS 'Referenčné body stavu nádrže pre výpočet zásob PHM';
COMMENT ON COLUMN fuel_inventory.source IS 'Zdroj záznamu: initial = počiatočný stav, full_tank = tankovanie do plna, manual_correction = manuálna korekcia';
COMMENT ON COLUMN fuel_inventory.fuel_record_id IS 'Odkaz na tankovanie ak source = full_tank';

-- 4. RLS politiky pre fuel_inventory (rovnaké ako fuel_records - verejné CRUD)
ALTER TABLE fuel_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fuel_inventory_select_policy" ON fuel_inventory
  FOR SELECT USING (true);

CREATE POLICY "fuel_inventory_insert_policy" ON fuel_inventory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "fuel_inventory_update_policy" ON fuel_inventory
  FOR UPDATE USING (true);

CREATE POLICY "fuel_inventory_delete_policy" ON fuel_inventory
  FOR DELETE USING (true);
