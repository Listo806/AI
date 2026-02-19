/**
 * Seed properties for manual verification (pagination load test).
 * Run: node scripts/seed-properties-for-test.js [count]
 * Default: 5000 properties
 * Requires: DATABASE_URL, and at least one user + team in DB
 */
require('dotenv').config();
const { Pool } = require('pg');

const COUNT = parseInt(process.argv[2] || '5000', 10);

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows: users } = await client.query(
      `SELECT id FROM users WHERE is_active = true LIMIT 1`
    );
    const { rows: teams } = await client.query(
      `SELECT id FROM teams LIMIT 1`
    );
    const userId = users[0]?.id;
    const teamId = teams[0]?.id ?? null;

    if (!userId) {
      console.error('No active user found. Create a user first.');
      process.exit(1);
    }

    console.log(`Seeding ${COUNT} properties (user=${userId}, team=${teamId})...`);
    const start = Date.now();

    for (let i = 0; i < COUNT; i++) {
      await client.query(
        `INSERT INTO properties (
          title, description, address, city, state, zip_code, price, type, status,
          bedrooms, bathrooms, square_feet, created_by, team_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
        [
          `Test Property ${i + 1}`,
          `Description for property ${i}`,
          `${100 + (i % 900)} Main St`,
          ['Austin', 'Houston', 'Dallas', 'San Antonio'][i % 4],
          'TX',
          String(77000 + (i % 9999)),
          200000 + (i % 500000),
          i % 2 === 0 ? 'sale' : 'rent',
          i % 5 === 0 ? 'draft' : 'published',
          2 + (i % 4),
          2 + (i % 2),
          1200 + (i % 2000),
          userId,
          teamId,
        ]
      );
      if ((i + 1) % 500 === 0) console.log(`  ${i + 1}/${COUNT}...`);
    }

    console.log(`Done. ${COUNT} properties in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
