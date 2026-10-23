-- Support owner-initiated pause/reactivation of marketplace listings.
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
CHECK (status IN ('draft','pending_review','approved','rejected','published','sold','rented','archived','reserved','paused'));
