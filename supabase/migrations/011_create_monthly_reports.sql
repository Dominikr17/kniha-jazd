-- Mesačné výkazy PHM
-- Tabuľka pre ukladanie mesačných výkazov spotreby PHM pre ekonomické oddelenie

CREATE TABLE monthly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

  -- Zásoby PHM (v litroch)
  initial_fuel_stock NUMERIC(10, 2) DEFAULT 0,
  final_fuel_stock NUMERIC(10, 2) DEFAULT 0,

  -- Stavy tachometra (v km)
  initial_odometer INTEGER DEFAULT 0,
  final_odometer INTEGER DEFAULT 0,

  -- Status workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),

  -- Schválenie
  submitted_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,

  -- Poznámky
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unikátny index pre kombináciu vozidlo + rok + mesiac
  UNIQUE(vehicle_id, year, month)
);

-- Index pre rýchle vyhľadávanie podľa obdobia
CREATE INDEX idx_monthly_reports_period ON monthly_reports(year, month);
CREATE INDEX idx_monthly_reports_vehicle ON monthly_reports(vehicle_id);
CREATE INDEX idx_monthly_reports_status ON monthly_reports(status);

-- Trigger pre automatickú aktualizáciu updated_at
CREATE OR REPLACE FUNCTION update_monthly_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_monthly_reports_updated_at
  BEFORE UPDATE ON monthly_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_reports_updated_at();

-- RLS politiky
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Verejné čítanie
CREATE POLICY "Allow public read access" ON monthly_reports
  FOR SELECT USING (true);

-- Verejné vkladanie
CREATE POLICY "Allow public insert access" ON monthly_reports
  FOR INSERT WITH CHECK (true);

-- Verejná úprava
CREATE POLICY "Allow public update access" ON monthly_reports
  FOR UPDATE USING (true);

-- Verejné mazanie
CREATE POLICY "Allow public delete access" ON monthly_reports
  FOR DELETE USING (true);

-- Komentár k tabuľke
COMMENT ON TABLE monthly_reports IS 'Mesačné výkazy spotreby PHM pre ekonomické oddelenie';
COMMENT ON COLUMN monthly_reports.initial_fuel_stock IS 'Počiatočná zásoba PHM v litroch';
COMMENT ON COLUMN monthly_reports.final_fuel_stock IS 'Konečná zásoba PHM v litroch';
COMMENT ON COLUMN monthly_reports.initial_odometer IS 'Počiatočný stav tachometra v km';
COMMENT ON COLUMN monthly_reports.final_odometer IS 'Konečný stav tachometra v km';
COMMENT ON COLUMN monthly_reports.status IS 'Status výkazu: draft (rozpracovaný), submitted (predložený), approved (schválený)';
