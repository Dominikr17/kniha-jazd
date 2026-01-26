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

-- Index pre vyhľadávanie
CREATE INDEX idx_drivers_name ON drivers(last_name, first_name);

-- RLS políky
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Všetci prihlásení používatelia vidia všetkých vodičov
CREATE POLICY "Prihlásení používatelia môžu čítať vodičov" ON drivers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať vodičov" ON drivers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať vodičov" ON drivers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať vodičov" ON drivers
  FOR DELETE TO authenticated USING (true);

-- Trigger pre updated_at
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
