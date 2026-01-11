import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL || '';
    
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
}

