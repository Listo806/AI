-- Final customer-flow hardening: an email address may own only one Cortexa account.
-- AuthService normalizes new signups, but the database must also protect against
-- simultaneous requests and case variants (Customer@x.com vs customer@x.com).
--
-- IMPORTANT: this migration intentionally does not delete/merge existing users.
-- If it fails because historical duplicates already exist, review those accounts
-- manually before rerunning; silently merging customer records would be unsafe.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx
  ON users (LOWER(email));
