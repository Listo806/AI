CREATE TABLE IF NOT EXISTS setup_assistance_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES setup_assistance_requests(id) ON DELETE CASCADE,
  previous_status text NULL,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  internal_note text NULL,
  customer_response text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_setup_assistance_history_request
  ON setup_assistance_status_history(request_id, created_at ASC);
