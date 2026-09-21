CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notification_preferences jsonb NOT NULL DEFAULT '{
    "newLeadAssigned": true,
    "newCustomerMessage": true,
    "appointmentUpdates": true,
    "taskUpdates": true,
    "pipelineChanges": true,
    "aiHumanAssistance": true,
    "importantTeamActivity": true,
    "billingAccountAlerts": true,
    "emailNotifications": true,
    "inAppNotifications": true
  }'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{
    "timeZone": "UTC",
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "12h",
    "currency": "USD",
    "defaultLandingPage": "/dashboard",
    "defaultWorkspace": null
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at DESC);
