import {
  Controller,
  Get,
  Query,
  Req,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";

import { GoogleAdsService } from "./google-ads.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("integrations/google-ads")
@UseGuards(JwtAuthGuard)
export class GoogleAdsController {
  constructor(
    private readonly googleAdsService: GoogleAdsService,
  ) {}

  /*
   |--------------------------------------------------------------------------
   | AUTH URL
   |--------------------------------------------------------------------------
   */

  @Get("auth-url")
  async getAuthUrl(@Req() req: any) {
    return this.googleAdsService.getAuthUrl(
      req.user.teamId,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | OAUTH CALLBACK
   |--------------------------------------------------------------------------
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
   |--------------------------------------------------------------------------
   | STATUS
   |--------------------------------------------------------------------------
   */

  @Get("config/status")
  async status(@Req() req: any) {
    return this.googleAdsService.getStatus(
      req.user.teamId,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | CAMPAIGNS
   |--------------------------------------------------------------------------
   */

  @Get("campaigns")
  async campaigns(@Req() req: any) {
    return this.googleAdsService.getCampaigns(
      req.user.teamId,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | SAVE SETTINGS
   |--------------------------------------------------------------------------
   */

  @Post("settings")
  async save(
    @Req() req: any,

    @Body() body: any,
  ) {
    return this.googleAdsService.saveSettings(
      req.user.teamId,
      body,
    );
  }

  /*
   |--------------------------------------------------------------------------
   | DISCONNECT
   |--------------------------------------------------------------------------
   */

  @Post("disconnect")
  async disconnect(@Req() req: any) {
    return this.googleAdsService.disconnect(
      req.user.teamId,
    );
  }
}