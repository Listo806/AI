import { Injectable } from "@nestjs/common";
import { google } from "googleapis";
import axios from "axios";

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

  async getAuthUrl(teamId: string) {
    const client = this.getOAuthClient();

    const url = client.generateAuthUrl({
      access_type: "offline",

      prompt: "consent",

      scope: ["https://www.googleapis.com/auth/adwords"],

      state: teamId,
    });

    return {
      url,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | HANDLE CALLBACK
   |--------------------------------------------------------------------------
   */

  async handleCallback(code: string, teamId: string) {
    const oauth2Client = this.getOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    /*
     * GET ACCESSIBLE ACCOUNTS
     */

    const customerRes = await axios.get(
      "https://googleads.googleapis.com/v16/customers:listAccessibleCustomers",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,

          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        },
      },
    );

    const customers = customerRes.data?.resourceNames || [];

    const accountId = customers[0]?.split("/")?.pop();

    /*
     * GET USER EMAIL
     */

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();

    await this.db.query(
      `
      INSERT INTO google_ads_integrations (
        team_id,
        google_email,
        google_ads_account_id,
        access_token,
        refresh_token,
        token_expiry,
        is_active,
        conversion_tracking_enabled,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,true,false,NOW()
      )

      ON CONFLICT (team_id)
      DO UPDATE SET
        google_email = EXCLUDED.google_email,
        google_ads_account_id = EXCLUDED.google_ads_account_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        is_active = true,
        updated_at = NOW()
      `,
      [
        teamId,
        userInfo.data.email,
        accountId,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      ],
    );

    return {
      success: true,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | GET STATUS
   |--------------------------------------------------------------------------
   */

  async getStatus(teamId: string) {
    const integration = await this.getIntegration(teamId);

    if (!integration) {
      return {
        isConfigured: false,
      };
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
    const integration = await this.getIntegration(teamId);

    if (!integration) {
      throw new Error("Google Ads not connected");
    }

    const accessToken = await this.getAccessToken(integration);

    const response = await axios.post(
      `https://googleads.googleapis.com/v16/customers/${integration.google_ads_account_id}/googleAds:search`,
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
        },
      },
    );

    return response.data.results || [];
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
