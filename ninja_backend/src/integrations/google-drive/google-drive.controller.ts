import {
  Controller,
  Get,
  Delete,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

import { GoogleDriveService } from "./google-drive.service";

@Controller("integrations/google-drive")
@UseGuards(JwtAuthGuard)
export class GoogleDriveController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  private requireTeam(user: any): string {
    if (!user.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  @Get("config/status")
  async getStatus(
    @CurrentUser() user: any,
  ) {
    return this.googleDriveService.getStatus(
      this.requireTeam(user),
    );
  }

  @Delete("disconnect")
  async disconnect(
    @CurrentUser() user: any,
  ) {
    return this.googleDriveService.disconnect(
      this.requireTeam(user),
    );
  }
}