import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CalendarService } from "./calendar.service";

@Controller("calendar")
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  private requireTeam(user: any): string {
    if (!user?.teamId) {
      throw new ForbiddenException("User must belong to a team");
    }
    return user.teamId;
  }

  private userId(user: any): string | null {
    return user?.id || user?._id || user?.userId || null;
  }

  @Get("appointments")
  list(
    @CurrentUser() user: any,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.calendar.list(this.requireTeam(user), from, to);
  }

  @Get("stats")
  stats(
    @CurrentUser() user: any,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.calendar.stats(this.requireTeam(user), from, to);
  }

  @Post("appointments")
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.calendar.create(this.requireTeam(user), this.userId(user), body);
  }

  @Patch("appointments/:id")
  update(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.calendar.update(this.requireTeam(user), id, body);
  }

  @Delete("appointments/:id")
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.calendar.remove(this.requireTeam(user), id);
  }
}
