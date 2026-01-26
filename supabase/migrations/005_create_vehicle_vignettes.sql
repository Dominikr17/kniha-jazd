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

-- Index
CREATE INDEX idx_vehicle_vignettes_vehicle ON vehicle_vignettes(vehicle_id);
CREATE INDEX idx_vehicle_vignettes_valid_until ON vehicle_vignettes(valid_until);

-- RLS políky
ALTER TABLE vehicle_vignettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať známky" ON vehicle_vignettes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať známky" ON vehicle_vignettes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať známky" ON vehicle_vignettes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať známky" ON vehicle_vignettes
  FOR DELETE TO authenticated USING (true);
