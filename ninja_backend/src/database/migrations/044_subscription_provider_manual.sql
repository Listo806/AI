-- Allow 'manual' provider for subscriptions (plan selection without payment gateway)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_provider_check'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_provider_check;
  END IF;
  ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_provider_check
  CHECK (provider IN ('stripe', 'paypal', 'paddle', 'manual'));
END $$;
