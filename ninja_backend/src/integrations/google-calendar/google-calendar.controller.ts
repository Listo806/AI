import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { Response } from "express";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PaymentGuard } from "../../auth/guards/payment.guard";
import { Public } from "../../auth/decorators/public.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

import { GoogleCalendarService } from "./google-calendar.service";

@Controller("integrations/google-calendar")
@UseGuards(JwtAuthGuard, PaymentGuard)
export class GoogleCalendarController {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  private requireTeam(user: any): string {
    if (!user.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  @Get("auth-url")
  async getAuthUrl(
    @CurrentUser() user: any,
  ) {
    return this.googleCalendarService.getAuthUrl(
      this.requireTeam(user),
    );
  }

  @Public()
  @Get("callback")
  async callback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ) {
    await this.googleCalendarService.handleCallback(
      code,
      state,
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard/integrations?connected=google_calendar`,
    );
  }

  @Get("config/status")
  async getStatus(
    @CurrentUser() user: any,
  ) {
    return this.googleCalendarService.getStatus(
      this.requireTeam(user),
    );
  }
}