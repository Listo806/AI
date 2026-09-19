import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('❌ DATABASE_URL is missing');
      process.exit(1);
    }
    
    // Determine if SSL is required
    // Render, Heroku, AWS RDS, and other cloud providers require SSL
    const requiresSSL = 
      process.env.NODE_ENV === 'production' ||
      databaseUrl.includes('render.com') ||
      databaseUrl.includes('herokuapp.com') ||
      databaseUrl.includes('amazonaws.com') ||
      databaseUrl.includes('rds.amazonaws.com') ||
      process.env.DATABASE_SSL === 'true';

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: requiresSSL ? { rejectUnauthorized: false } : false,
    });

    try {
      await this.pool.query('SELECT 1');
      console.log('PostgreSQL connected');
    } catch (err) {
      console.error('Database connection failed:', err);
      process.exit(1);
    }
    //await this.runMigrations();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Run all queries in `work` on the same PostgreSQL connection.
   * Commits only when the whole callback succeeds; otherwise rolls back.
   *
   * IMPORTANT:
   * Inside `work`, use the supplied `client` instead of this.query().
   */
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await work(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Database rollback failed:', rollbackError);
      }

      throw error;
    } finally {
      client.release();
    }
  }
  /*
  async runMigrations() {
    console.log('👉 Running migrations...');

    try {
      await this.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS plan TEXT;
      `);
      console.log('✅ Added plan');

      await this.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS payment_status TEXT;
      `);
      console.log('✅ Added payment_status');

      await this.query(`
        ALTER TABLE team_invitations
        ADD COLUMN IF NOT EXISTS invitee_name TEXT;
      `);
      console.log('✅ Added team_invitations.invitee_name');

    } catch (err) {
      console.error('❌ Migration error FULL:', err);
    }
  }*/
}

