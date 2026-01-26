-- Tabuľka tankovania PHM
CREATE TABLE fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  odometer INTEGER NOT NULL,
  liters DECIMAL(10, 2) NOT NULL,
  price_per_liter DECIMAL(10, 3) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,
  gas_station VARCHAR(100),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexy
CREATE INDEX idx_fuel_records_vehicle ON fuel_records(vehicle_id);
CREATE INDEX idx_fuel_records_date ON fuel_records(date DESC);

-- RLS políky
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať tankovania" ON fuel_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať tankovania" ON fuel_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať tankovania" ON fuel_records
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať tankovania" ON fuel_records
  FOR DELETE TO authenticated USING (true);
