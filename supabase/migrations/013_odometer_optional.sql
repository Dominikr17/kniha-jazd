-- Migrácia: Stav tachometra pri tankovaní je voliteľný
-- Vodič nemusí vedieť presný stav tachometra v momente tankovania

ALTER TABLE fuel_records
ALTER COLUMN odometer DROP NOT NULL;

COMMENT ON COLUMN fuel_records.odometer IS 'Stav tachometra pri tankovaní (voliteľné)';
