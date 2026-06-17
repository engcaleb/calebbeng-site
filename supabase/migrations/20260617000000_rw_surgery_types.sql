-- Surgery types table: replaces hardcoded SURGERY_TYPES array
CREATE TABLE IF NOT EXISTS rw_surgery_types (
  name TEXT PRIMARY KEY,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with existing types
INSERT INTO rw_surgery_types (name, sort_order) VALUES
  ('LASIK', 0),
  ('Cataract', 1),
  ('Dry Eye', 2),
  ('Retinal', 3),
  ('Corneal', 4)
ON CONFLICT (name) DO NOTHING;

-- Public read access (doctors + patient pages need the list)
ALTER TABLE rw_surgery_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read surgery types"
  ON rw_surgery_types FOR SELECT
  USING (true);
