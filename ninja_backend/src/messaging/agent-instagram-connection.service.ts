import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { encrypt, decrypt } from '../common/encryption.util';

const META_OAUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const META_GRAPH = 'https://graph.facebook.com/v18.0';

export interface InstagramConnectionStatus {
  connected: boolean;
  instagramUsername?: string;
}

export interface InstagramConnectionForSend {
  pageId: string;
  accessToken: string;
  instagramAccountId: string;
}

@Injectable()
export class AgentInstagramConnectionService {
  private readonly logger = new Logger(AgentInstagramConnectionService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Whether the agent has saved Meta app credentials and we have a public API URL for redirect.
   */
  async getIsConfigured(agentId: string): Promise<boolean> {
    const baseUrl = this.config.get('API_PUBLIC_URL');
    if (!baseUrl) return false;
    const { rows } = await this.db.query(
      `SELECT 1 FROM agent_meta_app_settings WHERE agent_id = $1`,
      [agentId],
    );
    return rows.length > 0;
  }

  async hasAppSettings(agentId: string): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT 1 FROM agent_meta_app_settings WHERE agent_id = $1`,
      [agentId],
    );
    return rows.length > 0;
  }

  /**
   * Save or update Meta app credentials for an agent (secret stored encrypted).
   */
  async saveAppSettings(agentId: string, appId: string, appSecret: string): Promise<void> {
    if (!appId?.trim() || !appSecret?.trim()) {
      throw new BadRequestException('App ID and App Secret are required');
    }
    const encrypted = encrypt(appSecret.trim());
    await this.db.query(
      `INSERT INTO agent_meta_app_settings (agent_id, meta_app_id, encrypted_meta_app_secret, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (agent_id) DO UPDATE SET
         meta_app_id = EXCLUDED.meta_app_id,
         encrypted_meta_app_secret = EXCLUDED.encrypted_meta_app_secret,
         updated_at = NOW()`,
      [agentId, appId.trim(), encrypted],
    );
  }

  private async getAppSettingsForOAuth(agentId: string): Promise<{ appId: string; appSecret: string } | null> {
    const { rows } = await this.db.query(
      `SELECT meta_app_id, encrypted_meta_app_secret FROM agent_meta_app_settings WHERE agent_id = $1`,
      [agentId],
    );
    if (!rows.length) return null;
    try {
      const appSecret = decrypt(rows[0].encrypted_meta_app_secret);
      return { appId: rows[0].meta_app_id, appSecret };
    } catch {
      return null;
    }
  }

  /**
   * Build OAuth URL for Instagram (Meta) connect. state = base64(agentId).
   * Uses agent's saved Meta app credentials; redirect_uri = API_PUBLIC_URL + /api/instagram/callback.
   */
  async getAuthUrl(agentId: string): Promise<string> {
    const baseUrl = this.config.get('API_PUBLIC_URL');
    if (!baseUrl?.trim()) {
      throw new BadRequestException('API_PUBLIC_URL is not configured. Set it in server environment.');
    }
    const settings = await this.getAppSettingsForOAuth(agentId);
    if (!settings) {
      throw new BadRequestException('Add your Meta app credentials first (App ID and App Secret)');
    }
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/instagram/callback`;
    const state = Buffer.from(agentId, 'utf8').toString('base64url');
    const scope = ['instagram_basic', 'instagram_manage_messages', 'pages_show_list', 'pages_read_engagement'].join(',');
    const params = new URLSearchParams({
      client_id: settings.appId,
      redirect_uri: redirectUri,
      scope,
      state,
      response_type: 'code',
    });
    return `${META_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange code for token, fetch Page + IG Business Account, store. state = base64(agentId).
   */
  async handleCallback(code: string, state: string): Promise<{ agentId: string }> {
    let agentId: string;
    try {
      agentId = Buffer.from(state, 'base64url').toString('utf8');
    } catch {
      throw new BadRequestException('Invalid state');
    }
    if (!code || !agentId) throw new BadRequestException('Missing code or state');

    const baseUrl = this.config.get('API_PUBLIC_URL');
    if (!baseUrl?.trim()) {
      throw new BadRequestException('API_PUBLIC_URL is not configured');
    }
    const settings = await this.getAppSettingsForOAuth(agentId);
    if (!settings) {
      throw new BadRequestException('Meta app credentials not found. Save App ID and App Secret first.');
    }
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/instagram/callback`;

    const tokenRes = await fetch(
      `${META_TOKEN_URL}?client_id=${encodeURIComponent(settings.appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(settings.appSecret)}&code=${encodeURIComponent(code)}`
    );
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      this.logger.warn(`Instagram OAuth token exchange failed: ${err}`);
      throw new BadRequestException('Instagram authorization failed');
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    const userAccessToken = tokenData.access_token;
    if (!userAccessToken) throw new BadRequestException('Instagram authorization failed');

    const accountsRes = await fetch(
      `${META_GRAPH}/me/accounts?fields=id,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userAccessToken)}`
    );
    if (!accountsRes.ok) {
      this.logger.warn('Instagram: failed to get pages');
      throw new BadRequestException('No Instagram Business account linked');
    }
    const accountsData = (await accountsRes.json()) as { data?: Array<{ id: string; access_token: string; instagram_business_account?: { id: string; username: string } }> };
    const pages = accountsData.data || [];
    const withIg = pages.find((p) => p.instagram_business_account?.id);
    if (!withIg?.instagram_business_account) {
      throw new BadRequestException('No Instagram Business account linked to your Page');
    }

    const pageId = withIg.id;
    const pageAccessToken = withIg.access_token;
    const igId = withIg.instagram_business_account.id;
    const igUsername = withIg.instagram_business_account.username || null;

    const encrypted = encrypt(pageAccessToken);
    await this.db.query(
      `INSERT INTO agent_instagram_connections (agent_id, instagram_account_id, instagram_username, page_id, encrypted_access_token, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'connected', NOW())
       ON CONFLICT (agent_id) DO UPDATE SET
         instagram_account_id = EXCLUDED.instagram_account_id,
         instagram_username = EXCLUDED.instagram_username,
         page_id = EXCLUDED.page_id,
         encrypted_access_token = EXCLUDED.encrypted_access_token,
         status = 'connected',
         updated_at = NOW()`,
      [agentId, igId, igUsername, pageId, encrypted],
    );
    this.logger.log(`Instagram connected: agent=${agentId} ig=${igUsername || igId}`);
    return { agentId };
  }

  async disconnect(agentId: string): Promise<void> {
    const { rowCount } = await this.db.query(
      `UPDATE agent_instagram_connections SET status = 'disconnected', updated_at = NOW() WHERE agent_id = $1`,
      [agentId],
    );
    if (rowCount) this.logger.log(`Instagram disconnected: agent=${agentId}`);
  }

  async getStatus(agentId: string): Promise<InstagramConnectionStatus> {
    const { rows } = await this.db.query(
      `SELECT instagram_username, status FROM agent_instagram_connections WHERE agent_id = $1`,
      [agentId],
    );
    if (!rows.length || rows[0].status !== 'connected') {
      return { connected: false };
    }
    return { connected: true, instagramUsername: rows[0].instagram_username || undefined };
  }

  async getForSend(agentId: string): Promise<InstagramConnectionForSend | null> {
    const { rows } = await this.db.query(
      `SELECT page_id, encrypted_access_token, instagram_account_id FROM agent_instagram_connections WHERE agent_id = $1 AND status = 'connected'`,
      [agentId],
    );
    if (!rows.length) return null;
    try {
      const accessToken = decrypt(rows[0].encrypted_access_token);
      return {
        pageId: rows[0].page_id,
        accessToken,
        instagramAccountId: rows[0].instagram_account_id,
      };
    } catch {
      this.logger.warn(`Instagram getForSend: decrypt failed for agent ${agentId}`);
      return null;
    }
  }

  async getAgentByInstagramAccountId(instagramAccountId: string): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT agent_id FROM agent_instagram_connections WHERE instagram_account_id = $1 AND status = 'connected'`,
      [instagramAccountId],
    );
    return rows.length ? rows[0].agent_id : null;
  }
}
