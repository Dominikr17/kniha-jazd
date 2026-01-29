-- Pridanie poľa pre funkciu vodiča
ALTER TABLE drivers ADD COLUMN position VARCHAR(100);

COMMENT ON COLUMN drivers.position IS 'Pracovná pozícia/funkcia vodiča';
