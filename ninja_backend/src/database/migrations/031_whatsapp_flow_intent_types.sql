-- Migration: Extend intent_events.intent_type for Master Funnel flows
-- New values: buyer_search, seller_listing, agent_crm, general_support

DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'intent_events' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%intent_type%';
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE intent_events DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE intent_events ADD CONSTRAINT intent_events_intent_type_check
  CHECK (intent_type IN (
    'buy', 'rent', 'sell', 'agent_request', 'general',
    'buyer_search', 'seller_listing', 'agent_crm', 'general_support'
  ));
