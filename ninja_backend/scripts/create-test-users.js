require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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
      database: url.pathname.slice(1),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${error.message}`);
  }
}

/**
 * Test user configurations for each plan
 */
const TEST_USERS = [
  {
    email: 'free@test.com',
    password: 'test123456',
    role: 'owner',
    planName: 'FREE',
    teamName: 'Free Plan Team',
  },
  {
    email: 'pro@test.com',
    password: 'test123456',
    role: 'owner',
    planName: 'PRO',
    teamName: 'Pro Plan Team',
  },
  {
    email: 'proplus@test.com',
    password: 'test123456',
    role: 'owner',
    planName: 'PRO PLUS',
    teamName: 'Pro Plus Plan Team',
  },
  {
    email: 'promax@test.com',
    password: 'test123456',
    role: 'owner',
    planName: 'PRO MAX',
    teamName: 'Pro Max Plan Team',
  },
  {
    email: 'aicrm-proplus@test.com',
    password: 'test123456',
    role: 'owner',
    planName: 'AI CRM – PRO+', // Note: en dash (–) not hyphen (-)
    teamName: 'AI CRM Pro+ Team',
  },
  {
    email: 'aicrm-elite@test.com',
    password: 'test123456',
    role: 'owner',
    planName: 'AI CRM – ELITE', // Note: en dash (–) not hyphen (-)
    teamName: 'AI CRM Elite Team',
  },
  {
    email: 'aicrm-enterprise@test.com',
    password: 'test123456',
    role: 'owner',
    planName: 'AI CRM – ENTERPRISE', // Note: en dash (–) not hyphen (-)
    teamName: 'AI CRM Enterprise Team',
  },
  {
    email: 'no-subscription@test.com',
    password: 'test123456',
    role: 'owner',
    planName: null, // No subscription
    teamName: 'No Subscription Team',
  },
];

async function createTestUsers() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please set DATABASE_URL in your .env file.');
    process.exit(1);
  }

  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: dbConfig.ssl,
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('Connected successfully!\n');

    console.log('Creating test users for each subscription plan...\n');

    const results = [];

    for (const userConfig of TEST_USERS) {
      try {
        console.log(`Creating user: ${userConfig.email} (${userConfig.planName || 'No Subscription'})...`);

        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [userConfig.email]
        );

        let userId;
        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;
          console.log(`  ⚠️  User already exists, using existing user ID: ${userId}`);
        } else {
          // Hash password
          const hashedPassword = await bcrypt.hash(userConfig.password, 10);

          // Create user
          const userResult = await pool.query(
            `INSERT INTO users (email, password, role, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, true, NOW(), NOW())
             RETURNING id, email, role`,
            [userConfig.email, hashedPassword, userConfig.role]
          );
          userId = userResult.rows[0].id;
          console.log(`  ✅ User created: ${userId}`);
        }

        // Check if team already exists for this user
        const existingTeam = await pool.query(
          'SELECT id FROM teams WHERE owner_id = $1',
          [userId]
        );

        let teamId;
        if (existingTeam.rows.length > 0) {
          teamId = existingTeam.rows[0].id;
          console.log(`  ⚠️  Team already exists, using existing team ID: ${teamId}`);
        } else {
          // Create team
          const teamResult = await pool.query(
            `INSERT INTO teams (name, owner_id, seat_limit, created_at, updated_at)
             VALUES ($1, $2, 1, NOW(), NOW())
             RETURNING id, name`,
            [userConfig.teamName, userId]
          );
          teamId = teamResult.rows[0].id;
          console.log(`  ✅ Team created: ${teamId}`);

          // Link user to team
          await pool.query(
            'UPDATE users SET team_id = $1, updated_at = NOW() WHERE id = $2',
            [teamId, userId]
          );
          console.log(`  ✅ User linked to team`);
        }

        // Handle subscription
        if (userConfig.planName) {
          // Get plan ID
          const planResult = await pool.query(
            'SELECT id FROM subscription_plans WHERE name = $1',
            [userConfig.planName]
          );

          if (planResult.rows.length === 0) {
            console.log(`  ⚠️  Plan "${userConfig.planName}" not found, skipping subscription`);
            results.push({
              email: userConfig.email,
              password: userConfig.password,
              planName: userConfig.planName,
              userId,
              teamId,
              subscriptionId: null,
              status: 'plan_not_found',
            });
            continue;
          }

          const planId = planResult.rows[0].id;

          // Check if subscription already exists
          const existingSubscription = await pool.query(
            'SELECT id, status FROM subscriptions WHERE team_id = $1',
            [teamId]
          );

          let subscriptionId;
          if (existingSubscription.rows.length > 0) {
            subscriptionId = existingSubscription.rows[0].id;
            const currentStatus = existingSubscription.rows[0].status;
            console.log(`  ⚠️  Subscription already exists (${currentStatus}), updating to ${userConfig.planName}...`);

            // Update existing subscription
            await pool.query(
              `UPDATE subscriptions 
               SET plan_id = $1, status = 'active', 
                   current_period_start = NOW(), 
                   current_period_end = NOW() + INTERVAL '1 month',
                   updated_at = NOW()
               WHERE id = $2`,
              [planId, subscriptionId]
            );
            console.log(`  ✅ Subscription updated`);
          } else {
            // Create subscription
            const subscriptionResult = await pool.query(
              `INSERT INTO subscriptions (
                team_id, plan_id, status, seat_limit,
                current_period_start, current_period_end,
                created_at, updated_at
              )
              VALUES ($1, $2, 'active', 1, NOW(), NOW() + INTERVAL '1 month', NOW(), NOW())
              RETURNING id, status`,
              [teamId, planId]
            );
            subscriptionId = subscriptionResult.rows[0].id;
            console.log(`  ✅ Subscription created: ${subscriptionId} (active)`);
          }

          // Link subscription to team
          await pool.query(
            'UPDATE teams SET subscription_id = $1, updated_at = NOW() WHERE id = $2',
            [subscriptionId, teamId]
          );
          console.log(`  ✅ Subscription linked to team`);

          results.push({
            email: userConfig.email,
            password: userConfig.password,
            planName: userConfig.planName,
            userId,
            teamId,
            subscriptionId,
            status: 'active',
          });
        } else {
          // No subscription
          console.log(`  ℹ️  No subscription (testing read-only access)`);
          results.push({
            email: userConfig.email,
            password: userConfig.password,
            planName: null,
            userId,
            teamId,
            subscriptionId: null,
            status: 'no_subscription',
          });
        }

        console.log('');
      } catch (error) {
        console.error(`  ❌ Error creating user ${userConfig.email}:`, error.message);
        results.push({
          email: userConfig.email,
          password: userConfig.password,
          planName: userConfig.planName,
          error: error.message,
          status: 'error',
        });
        console.log('');
      }
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log('\nTest Users Created:\n');
    
    results.forEach((result) => {
      if (result.status === 'error') {
        console.log(`❌ ${result.email} - ERROR: ${result.error}`);
      } else {
        const planInfo = result.planName || 'No Subscription';
        const statusIcon = result.status === 'active' ? '✅' : 'ℹ️';
        console.log(`${statusIcon} ${result.email}`);
        console.log(`   Password: ${result.password}`);
        console.log(`   Plan: ${planInfo}`);
        console.log(`   User ID: ${result.userId}`);
        console.log(`   Team ID: ${result.teamId}`);
        if (result.subscriptionId) {
          console.log(`   Subscription ID: ${result.subscriptionId}`);
        }
        console.log('');
      }
    });

    console.log('='.repeat(60));
    console.log('\n✅ Test users creation completed!');
    console.log('\nYou can now use these credentials to test subscription enforcement:');
    console.log('\nExample:');
    console.log('  Email: free@test.com');
    console.log('  Password: test123456');
    console.log('  Plan: FREE (0 listings, no CRM, no AI)');
    console.log('\n  Email: proplus@test.com');
    console.log('  Password: test123456');
    console.log('  Plan: PRO PLUS (unlimited listings, CRM, AI)');

  } catch (error) {
    console.error('Failed to create test users:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUsers();
}

module.exports = { createTestUsers };
