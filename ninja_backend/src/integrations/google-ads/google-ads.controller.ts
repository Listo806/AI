import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

import { CurrentUser } from "../../auth/decorators/current-user.decorator";

import { GoogleAdsService } from "./google-ads.service";

@Controller(
  "integrations/google-ads",
)
@UseGuards(JwtAuthGuard)
export class GoogleAdsController {
  constructor(
    private readonly googleAdsService: GoogleAdsService,
  ) {}

  @Get("auth-url")
  getAuthUrl() {
    return {
      url: this.googleAdsService.getAuthUrl(),
    };
  }

  @Get("callback")
  async callback(
    @Query("code")
    code: string,

    @Query("state")
    state: string,

    @Res()
    res: any,
  ) {
    await this.googleAdsService.handleCallback(
      code,
      state,
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard/integrations/google-ads?connected=true`,
    );
  }

  @Get()
  async getConfig(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getConfig(
      user.teamId,
    );
  }

  @Get("campaigns")
  async campaigns(
    @CurrentUser() user: any,
  ) {
    return this.googleAdsService.getCampaigns(
      user.teamId,
    );
  }

  @Post("settings")
  async save(
    @CurrentUser() user: any,

    @Body()
    body: any,
  ) {
    return this.googleAdsService.saveSettings(
      user.teamId,
      body,
    );
  }
}