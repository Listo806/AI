import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";

import { InstagramService } from "./instagram.service";

@Controller("integrations/instagram")
export class InstagramController {
  constructor(
    private readonly instagramService: InstagramService,
  ) {}

  @Get("connect")
  async connect(@Req() req) {
    const teamId = req.user.teamId;

    return {
      url: this.instagramService.getAuthUrl(
        teamId,
      ),
    };
  }

  @Get("callback")
  async callback(
    @Query("code") code: string,

    @Query("state") teamId: string,

    @Res() res,
  ) {
    try {
      const tokenData =
        await this.instagramService.exchangeCodeForToken(
          code,
        );

      const accessToken =
        tokenData.access_token;

      const pages =
        await this.instagramService.getPages(
          accessToken,
        );

      if (!pages.length) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/dashboard/integrations/instagram?error=no_pages`,
        );
      }

      const page = pages[0];

      const igAccount =
        await this.instagramService.getInstagramAccount(
          page.id,
          page.access_token,
        );

      if (
        !igAccount.instagram_business_account
      ) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/dashboard/integrations/instagram?error=no_instagram`,
        );
      }

      const profile =
        await this.instagramService.getInstagramProfile(
          igAccount.instagram_business_account
            .id,

          page.access_token,
        );

      await this.instagramService.saveIntegration(
        {
          teamId,

          page,

          instagram: profile,

          accessToken,
        },
      );

      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard/integrations/instagram?success=1`,
      );
    } catch (err) {
      console.error(err);

      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard/integrations/instagram?error=oauth_failed`,
      );
    }
  }

  @Get("config")
  async config(@Req() req) {
    return this.instagramService.getConfig(
      req.user.teamId,
    );
  }

  @Get("config/status")
  async status(@Req() req) {
    return this.instagramService.getStatus(
      req.user.teamId,
    );
  }

  @Post("toggle-sync")
  async toggleSync(
    @Req() req,

    @Body() body,
  ) {
    return this.instagramService.toggleSync(
      req.user.teamId,

      body.enabled,
    );
  }

  @Delete("disconnect")
  async disconnect(@Req() req) {
    return this.instagramService.disconnect(
      req.user.teamId,
    );
  }
}