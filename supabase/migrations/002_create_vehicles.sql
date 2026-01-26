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

-- Indexy
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

-- RLS políky
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať vozidlá" ON vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať vozidlá" ON vehicles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať vozidlá" ON vehicles
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať vozidlá" ON vehicles
  FOR DELETE TO authenticated USING (true);

-- Trigger pre updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
