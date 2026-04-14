/**
 * Apply 050_properties_country_ecuador.sql to an EXISTING database.
 * Use this when you already ran setup:db before migration 050 existed.
 *
 * From ninja_backend/:  node scripts/apply-migration-050-country.js
 * Requires DATABASE_URL in .env
 */
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to ninja_backend/.env');
    process.exit(1);
  }
  const sqlPath = path.join(__dirname, '../src/database/migrations/050_properties_country_ecuador.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql);
    console.log('✓ Applied 050_properties_country_ecuador.sql');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
