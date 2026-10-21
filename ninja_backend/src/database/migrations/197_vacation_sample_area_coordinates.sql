-- Approximate CITY/AREA CENTER coordinates for the 57 illustrative vacation samples.
-- These are NOT property addresses or verified precise locations.
-- Update ONLY known sample IDs with missing coordinates; do not change real listings.
-- Run against the intended PostgreSQL database after backup.
BEGIN;
CREATE TABLE IF NOT EXISTS listoqasa_vacation_location_precision (
  property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  precision_level TEXT NOT NULL CHECK (precision_level IN ('area_approximate','exact_verified')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
WITH area_points(external_id, latitude, longitude) AS (
 VALUES
  ('LQ-VR-EC-001', -0.18070, -78.46780),
  ('LQ-VR-EC-002', -2.18940, -79.88910),
  ('LQ-VR-EC-003', -2.90010, -79.00590),
  ('LQ-VR-EC-004', -0.96770, -80.70890),
  ('LQ-VR-EC-005', -1.82530, -80.75210),
  ('LQ-VR-EC-006', -1.39690, -78.42470),
  ('LQ-VR-EC-007', -2.21450, -80.95150),
  ('LQ-VR-EC-008', 0.88890, -79.81270),
  ('LQ-VR-EC-009', -2.63330, -80.38330),
  ('LQ-VR-CO-001', 6.24420, -75.58120),
  ('LQ-VR-CO-002', 4.71100, -74.07210),
  ('LQ-VR-CO-003', 10.39100, -75.47940),
  ('LQ-VR-CO-004', 11.24080, -74.19900),
  ('LQ-VR-CO-005', 3.45160, -76.53200),
  ('LQ-VR-CO-006', 10.96850, -74.78130),
  ('LQ-VR-PE-001', -12.04640, -77.04280),
  ('LQ-VR-PE-002', -13.53190, -71.96750),
  ('LQ-VR-PE-003', -16.40900, -71.53750),
  ('LQ-VR-PE-004', -4.10600, -81.05300),
  ('LQ-VR-PE-005', -13.31800, -72.08000),
  ('LQ-VR-PE-006', -12.04640, -77.04280),
  ('LQ-VR-CL-001', -33.44890, -70.66930),
  ('LQ-VR-CL-002', -33.04720, -71.61270),
  ('LQ-VR-CL-003', -33.01530, -71.55000),
  ('LQ-VR-CL-004', -39.28200, -71.95430),
  ('LQ-VR-CL-005', -41.31950, -72.98540),
  ('LQ-VR-CL-006', -33.44890, -70.66930),
  ('LQ-VR-AR-001', -34.60370, -58.38160),
  ('LQ-VR-AR-002', -41.13350, -71.31030),
  ('LQ-VR-AR-003', -32.88950, -68.84580),
  ('LQ-VR-AR-004', -31.42010, -64.18880),
  ('LQ-VR-AR-005', -32.94420, -60.65050),
  ('LQ-VR-AR-006', -34.60370, -58.38160),
  ('LQ-VR-BR-001', -22.90680, -43.17290),
  ('LQ-VR-BR-002', -23.55050, -46.63330),
  ('LQ-VR-BR-003', -27.59490, -48.54820),
  ('LQ-VR-BR-004', -12.97770, -38.50160),
  ('LQ-VR-BR-005', -8.04760, -34.87700),
  ('LQ-VR-BR-006', -3.73190, -38.52670),
  ('LQ-VR-MX-001', 19.43260, -99.13320),
  ('LQ-VR-MX-002', 20.21140, -87.46540),
  ('LQ-VR-MX-003', 21.16190, -86.85150),
  ('LQ-VR-MX-004', 20.62960, -87.07390),
  ('LQ-VR-MX-005', 22.89050, -109.91670),
  ('LQ-VR-MX-006', 19.43260, -99.13320),
  ('LQ-VR-PA-001', 8.98240, -79.51990),
  ('LQ-VR-PA-002', 9.34030, -82.24200),
  ('LQ-VR-PA-003', 8.77660, -82.43200),
  ('LQ-VR-PA-004', 8.52400, -79.89200),
  ('LQ-VR-PA-005', 8.98240, -79.51990),
  ('LQ-VR-PA-006', 9.34030, -82.24200),
  ('LQ-VR-CR-001', 9.92810, -84.09070),
  ('LQ-VR-CR-002', 10.29930, -85.83710),
  ('LQ-VR-CR-003', 9.61460, -84.62970),
  ('LQ-VR-CR-004', 9.40930, -84.15560),
  ('LQ-VR-CR-005', 9.98050, -85.65290),
  ('LQ-VR-CR-006', 9.92810, -84.09070)
), updated AS (
 UPDATE properties p
 SET latitude = a.latitude, longitude = a.longitude
 FROM listoqasa_vacation_samples s JOIN area_points a ON a.external_id=s.external_id
 WHERE p.id=s.property_id AND p.listing_type='vacation'
   AND (p.latitude IS NULL OR p.longitude IS NULL)
 RETURNING p.id
)
INSERT INTO listoqasa_vacation_location_precision(property_id,precision_level,updated_at)
SELECT id,'area_approximate',now() FROM updated
ON CONFLICT(property_id) DO UPDATE SET precision_level='area_approximate',updated_at=now();
COMMIT;
-- Audit: count the actual deployed database, not the expected 57.
SELECT count(*) AS total_samples,
 count(*) FILTER(WHERE p.latitude IS NULL OR p.longitude IS NULL) AS missing_coordinates,
 count(*) FILTER(WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL) AS with_coordinates,
 count(*) FILTER(WHERE l.precision_level='area_approximate') AS approximate_locations
FROM listoqasa_vacation_samples s JOIN properties p ON p.id=s.property_id
LEFT JOIN listoqasa_vacation_location_precision l ON l.property_id=p.id;
