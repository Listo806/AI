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

  getIsConfigured(): boolean {
    const appId = this.config.get('META_APP_ID');
    const secret = this.config.get('META_APP_SECRET');
    const redirect = this.config.get('META_INSTAGRAM_REDIRECT_URI');
    return !!(appId && secret && redirect);
  }

  /**
   * Build OAuth URL for Instagram (Meta) connect. state = base64(agentId).
   */
  getAuthUrl(agentId: string): string {
    if (!this.getIsConfigured()) {
      throw new BadRequestException('Instagram (Meta) is not configured');
    }
    const clientId = this.config.get('META_APP_ID');
    const redirectUri = this.config.get('META_INSTAGRAM_REDIRECT_URI');
    const state = Buffer.from(agentId, 'utf8').toString('base64url');
    const scope = ['instagram_basic', 'instagram_manage_messages', 'pages_show_list', 'pages_read_engagement'].join(',');
    const params = new URLSearchParams({
      client_id: clientId,
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

    const clientId = this.config.get('META_APP_ID');
    const clientSecret = this.config.get('META_APP_SECRET');
    const redirectUri = this.config.get('META_INSTAGRAM_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Instagram (Meta) is not configured');
    }

    const tokenRes = await fetch(
      `${META_TOKEN_URL}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(clientSecret)}&code=${encodeURIComponent(code)}`
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
