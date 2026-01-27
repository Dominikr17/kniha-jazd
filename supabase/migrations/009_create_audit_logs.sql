-- Tabuľka pre audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('admin', 'driver')),
  user_id UUID,
  user_name VARCHAR(100),
  old_data JSONB,
  new_data JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexy pre rýchle vyhľadávanie
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_type, user_id);

-- RLS politiky
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admini môžu čítať audit logy" ON audit_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Systém môže vkladať audit logy" ON audit_logs
  FOR INSERT WITH CHECK (true);
