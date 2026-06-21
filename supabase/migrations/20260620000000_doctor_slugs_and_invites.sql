-- Backfill doctor slugs with uniqueness handling
DO $$
DECLARE
  doc RECORD;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT;
BEGIN
  FOR doc IN SELECT id, name FROM rw_doctors WHERE slug IS NULL ORDER BY created_at ASC
  LOOP
    -- Strip "Dr." prefix, lowercase, replace non-alphanum with hyphens, trim hyphens
    base_slug := TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(REGEXP_REPLACE(doc.name, '^Dr\.?\s*', '', 'i'), '[^a-zA-Z0-9]+', '-', 'g')));
    IF base_slug = '' THEN base_slug := 'doctor'; END IF;

    final_slug := base_slug;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM rw_doctors WHERE slug = final_slug) LOOP
      final_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE rw_doctors SET slug = final_slug WHERE id = doc.id;
  END LOOP;
END $$;

-- Make slug NOT NULL now that all rows are backfilled
ALTER TABLE rw_doctors ALTER COLUMN slug SET NOT NULL;

-- Create invites table
CREATE TABLE IF NOT EXISTS rw_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES rw_practices(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by UUID REFERENCES rw_doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days'
);

-- Public can read invites (to validate tokens during registration)
CREATE POLICY rw_invites_select ON rw_invites FOR SELECT USING (true);
ALTER TABLE rw_invites ENABLE ROW LEVEL SECURITY;
