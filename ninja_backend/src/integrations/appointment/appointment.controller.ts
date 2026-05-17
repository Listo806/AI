import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

import { AppointmentService } from "./appointment.service";

@Controller("integrations/appointment")
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  private requireTeam(user: any) {
    if (!user?.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  @Get()
  async get(@CurrentUser() user: any) {
    console.log("APPOINTMENT CONTROLLER HIT");
    return this.appointmentService.get(
      this.requireTeam(user),
    );
  }

  @Post()
  async save(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.appointmentService.save(
      this.requireTeam(user),
      body,
    );
  }

  @Get("status")
  async status(@CurrentUser() user: any) {
    const config = await this.appointmentService.get(
      this.requireTeam(user),
    );

    return {
      isConfigured: !!config,
    };
  }
}