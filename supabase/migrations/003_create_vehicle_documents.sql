-- Tabuľka dokumentov vozidiel
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('technicak', 'pzp', 'havarijne', 'ine')),
  name VARCHAR(100) NOT NULL,
  file_url TEXT,
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_vehicle_documents_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX idx_vehicle_documents_valid_until ON vehicle_documents(valid_until);

-- RLS políky
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prihlásení používatelia môžu čítať dokumenty" ON vehicle_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu vytvárať dokumenty" ON vehicle_documents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Prihlásení používatelia môžu upravovať dokumenty" ON vehicle_documents
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Prihlásení používatelia môžu mazať dokumenty" ON vehicle_documents
  FOR DELETE TO authenticated USING (true);
