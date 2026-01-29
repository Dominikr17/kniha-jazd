-- Tabuľka pre priradenie vozidiel vodičom
CREATE TABLE driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(driver_id, vehicle_id)
);

-- Indexy pre rýchle vyhľadávanie
CREATE INDEX idx_driver_vehicles_driver ON driver_vehicles(driver_id);
CREATE INDEX idx_driver_vehicles_vehicle ON driver_vehicles(vehicle_id);

-- RLS politiky
ALTER TABLE driver_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_vehicles_select" ON driver_vehicles FOR SELECT USING (true);
CREATE POLICY "driver_vehicles_insert" ON driver_vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "driver_vehicles_delete" ON driver_vehicles FOR DELETE USING (true);
