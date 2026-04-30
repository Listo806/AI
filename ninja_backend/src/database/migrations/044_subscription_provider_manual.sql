-- Allow 'manual' provider for subscriptions (plan selection without payment gateway)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_provider_check'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_provider_check;
  END IF;

  -- Normalize before adding constraint (avoid 23514 on existing bad rows)
  UPDATE subscriptions
  SET provider = 'stripe'
  WHERE provider IS NULL
     OR trim(provider) = ''
     OR lower(provider) NOT IN ('stripe', 'paypal', 'paddle', 'manual');

  ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_provider_check
  CHECK (provider IN ('stripe', 'paypal', 'paddle', 'manual'));
END $$;
