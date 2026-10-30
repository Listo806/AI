import { Injectable } from "@nestjs/common";
import { google } from "googleapis";
import axios from "axios";
import { createHmac, timingSafeEqual } from "crypto";
import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

@Injectable()
export class GoogleAdsService {
  constructor(private readonly db: DatabaseService) {}

  /*
   |--------------------------------------------------------------------------
   | OAUTH CLIENT
   |--------------------------------------------------------------------------
   */

  private getOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_ADS_REDIRECT_URI,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | AUTH URL
   |--------------------------------------------------------------------------
   */

  private oauthStateSecret(): string {
    const secret = process.env.GOOGLE_ADS_OAUTH_STATE_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new ServiceUnavailableException('OAuth state signing secret not configured');
    return secret;
  }

  async getAuthUrl(teamId: string) {
    const client = this.getOAuthClient();
    const payload = Buffer.from(JSON.stringify({ teamId, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url');
    const signature = createHmac('sha256', this.oauthStateSecret()).update(payload).digest('base64url');
    return { url: client.generateAuthUrl({
      access_type: 'offline', prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/adwords'],
      state: `${payload}.${signature}`,
    }) };
  }

  private parseState(state: string): string {
    const [payload, signature, extra] = (state || '').split('.');
    if (!payload || !signature || extra) throw new BadRequestException('Invalid OAuth state');
    const expected = createHmac('sha256', this.oauthStateSecret()).update(payload).digest();
    let actual: Buffer;
    try { actual = Buffer.from(signature, 'base64url'); } catch { throw new BadRequestException('Invalid OAuth state'); }
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new BadRequestException('Invalid OAuth state');
    let parsed: any;
    try { parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { throw new BadRequestException('Invalid OAuth state'); }
    if (typeof parsed.teamId !== 'string' || !/^[0-9a-f-]{36}$/i.test(parsed.teamId) ||
        !Number.isFinite(parsed.exp) || parsed.exp < Date.now()) throw new BadRequestException('Expired OAuth state');
    return parsed.teamId;
  }

  async handleCallback(code: string, state: string) {
    if (!code) throw new BadRequestException('Missing OAuth authorization code');
    const teamId = this.parseState(state);
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) throw new BadRequestException('Google did not return a refresh token; reconnect with consent');
    const target = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(target)) {
      throw new ServiceUnavailableException('GOOGLE_ADS_CUSTOMER_ID must be a ten-digit Ads customer ID');
    }
    if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
      throw new ServiceUnavailableException('Google Ads developer token is missing');
    }
    // customers:listAccessibleCustomers may list only the manager (MCC), not its
    // child account. Verify access to the *target* account using the Ads API.
    const loginCustomer = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/\D/g, '');
    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokens.access_token}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'Content-Type': 'application/json',
    };
    if (loginCustomer) headers['login-customer-id'] = loginCustomer;
    try {
      await axios.post(
        `https://googleads.googleapis.com/${process.env.GOOGLE_ADS_API_VERSION || 'v22'}/customers/${target}/googleAds:search`,
        { query: 'SELECT customer.id FROM customer LIMIT 1' },
        { headers, timeout: 15000 },
      );
    } catch (error: any) {
      // Do not store credentials for an unverified customer or leak API details.
      throw new BadRequestException('Google Ads OAuth account cannot access the configured customer; check MCC permissions and developer token');
    }

    // Serialize callbacks for a team. The production table has no UNIQUE(team_id),
    // so ON CONFLICT(team_id) cannot be used; an advisory lock avoids duplicate
    // rows from concurrent callbacks without modifying the live schema.
    await this.db.transaction(async client => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`google_ads:${teamId}`]);
      const existing = await client.query(
        'SELECT id FROM google_ads_integrations WHERE team_id=$1 ORDER BY updated_at DESC LIMIT 1',
        [teamId],
      );
      if (existing.rows.length) {
        await client.query(`UPDATE google_ads_integrations
          SET google_ads_account_id=$2, access_token=$3, refresh_token=$4, updated_at=NOW()
          WHERE id=$1`, [existing.rows[0].id, target, tokens.access_token, tokens.refresh_token]);
      } else {
        await client.query(`INSERT INTO google_ads_integrations
          (team_id,google_ads_account_id,access_token,refresh_token,conversion_tracking_enabled)
          VALUES ($1,$2,$3,$4,false)`,
          [teamId, target, tokens.access_token, tokens.refresh_token]);
      }
    });
    return { success: true };
  }

  /*
   |--------------------------------------------------------------------------
   | GET STATUS
   |--------------------------------------------------------------------------
   */

  async getStatus(teamId: string) {
    const integration = await this.getIntegration(teamId);

    if (!integration?.refresh_token) {
      return { isConfigured: false };
    }

    return {
      isConfigured: true,

      integration: {
        google_ads_account_id: integration.google_ads_account_id,

        conversion_tracking_enabled: integration.conversion_tracking_enabled,
      },
    };
  }

  /*
   |--------------------------------------------------------------------------
   | GET INTEGRATION
   |--------------------------------------------------------------------------
   */

  async getPublicIntegration(teamId: string) {
    const record = await this.getIntegration(teamId);
    if (!record) return null;
    return { id: record.id, team_id: record.team_id, google_ads_account_id: record.google_ads_account_id,
      google_ads_account_name: record.google_ads_account_name, conversion_tracking_enabled: record.conversion_tracking_enabled,
      selected_campaign_ids: record.selected_campaign_ids, isConfigured: Boolean(record.refresh_token) };
  }

  async getIntegration(teamId: string) {
    const { rows } = await this.db.query(
      `
        SELECT *
        FROM google_ads_integrations
        WHERE team_id = $1
        LIMIT 1
        `,
      [teamId],
    );

    return rows[0] || null;
  }

  /*
   |--------------------------------------------------------------------------
   | DISCONNECT
   |--------------------------------------------------------------------------
   */

  async disconnect(teamId: string) {
    await this.db.query(
      `
      DELETE FROM google_ads_integrations
      WHERE team_id = $1
      `,
      [teamId],
    );

    return {
      success: true,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | GET ACCESS TOKEN
   |--------------------------------------------------------------------------
   */

  private async getAccessToken(integration: any) {
    const oauth2Client = this.getOAuthClient();

    oauth2Client.setCredentials({
      access_token: integration.access_token,

      refresh_token: integration.refresh_token,
    });

    /*
     * AUTO REFRESH
     */

    const refreshed = await oauth2Client.getAccessToken();

    const accessToken = refreshed.token;

    if (accessToken) {
      await this.db.query(
        `
        UPDATE google_ads_integrations
        SET
          access_token = $1,
          updated_at = NOW()
        WHERE team_id = $2
        `,
        [accessToken, integration.team_id],
      );
    }

    return accessToken;
  }

  /*
   |--------------------------------------------------------------------------
   | GET CAMPAIGNS
   |--------------------------------------------------------------------------
   */

  async getCampaigns(teamId: string) {
    try {
      const integration = await this.getIntegration(teamId);

      if (!integration) {
        return [];
      }

      const accessToken = await this.getAccessToken(integration);

      const response = await axios.post(
        `https://googleads.googleapis.com/${process.env.GOOGLE_ADS_API_VERSION || 'v22'}/customers/${integration.google_ads_account_id}/googleAds:search`,
        {
          query: `
            SELECT
              campaign.id,
              campaign.name,
              campaign.status
            FROM campaign
            ORDER BY campaign.name
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,

            "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,

            "login-customer-id": (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || integration.google_ads_account_id || "").replace(/-/g, ""),

            "Content-Type": "application/json",
          },
        },
      );

      return response.data.results || [];
    } catch (err: any) {
      console.error("GOOGLE ADS CAMPAIGNS ERROR", err?.response?.data || err);

      throw err;
    }
  }

  /*
   |--------------------------------------------------------------------------
   | SAVE SETTINGS
   |--------------------------------------------------------------------------
   */

  async saveSettings(teamId: string, body: any) {
    await this.db.query(
      `
      UPDATE google_ads_integrations
      SET
        selected_campaign_ids = $1,
        conversion_tracking_enabled = $2,
        updated_at = NOW()
      WHERE team_id = $3
      `,
      [
        JSON.stringify(body.selectedCampaignIds || []),

        body.conversionTrackingEnabled,

        teamId,
      ],
    );

    return {
      success: true,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | TRACK LEAD CONVERSION
   |--------------------------------------------------------------------------
   */

  async trackLeadConversion(teamId: string, leadValue: number) {
    const integration = await this.getIntegration(teamId);

    if (!integration || !integration.conversion_tracking_enabled) {
      return;
    }

    console.log("TRACK GOOGLE ADS CONVERSION", {
      teamId,
      leadValue,
    });

    /*
     * REAL IMPLEMENTATION:
     *
     * UploadClickConversionsRequest
     * Google Ads Offline Conversion Tracking
     */
  }
}
