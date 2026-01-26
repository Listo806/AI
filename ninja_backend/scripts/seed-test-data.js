require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Seed test data for Milestones 1, 2, and 3
 */
async function seedTestData() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please set DATABASE_URL in your .env file.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('Connected successfully!');

    console.log('Loading seed data script...');
    const seedScriptPath = path.join(__dirname, 'seed-test-data-milestones-1-3.sql');
    
    if (!fs.existsSync(seedScriptPath)) {
      console.error(`Error: Seed script not found at ${seedScriptPath}`);
      process.exit(1);
    }

    const seedSQL = fs.readFileSync(seedScriptPath, 'utf8');
    
    console.log('Running seed data script...');
    console.log('This may take a few moments...\n');
    
    await pool.query(seedSQL);
    
    console.log('\n✓ Test data seeded successfully!');
    console.log('\nSummary:');
    console.log('  - Zones created');
    console.log('  - Buyers created (5 buyers with various intent levels)');
    console.log('  - Buyer events created');
    console.log('  - Intent scores created');
    console.log('  - Intent snapshots created (for spike detection)');
    console.log('  - Leads created (linked to buyers)');
    console.log('  - Properties created (with zone_id for comps testing)');
    console.log('  - Buyer property views created');
    console.log('  - Zone scarcity history created');
    console.log('\nYou can now test:');
    console.log('  - GET /api/events (log events)');
    console.log('  - GET /api/buyers/:id/intent (get intent scores)');
    console.log('  - GET /api/market/signals?zoneId=... (get market signals)');
    console.log('  - GET /api/agents/:id/priority-feed (get priority feed)');
    console.log('  - GET /api/listings/:id/comps?buyerId=... (get comps)');
    console.log('  - GET /api/listings/:id/match-explanation?buyerId=... (get match explanation)');
    console.log('\nUse the buyer IDs and agent ID from the summary output above.');

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error seeding test data:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.position) {
      console.error(`Error position: ${error.position}`);
    }
    process.exit(1);
  }
}

seedTestData();
