-- Isolated mapping for 57 fictional vacation-rental examples.
CREATE TABLE IF NOT EXISTS listoqasa_vacation_samples (
 external_id TEXT PRIMARY KEY,
 property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE RESTRICT,
 payload JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listoqasa_vacation_samples_property ON listoqasa_vacation_samples(property_id);
