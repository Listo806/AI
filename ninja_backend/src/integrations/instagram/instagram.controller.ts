import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { InstagramService } from "./instagram.service";

@Controller("integrations/instagram")
@UseGuards(JwtAuthGuard)
export class InstagramController {
  constructor(
    private readonly instagramService: InstagramService,
  ) {}

  private requireTeam(user: any): string {
    if (!user?.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  @Get("connect")
  async connect(
    @CurrentUser() user: any,
  ) {
    return {
      url: this.instagramService.getAuthUrl(
        this.requireTeam(user),
      ),
    };
  }

  @Get("callback")
  async callback(
    @Query("code") code: string,

    @Query("state") teamId: string,

    @Res() res: Response,
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
  async config(
    @CurrentUser() user: any,
  ) {
    return this.instagramService.getConfig(
      this.requireTeam(user),
    );
  }

  @Get("config/status")
  async status(
    @CurrentUser() user: any,
  ) {
    return this.instagramService.getStatus(
      this.requireTeam(user),
    );
  }

  @Post("toggle-sync")
  async toggleSync(
    @CurrentUser() user: any,

    @Body()
    body: {
      enabled: boolean;
    },
  ) {
    return this.instagramService.toggleSync(
      this.requireTeam(user),

      body.enabled,
    );
  }

  @Delete("disconnect")
  async disconnect(
    @CurrentUser() user: any,
  ) {
    return this.instagramService.disconnect(
      this.requireTeam(user),
    );
  }
}