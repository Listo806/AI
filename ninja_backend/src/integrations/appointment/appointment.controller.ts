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
import { DatabaseService } from "../../database/database.service";

@Controller("integrations/ai-appointment")
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly db: DatabaseService,
  ) {}

  private async requireTeam(user: any) {
    const directTeamId = user?.teamId || user?.team_id;
    if (directTeamId) return directTeamId;

    if (!user?.id) {
      throw new ForbiddenException("Authenticated user is missing an id");
    }

    const { rows } = await this.db.query(
      `
      SELECT team_id
      FROM (
        SELECT tm.team_id, 1 AS priority
        FROM team_members tm
        WHERE tm.user_id = $1
          AND COALESCE(tm.status, 'active') = 'active'

        UNION ALL

        SELECT t.id AS team_id, 2 AS priority
        FROM teams t
        WHERE t.owner_id = $1
      ) resolved
      ORDER BY priority
      LIMIT 1
      `,
      [user.id],
    );

    const teamId = rows[0]?.team_id;
    if (!teamId) {
      throw new ForbiddenException("User must belong to a team");
    }

    return teamId;
  }

  @Get()
  async get(@CurrentUser() user: any) {
    return this.appointmentService.get(
      await this.requireTeam(user),
    );
  }

  @Post()
  async save(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.appointmentService.save(
      await this.requireTeam(user),
      body,
    );
  }

  @Get("status")
  async status(@CurrentUser() user: any) {
    const config = await this.appointmentService.get(
      await this.requireTeam(user),
    );

    return {
      isConfigured: !!config,
    };
  }
}