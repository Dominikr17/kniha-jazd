-- Sekvencia pre číslovanie jázd
CREATE SEQUENCE trips_number_seq START 1;

-- Tabuľka jázd
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

-- Unique constraint pre číslo jazdy
ALTER TABLE trips ADD CONSTRAINT trips_number_unique UNIQUE (trip_number);

-- Indexy
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_date ON trips(date DESC);
CREATE INDEX idx_trips_number ON trips(trip_number DESC);

-- RLS políky
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať jazdy" ON trips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať jazdy" ON trips
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať jazdy" ON trips
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať jazdy" ON trips
  FOR DELETE TO authenticated USING (true);

-- Trigger pre updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
