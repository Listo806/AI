require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * Parse DATABASE_URL and extract components
 */
function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading '/'
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${error.message}`);
  }
}

/**
 * Create a connection to the default 'postgres' database
 */
function createAdminPool(dbConfig) {
  return new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres', // Connect to default database
    ssl: dbConfig.ssl,
  });
}

/**
 * Check if database exists
 */
async function databaseExists(adminPool, databaseName) {
  const result = await adminPool.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [databaseName]
  );
  return result.rows.length > 0;
}

/**
 * Create database if it doesn't exist
 */
async function createDatabaseIfNotExists(adminPool, databaseName) {
  const exists = await databaseExists(adminPool, databaseName);
  
  if (exists) {
    console.log(`Database '${databaseName}' already exists.`);
    return false;
  }

  console.log(`Creating database '${databaseName}'...`);
  // Note: We can't use parameterized queries for CREATE DATABASE
  // So we need to escape the database name
  const escapedName = databaseName.replace(/"/g, '""');
  await adminPool.query(`CREATE DATABASE "${escapedName}"`);
  console.log(`Database '${databaseName}' created successfully!`);
  return true;
}

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please set DATABASE_URL in your .env file.');
    process.exit(1);
  }

  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  const databaseName = dbConfig.database;

  if (!databaseName) {
    console.error('Error: No database name found in DATABASE_URL.');
    process.exit(1);
  }

  const adminPool = createAdminPool(dbConfig);

  try {
    console.log('Connecting to PostgreSQL server...');
    await adminPool.query('SELECT 1');

    // Create database if it doesn't exist
    await createDatabaseIfNotExists(adminPool, databaseName);
    await adminPool.end();

    // Now connect to the target database and run migrations
    console.log(`Connecting to database '${databaseName}'...`);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: dbConfig.ssl,
    });

    await pool.query('SELECT 1');
    console.log('Connected successfully!');

    console.log('Running migrations...');
    
    // Run initial schema migration
    const migration1Path = path.join(__dirname, '../src/database/migrations/001_initial_schema.sql');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
    await pool.query(migration1SQL);
    console.log('✓ Initial schema migration completed');

    // Run Milestone 2 schema migration
    const migration2Path = path.join(__dirname, '../src/database/migrations/002_milestone2_schema.sql');
    const migration2SQL = fs.readFileSync(migration2Path, 'utf8');
    await pool.query(migration2SQL);
    console.log('✓ Milestone 2 schema migration completed');

    // Run Milestone 3 schema migration
    const migration3Path = path.join(__dirname, '../src/database/migrations/003_milestone3_subscriptions.sql');
    const migration3SQL = fs.readFileSync(migration3Path, 'utf8');
    await pool.query(migration3SQL);
    console.log('✓ Milestone 3 schema migration completed');

    // Run Production Readiness migration
    const migration4Path = path.join(__dirname, '../src/database/migrations/004_production_readiness.sql');
    if (fs.existsSync(migration4Path)) {
      const migration4SQL = fs.readFileSync(migration4Path, 'utf8');
      await pool.query(migration4SQL);
      console.log('✓ Production readiness migration completed');
    }

    // Run Milestone 4 Storage migration
    const migration5Path = path.join(__dirname, '../src/database/migrations/005_milestone4_storage.sql');
    if (fs.existsSync(migration5Path)) {
      const migration5SQL = fs.readFileSync(migration5Path, 'utf8');
      await pool.query(migration5SQL);
      console.log('✓ Milestone 4 storage migration completed');
    }

    // Run Milestone 4 Push Notifications migration
    const migration6Path = path.join(__dirname, '../src/database/migrations/006_milestone4_push_notifications.sql');
    if (fs.existsSync(migration6Path)) {
      const migration6SQL = fs.readFileSync(migration6Path, 'utf8');
      await pool.query(migration6SQL);
      console.log('✓ Milestone 4 push notifications migration completed');
    }

    console.log('Database schema created successfully!');

    await pool.end();
    console.log('Database setup complete.');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

setupDatabase();

