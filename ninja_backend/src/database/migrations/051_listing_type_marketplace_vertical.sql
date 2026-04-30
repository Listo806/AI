-- ============================================================
-- Migration 051: LISTO QASA — listing_type vertical (mandatory)
-- marketplace | vacation; type = sale|rent only for marketplace; NULL for vacation
-- ============================================================

ALTER TABLE properties DROP CONSTRAINT IF EXISTS chk_listing_type;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS chk_properties_listing_type_vertical;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS chk_properties_marketplace_type;

ALTER TABLE properties ALTER COLUMN type DROP NOT NULL;

-- Legacy rows used listing_type sale/rent for marketplace vertical
UPDATE properties
SET listing_type = 'marketplace'
WHERE listing_type IN ('sale', 'rent');

UPDATE properties
SET type = NULL
WHERE listing_type = 'vacation';

-- Safety: any marketplace row missing type (should not happen)
UPDATE properties
SET type = 'sale'
WHERE listing_type = 'marketplace' AND type IS NULL;

ALTER TABLE properties ADD CONSTRAINT chk_properties_listing_type_vertical
  CHECK (listing_type IN ('marketplace', 'vacation'));

ALTER TABLE properties ADD CONSTRAINT chk_properties_marketplace_type
  CHECK (
    (listing_type = 'marketplace' AND type IN ('sale', 'rent'))
    OR (listing_type = 'vacation' AND type IS NULL)
  );

ALTER TABLE properties ALTER COLUMN listing_type SET DEFAULT 'marketplace';

COMMENT ON COLUMN properties.listing_type IS 'marketplace = buy/rent (homes); vacation = short-term rentals only';
COMMENT ON COLUMN properties.type IS 'sale or rent when listing_type=marketplace; must be NULL when listing_type=vacation';
