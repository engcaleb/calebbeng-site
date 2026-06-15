-- Admin-defined recommended product set per surgery type.
-- Doctors see these on new page creation and can restore to them via "Restore defaults".
CREATE TABLE rw_default_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_type TEXT NOT NULL,
  product_id  UUID NOT NULL REFERENCES rw_products(id) ON DELETE CASCADE,
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE (surgery_type, product_id)
);

-- Anyone can read defaults (patient page queries and portal editor both need them)
ALTER TABLE rw_default_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read default products"
  ON rw_default_products FOR SELECT
  USING (true);
