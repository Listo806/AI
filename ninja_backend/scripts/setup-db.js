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
  console.log('Creating admin pool with config:', dbConfig);

  return new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres', // Connect to default database
    // ssl: { rejectUnauthorized: false }, //dbConfig.ssl,
    ssl: false,
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
      // ssl: { rejectUnauthorized: false },
      ssl: false,
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

    // Run Milestone 5 Analytics migration
    const migration7Path = path.join(__dirname, '../src/database/migrations/007_milestone5_analytics.sql');
    if (fs.existsSync(migration7Path)) {
      const migration7SQL = fs.readFileSync(migration7Path, 'utf8');
      await pool.query(migration7SQL);
      console.log('✓ Milestone 5 analytics migration completed');
    }

    // Run Paddle Integration migration
    const migration8Path = path.join(__dirname, '../src/database/migrations/008_paddle_integration.sql');
    if (fs.existsSync(migration8Path)) {
      const migration8SQL = fs.readFileSync(migration8Path, 'utf8');
      await pool.query(migration8SQL);
      console.log('✓ Paddle integration migration completed');
    }

    // Run Add property_id to leads migration
    const migration9Path = path.join(__dirname, '../src/database/migrations/009_add_property_id_to_leads.sql');
    if (fs.existsSync(migration9Path)) {
      const migration9SQL = fs.readFileSync(migration9Path, 'utf8');
      await pool.query(migration9SQL);
      console.log('✓ Add property_id to leads migration completed');
    }

    // Run Add wholesaler and investor roles migration
    const migration10Path = path.join(__dirname, '../src/database/migrations/010_add_wholesaler_investor_roles.sql');
    if (fs.existsSync(migration10Path)) {
      const migration10SQL = fs.readFileSync(migration10Path, 'utf8');
      await pool.query(migration10SQL);
      console.log('✓ Add wholesaler and investor roles migration completed');
    }

    // Run Update lead status enum migration
    const migration11Path = path.join(__dirname, '../src/database/migrations/011_update_lead_status_enum.sql');
    if (fs.existsSync(migration11Path)) {
      const migration11SQL = fs.readFileSync(migration11Path, 'utf8');
      await pool.query(migration11SQL);
      console.log('✓ Update lead status enum migration completed');
    }

    // Run Add Last Contacted At column to leads table migration
    const migration12Path = path.join(__dirname, '../src/database/migrations/012_add_last_contacted_at_to_leads.sql');
    if (fs.existsSync(migration12Path)) {
      const migration12SQL = fs.readFileSync(migration12Path, 'utf8');
      await pool.query(migration12SQL);
      console.log('✓ Add Last Contacted At column to leads table migration completed');
    }

    // Run Add last_activity_at and last_action_type columns to leads table migration
    const migration13Path = path.join(__dirname, '../src/database/migrations/013_add_lead_action_tracking.sql');
    if (fs.existsSync(migration13Path)) {
      const migration13SQL = fs.readFileSync(migration13Path, 'utf8');
      await pool.query(migration13SQL);
      console.log('✓ Add last_activity_at and last_action_type columns to leads table migration completed');
    }

    // Run Milestone 5 Subscription Enforcement migration
    const migration14Path = path.join(__dirname, '../src/database/migrations/014_milestone5_subscription_enforcement.sql');
    if (fs.existsSync(migration14Path)) {
      const migration14SQL = fs.readFileSync(migration14Path, 'utf8');
      await pool.query(migration14SQL);
      console.log('✓ Milestone 5 subscription enforcement migration completed');
    }

    // Seed subscription plans
    const migration15Path = path.join(__dirname, '../src/database/migrations/015_seed_subscription_plans.sql');
    if (fs.existsSync(migration15Path)) {
      const migration15SQL = fs.readFileSync(migration15Path, 'utf8');
      await pool.query(migration15SQL);
      console.log('✓ Subscription plans seeded');
    }


    // Intelligence foundation migration
    const migration16Path = path.join(__dirname, '../src/database/migrations/016_milestone1_intelligence_foundation.sql');
    if (fs.existsSync(migration16Path)) {
      const migration16SQL = fs.readFileSync(migration16Path, 'utf8');
      await pool.query(migration16SQL);
      console.log('✓ Intelligence foundation migration completed');
    }

    // VA role migration
    const migration17Path = path.join(__dirname, '../src/database/migrations/017_add_va_role_and_edited_by.sql');
    if (fs.existsSync(migration17Path)) {
      const migration17SQL = fs.readFileSync(migration17Path, 'utf8');
      await pool.query(migration17SQL);
      console.log('✓ VA role migration completed');
    }

    // Agent priority engine
    const migration18Path = path.join(__dirname, '../src/database/migrations/018_milestone2_agent_priority_engine.sql');
    if (fs.existsSync(migration18Path)) {
      const migration18SQL = fs.readFileSync(migration18Path, 'utf8');
      await pool.query(migration18SQL);
      console.log('✓ Agent priority engine migration completed');
    }

    // Buyer confidence + match intelligence
    const migration19Path = path.join(__dirname, '../src/database/migrations/019_milestone3_buyer_confidence.sql');
    if (fs.existsSync(migration19Path)) {
      const migration19SQL = fs.readFileSync(migration19Path, 'utf8');
      await pool.query(migration19SQL);
      console.log('✓ Buyer confidence + match intelligence migration completed');
    }

    // Milestone 4: Lead creation + channel attribution
    const migration20Path = path.join(__dirname, '../src/database/migrations/020_milestone4_lead_attribution.sql');
    if (fs.existsSync(migration20Path)) {
      const migration20SQL = fs.readFileSync(migration20Path, 'utf8');
      await pool.query(migration20SQL);
      console.log('✓ Milestone 4 lead attribution migration completed');
    }

    // Milestone 6: AI Copilot + Zapier
    const migration21Path = path.join(__dirname, '../src/database/migrations/021_milestone6_ai_copilot.sql');
    if (fs.existsSync(migration21Path)) {
      const migration21SQL = fs.readFileSync(migration21Path, 'utf8');
      await pool.query(migration21SQL);
      console.log('✓ Milestone 6 AI Copilot + Zapier migration completed');
    }

    const migration22Path = path.join(__dirname, '../src/database/migrations/022_leads_priority.sql');
    if (fs.existsSync(migration22Path)) {
      const migration22SQL = fs.readFileSync(migration22Path, 'utf8');
      await pool.query(migration22SQL);
      console.log('✓ Leads priority migration completed');
    }

    // Milestone 5: Messaging (WhatsApp + Email)
    const migration23Path = path.join(__dirname, '../src/database/migrations/023_milestone5_messaging.sql');
    if (fs.existsSync(migration23Path)) {
      const migration23SQL = fs.readFileSync(migration23Path, 'utf8');
      await pool.query(migration23SQL);
      console.log('✓ Milestone 5 messaging migration completed');
    }

    // Agent-Owned WhatsApp (Phase 2 Final Milestone)
    const migration24Path = path.join(__dirname, '../src/database/migrations/024_agent_owned_whatsapp.sql');
    if (fs.existsSync(migration24Path)) {
      const migration24SQL = fs.readFileSync(migration24Path, 'utf8');
      await pool.query(migration24SQL);
      console.log('✓ Agent-owned WhatsApp migration completed');
    }

    // Instagram DM (Phase 2 Milestone 2)
    const migration25Path = path.join(__dirname, '../src/database/migrations/025_instagram_dm.sql');
    if (fs.existsSync(migration25Path)) {
      const migration25SQL = fs.readFileSync(migration25Path, 'utf8');
      await pool.query(migration25SQL);
      console.log('✓ Instagram DM migration completed');
    }

    // CORTEXA WhatsApp Core (conversations, routing, lead_messages extensions)
    const migration26Path = path.join(__dirname, '../src/database/migrations/026_whatsapp_cortexa_core.sql');
    if (fs.existsSync(migration26Path)) {
      const migration26SQL = fs.readFileSync(migration26Path, 'utf8');
      await pool.query(migration26SQL);
      console.log('✓ CORTEXA WhatsApp Core migration completed');
    }

    // CORTEXA WhatsApp Core Add-ons (stage + intent_events)
    const migration27Path = path.join(__dirname, '../src/database/migrations/027_whatsapp_intent_stage_nextq.sql');
    if (fs.existsSync(migration27Path)) {
      const migration27SQL = fs.readFileSync(migration27Path, 'utf8');
      await pool.query(migration27SQL);
      console.log('✓ CORTEXA WhatsApp Add-ons (stage + intent_events) migration completed');
    }

    // CORTEXA WhatsApp Broadcast Add-on (broadcast_events audit log)
    const migration28Path = path.join(__dirname, '../src/database/migrations/028_broadcast_events.sql');
    if (fs.existsSync(migration28Path)) {
      const migration28SQL = fs.readFileSync(migration28Path, 'utf8');
      await pool.query(migration28SQL);
      console.log('✓ CORTEXA WhatsApp Broadcast (broadcast_events) migration completed');
    }

    // CRM EXTENSION MIGRATION
    const migration29Path = path.join(__dirname, '../src/database/migrations/029_crm_extension.sql');
    if (fs.existsSync(migration29Path)) {
      const migration29SQL = fs.readFileSync(migration29Path, 'utf8');
      await pool.query(migration29SQL);
      console.log('✓ CRM EXTENSION migration completed');
    }
    
    // AI CENTER MIGRATION
    const migration30Path = path.join(__dirname, '../src/database/migrations/030_ai_center.sql');
    if (fs.existsSync(migration30Path)) {
      const migration30SQL = fs.readFileSync(migration30Path, 'utf8');
      await pool.query(migration30SQL);
      console.log('✓ AI CENTER migration completed');
    }

    // WhatsApp Flow Intent Types (buyer_search, seller_listing, agent_crm, general_support)
    const migration31Path = path.join(__dirname, '../src/database/migrations/031_whatsapp_flow_intent_types.sql');
    if (fs.existsSync(migration31Path)) {
      const migration31SQL = fs.readFileSync(migration31Path, 'utf8');
      await pool.query(migration31SQL);
      console.log('✓ WhatsApp Flow Intent Types migration completed');
    }

    // Leads metadata for property flow (property_title, seller_type)
    const migration32Path = path.join(__dirname, '../src/database/migrations/032_leads_metadata.sql');
    if (fs.existsSync(migration32Path)) {
      const migration32SQL = fs.readFileSync(migration32Path, 'utf8');
      await pool.query(migration32SQL);
      console.log('✓ Leads metadata migration completed');
    }

    // Platform Auth and Admin (roles, property status, origin)
    const migration33Path = path.join(__dirname, '../src/database/migrations/033_platform_auth_admin.sql');
    if (fs.existsSync(migration33Path)) {
      const migration33SQL = fs.readFileSync(migration33Path, 'utf8');
      await pool.query(migration33SQL);
      console.log('✓ Platform Auth and Admin migration completed');
    }

    // AI Setter - Lead state, parsed entities, property visibility
    const migration34Path = path.join(__dirname, '../src/database/migrations/034_ai_setter_lead_state.sql');
    if (fs.existsSync(migration34Path)) {
      const migration34SQL = fs.readFileSync(migration34Path, 'utf8');
      await pool.query(migration34SQL);
      console.log('✓ AI Setter lead state migration completed');
    }
    
    // Property Thumbnail url
    const migration35Path = path.join(__dirname, '../src/database/migrations/035_property_thumbnail_url.sql');
    if (fs.existsSync(migration35Path)) {
      const migration35SQL = fs.readFileSync(migration35Path, 'utf8');
      await pool.query(migration35SQL);
      console.log('✓ Property thumbnail url migration completed');
    }

    // Property media unique primary constraint
    const migration36Path = path.join(__dirname, '../src/database/migrations/036_property_media_unique_primary.sql');
    if (fs.existsSync(migration36Path)) {
      const migration36SQL = fs.readFileSync(migration36Path, 'utf8');
      await pool.query(migration36SQL);
      console.log('✓ Property media unique primary migration completed');
    }
    
    //Property Type Marketplace
    const migration37Path = path.join(__dirname, '../src/database/migrations/037_property_type_marketplace.sql');
    if (fs.existsSync(migration37Path)) {
      const migration37SQL = fs.readFileSync(migration37Path, 'utf8');
      await pool.query(migration37SQL);
      console.log('✓ Property type marketplace migration completed');
    }
    
    // Property Type Enum
    const migration38Path = path.join(__dirname, '../src/database/migrations/038_property_type_enum.sql');
    if (fs.existsSync(migration38Path)) {
      const migration38SQL = fs.readFileSync(migration38Path, 'utf8');
      await pool.query(migration38SQL);
      console.log('✓ Property type enum migration completed');
    }

    // Add name to users
    const migration39Path = path.join(__dirname, '../src/database/migrations/039_add_name_to_users.sql');
    if (fs.existsSync(migration39Path)) {
      const migration39SQL = fs.readFileSync(migration39Path, 'utf8');
      await pool.query(migration39SQL);
      console.log('✓ Add name to users migration completed');
    }

    // Deals table for CRM pipeline
    const migration40Path = path.join(__dirname, '../src/database/migrations/040_deals.sql');
    if (fs.existsSync(migration40Path)) {
      const migration40SQL = fs.readFileSync(migration40Path, 'utf8');
      await pool.query(migration40SQL);
      console.log('✓ Deals pipeline migration completed');
    }

    // Deals: created_by, assigned_to
    const migration41Path = path.join(__dirname, '../src/database/migrations/041_deals_created_by_assigned_to.sql');
    if (fs.existsSync(migration41Path)) {
      const migration41SQL = fs.readFileSync(migration41Path, 'utf8');
      await pool.query(migration41SQL);
      console.log('✓ Deals created_by/assigned_to migration completed');
    }

    // Contacts table for CRM
    const migration42Path = path.join(__dirname, '../src/database/migrations/042_contacts.sql');
    if (fs.existsSync(migration42Path)) {
      const migration42SQL = fs.readFileSync(migration42Path, 'utf8');
      await pool.query(migration42SQL);
      console.log('✓ Contacts migration completed');
    }

    // Per-agent Meta app settings for Instagram OAuth
    const migration43Path = path.join(__dirname, '../src/database/migrations/043_agent_meta_app_settings.sql');
    if (fs.existsSync(migration43Path)) {
      const migration43SQL = fs.readFileSync(migration43Path, 'utf8');
      await pool.query(migration43SQL);
      console.log('✓ Agent Meta app settings migration completed');
    }

    const migration44Path = path.join(__dirname, '../src/database/migrations/044_subscription_provider_manual.sql');
    if (fs.existsSync(migration44Path)) {
      const migration44SQL = fs.readFileSync(migration44Path, 'utf8');
      await pool.query(migration44SQL);
      console.log('✓ Subscription provider manual migration completed');
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

