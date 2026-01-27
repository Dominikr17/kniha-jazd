-- Tabuľka trips - typ jazdy
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_type VARCHAR(20) DEFAULT 'sluzobna';
ALTER TABLE trips ADD CONSTRAINT trips_trip_type_check
  CHECK (trip_type IN ('sluzobna', 'sukromna'));
CREATE INDEX IF NOT EXISTS idx_trips_trip_type ON trips(trip_type);

-- Tabuľka fuel_records - krajina, cena bez DPH, spôsob platby
ALTER TABLE fuel_records ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'SK';
ALTER TABLE fuel_records ADD COLUMN IF NOT EXISTS price_without_vat DECIMAL(10,2);
ALTER TABLE fuel_records ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'company_card';
ALTER TABLE fuel_records ADD CONSTRAINT fuel_records_payment_method_check
  CHECK (payment_method IN ('company_card', 'cash', 'advance', 'invoice'));
CREATE INDEX IF NOT EXISTS idx_fuel_records_country ON fuel_records(country);
CREATE INDEX IF NOT EXISTS idx_fuel_records_payment_method ON fuel_records(payment_method);

-- Tabuľka vehicles - zodpovedný vodič
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS responsible_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_responsible_driver ON vehicles(responsible_driver_id);
