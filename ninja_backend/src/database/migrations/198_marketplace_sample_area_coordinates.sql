-- ListoQasa marketplace samples only: APPROXIMATE CITY/AREA LOCATIONS.
-- Never represent these as verified street-address coordinates.
-- Back up database first. Genuine listings are excluded via sample-import join.
-- Uses a single city center per area, not a fabricated individual house position.
BEGIN;
WITH area_points(city, latitude, longitude) AS (
  VALUES
    ('quito', -0.1807::numeric, -78.4678::numeric),
    ('guayaquil', -2.1894, -79.8891),
    ('cuenca', -2.9001, -79.0059),
    ('samborondón', -2.1397, -79.8645),
    ('samborondon', -2.1397, -79.8645),
    ('cumbayá', -0.2003, -78.4326),
    ('cumbaya', -0.2003, -78.4326),
    ('manta', -0.9677, -80.7089),
    ('tumbaco', -0.2104, -78.4028)
)
UPDATE properties p
SET latitude = a.latitude, longitude = a.longitude, updated_at = NOW()
FROM listoqasa_sample_imports si, area_points a
WHERE si.property_id = p.id
  AND LOWER(TRIM(p.city)) = a.city
  AND LOWER(TRIM(p.country)) = 'ecuador'
  AND p.listing_type = 'marketplace'
  AND p.type IN ('sale','rent')
  AND (p.latitude IS NULL OR p.longitude IS NULL);
COMMIT;

-- Inspect totals after applying (the database is the source of truth).
SELECT p.city, p.type, COUNT(*) AS sample_listings,
 COUNT(*) FILTER (WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL) AS with_coordinates,
 COUNT(*) FILTER (WHERE p.latitude IS NULL OR p.longitude IS NULL) AS missing_coordinates
FROM properties p JOIN listoqasa_sample_imports si ON si.property_id = p.id
WHERE p.listing_type = 'marketplace' AND p.type IN ('sale','rent')
GROUP BY p.city,p.type ORDER BY p.city,p.type;
