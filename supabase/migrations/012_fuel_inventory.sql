-- Migrácia: Automatický výpočet stavu nádrže
-- Rozšírenie vozidiel o objem nádrže a vytvorenie tabuľky referenčných bodov

-- 1. Rozšíriť tabuľku vehicles o objem nádrže
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS tank_capacity DECIMAL(10,2);

COMMENT ON COLUMN vehicles.tank_capacity IS 'Objem palivovej nádrže v litroch';

-- 2. Rozšíriť tabuľku fuel_records o príznak plnej nádrže
ALTER TABLE fuel_records
ADD COLUMN IF NOT EXISTS full_tank BOOLEAN DEFAULT FALSE;

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
