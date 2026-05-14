import {
  Controller,
  Get,
  Query,
  Req,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { GoogleAdsService } from "./google-ads.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

@Controller("integrations/google-ads")
@UseGuards(JwtAuthGuard)
export class GoogleAdsController {
  constructor(
    private readonly googleAdsService: GoogleAdsService,
  ) {}

  private requireTeam(user: any): string {
    if (!user?.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  /*
   |------------------------------------------------------------------
   | GET CONFIG
   |------------------------------------------------------------------
   */

  @Get()
  async getConfig(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getIntegration(
      this.requireTeam(user),
    );
  }

  /*
   |------------------------------------------------------------------
   | AUTH URL
   |------------------------------------------------------------------
   */

  @Get("auth-url")
  async getAuthUrl(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getAuthUrl(
      this.requireTeam(user),
    );
  }

  /*
   |------------------------------------------------------------------
   | CALLBACK
   |------------------------------------------------------------------
   */

  @Get("callback")
  async callback(
    @Query("code") code: string,

    @Query("state") teamId: string,
  ) {
    return this.googleAdsService.handleCallback(
      code,
      teamId,
    );
  }

  /*
   |------------------------------------------------------------------
   | STATUS
   |------------------------------------------------------------------
   */

  @Get("config/status")
  async status(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getStatus(
      this.requireTeam(user),
    );
  }

  /*
   |------------------------------------------------------------------
   | CAMPAIGNS
   |------------------------------------------------------------------
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
   |------------------------------------------------------------------
   | SAVE SETTINGS
   |------------------------------------------------------------------
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
   |------------------------------------------------------------------
   | DISCONNECT
   |------------------------------------------------------------------
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