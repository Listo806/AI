import { Injectable } from "@nestjs/common";
import axios from "axios";
import qs from "qs";

import { DatabaseService } from "../../database/database.service";

@Injectable()
export class InstagramService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  getAuthUrl(teamId: string) {
    const params = qs.stringify({
      client_id: process.env.META_APP_ID,

      redirect_uri:
        process.env.META_REDIRECT_URI,

      response_type: "code",

      state: teamId,

      scope: [
        "instagram_basic",
        "instagram_manage_messages",
        "pages_show_list",
        "pages_manage_metadata",
        "pages_messaging",
      ].join(","),
    });

    return `https://www.facebook.com/v22.0/dialog/oauth?${params}`;
  }

  async exchangeCodeForToken(
    code: string,
  ) {
    const response = await axios.get(
      "https://graph.facebook.com/v22.0/oauth/access_token",
      {
        params: {
          client_id:
            process.env.META_APP_ID,

          client_secret:
            process.env.META_APP_SECRET,

          redirect_uri:
            process.env.META_REDIRECT_URI,

          code,
        },
      },
    );

    return response.data;
  }

  async getPages(accessToken: string) {
    const response = await axios.get(
      "https://graph.facebook.com/v22.0/me/accounts",
      {
        params: {
          access_token: accessToken,
        },
      },
    );

    return response.data.data;
  }

  async getInstagramAccount(
    pageId: string,
    pageAccessToken: string,
  ) {
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${pageId}`,
      {
        params: {
          fields:
            "instagram_business_account,name",

          access_token:
            pageAccessToken,
        },
      },
    );

    return response.data;
  }

  async getInstagramProfile(
    instagramId: string,
    accessToken: string,
  ) {
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${instagramId}`,
      {
        params: {
          fields:
            "id,username,profile_picture_url",

          access_token: accessToken,
        },
      },
    );

    return response.data;
  }

  async saveIntegration({
    teamId,
    page,
    instagram,
    accessToken,
  }) {
    const { rows } = await this.db.query(
      `
      INSERT INTO instagram_integrations (
        team_id,
        facebook_page_id,
        facebook_page_name,
        instagram_account_id,
        instagram_username,
        access_token
      )
      VALUES ($1,$2,$3,$4,$5,$6)

      ON CONFLICT (team_id)
      DO UPDATE SET
        facebook_page_id = EXCLUDED.facebook_page_id,
        facebook_page_name = EXCLUDED.facebook_page_name,
        instagram_account_id = EXCLUDED.instagram_account_id,
        instagram_username = EXCLUDED.instagram_username,
        access_token = EXCLUDED.access_token,
        updated_at = NOW()

      RETURNING
        team_id as "teamId",
        instagram_username as "instagramUsername",
        sync_enabled as "syncEnabled"
      `,
      [
        teamId,

        page.id,
        page.name,

        instagram.id,
        instagram.username,

        accessToken,
      ],
    );

    return rows[0];
  }

  async getConfig(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT
        team_id as "teamId",
        facebook_page_name as "pageName",
        instagram_username as "instagramUsername",
        sync_enabled as "syncEnabled",
        created_at as "createdAt"
      FROM instagram_integrations
      WHERE team_id = $1
      `,
      [teamId],
    );

    return rows[0] || null;
  }

  async getStatus(teamId: string) {
    const config =
      await this.getConfig(teamId);

    return {
      isConfigured: !!config,
      isActive: !!config,
      config,
    };
  }

  async toggleSync(
    teamId: string,
    enabled: boolean,
  ) {
    await this.db.query(
      `
      UPDATE instagram_integrations
      SET sync_enabled = $1,
          updated_at = NOW()
      WHERE team_id = $2
      `,
      [enabled, teamId],
    );

    return {
      success: true,
    };
  }

  async disconnect(teamId: string) {
    await this.db.query(
      `
      DELETE FROM instagram_integrations
      WHERE team_id = $1
      `,
      [teamId],
    );

    return {
      success: true,
    };
  }
}