import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

// Storage for images that admins upload for custom emails (bulk + single-customer
// composers). Render's filesystem is ephemeral (wiped on every deploy), so files on
// disk would break already-sent emails; instead the bytes live in Postgres and are
// served from a STABLE public URL (/api/email/asset/:id) with long cache headers, so
// an image never dies in a customer's inbox. Small volume, admin-only uploads.
@Injectable()
export class EmailAssetService {
  private readonly logger = new Logger(EmailAssetService.name);
  private ready = false;

  constructor(private readonly db: DatabaseService) {}

  private async ensureSchema(): Promise<void> {
    if (this.ready) return;
    await this.db.query(
      `CREATE TABLE IF NOT EXISTS email_assets (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         mime VARCHAR(100) NOT NULL,
         filename TEXT,
         data BYTEA NOT NULL,
         size INT NOT NULL DEFAULT 0,
         created_by UUID,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
    );
    this.ready = true;
  }

  private backendUrl(): string {
    return (
      process.env.BACKEND_URL ||
      process.env.PUBLIC_BACKEND_URL ||
      'https://backend.cortexaaicrm.com'
    ).replace(/\/+$/, '');
  }

  /** Absolute, stable public URL for an asset id (safe to embed in an email). */
  publicUrl(id: string): string {
    return `${this.backendUrl()}/api/email/asset/${id}`;
  }

  /** Store an uploaded image and return its id + public URL. */
  async store(opts: {
    buffer: Buffer;
    mime: string;
    filename?: string | null;
    adminId?: string | null;
  }): Promise<{ id: string; url: string; size: number }> {
    await this.ensureSchema();
    const size = opts.buffer.length;
    const { rows } = await this.db.query(
      `INSERT INTO email_assets (mime, filename, data, size, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [opts.mime, opts.filename || null, opts.buffer, size, opts.adminId || null],
    );
    const id = rows[0].id;
    this.logger.log(`Stored email asset ${id} (${opts.mime}, ${size} bytes)`);
    return { id, url: this.publicUrl(id), size };
  }

  /** Fetch an asset's bytes + mime for serving. Null if not found. */
  async get(id: string): Promise<{ mime: string; data: Buffer } | null> {
    await this.ensureSchema();
    if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return null;
    try {
      const { rows } = await this.db.query(
        `SELECT mime, data FROM email_assets WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (!rows.length) return null;
      const data = rows[0].data;
      return { mime: rows[0].mime, data: Buffer.isBuffer(data) ? data : Buffer.from(data) };
    } catch (err: any) {
      this.logger.error(`get asset ${id} failed: ${err?.message}`);
      return null;
    }
  }
}
