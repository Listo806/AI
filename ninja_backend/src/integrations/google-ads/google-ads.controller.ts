import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  Res,
} from "@nestjs/common";

import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { GoogleAdsService } from "./google-ads.service";

@Controller("integrations/google-ads")
@UseGuards(JwtAuthGuard)
export class GoogleAdsController {
  constructor(
    private readonly googleAdsService: GoogleAdsService,
  ) {}

  private requireTeam(user: any): string {
    if (!user.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  /*
   |--------------------------------------------------------------------------
   | STATUS
   |--------------------------------------------------------------------------
   */

  @Get("config/status")
  async getStatus(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getStatus(
      this.requireTeam(user),
    );
  }

  /*
   |--------------------------------------------------------------------------
   | CONNECT
   |--------------------------------------------------------------------------
   */

  @Get("connect")
  async connect(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getAuthUrl(
      this.requireTeam(user),
    );
  }

  /*
   |--------------------------------------------------------------------------
   | CALLBACK
   |--------------------------------------------------------------------------
   */

  @Get("callback")
  async callback(
    @Query("code") code: string,

    @Query("state") teamId: string,

    @Res() res: Response,
  ) {
    await this.googleAdsService.handleCallback(
      code,
      teamId,
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard/integrations/google-ads?connected=true`,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | CAMPAIGNS
   |--------------------------------------------------------------------------
   */

  @Get("campaigns")
  async campaigns(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getCampaigns(
      this.requireTeam(user),
    );
  }

  /*
   |--------------------------------------------------------------------------
   | SAVE SETTINGS
   |--------------------------------------------------------------------------
   */

  @Post("settings")
  async save(
    @CurrentUser() user: any,

    @Body() body: any,
  ) {
    return this.googleAdsService.saveSettings(
      this.requireTeam(user),
      body,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | DISCONNECT
   |--------------------------------------------------------------------------
   */

  @Post("disconnect")
  async disconnect(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.disconnect(
      this.requireTeam(user),
    );
  }
}