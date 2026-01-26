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

-- Index
CREATE INDEX idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_valid_until ON vehicle_inspections(valid_until);

-- RLS políky
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať inšpekcie" ON vehicle_inspections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať inšpekcie" ON vehicle_inspections
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať inšpekcie" ON vehicle_inspections
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať inšpekcie" ON vehicle_inspections
  FOR DELETE TO authenticated USING (true);
