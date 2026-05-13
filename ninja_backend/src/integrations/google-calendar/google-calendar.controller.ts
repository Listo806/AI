import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

import { GoogleCalendarService } from "./google-calendar.service";

@Controller("integrations/google-calendar")
@UseGuards(JwtAuthGuard)
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

  @Get("callback")
  async callback(
    @Query("code") code: string,
    @Query("state") state: string,
  ) {
    return this.googleCalendarService.handleCallback(
      code,
      state,
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