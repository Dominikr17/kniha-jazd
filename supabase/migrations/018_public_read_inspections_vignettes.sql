-- Pridanie verejného čítania pre vehicle_inspections a vehicle_vignettes
-- Potrebné pre vodičovskú sekciu (vodiči nie sú authenticated cez Supabase Auth)

-- Verejné čítanie STK/EK
CREATE POLICY "vehicle_inspections_public_select" ON vehicle_inspections
  FOR SELECT USING (true);

-- Verejné čítanie diaľničných známok
CREATE POLICY "vehicle_vignettes_public_select" ON vehicle_vignettes
  FOR SELECT USING (true);
