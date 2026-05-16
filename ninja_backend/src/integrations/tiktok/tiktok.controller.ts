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
import { TiktokService } from "./tiktok.service";

@Controller("integrations/tiktok")
@UseGuards(JwtAuthGuard)
export class TiktokController {
  constructor(
    private readonly tiktokService: TiktokService,
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
    return this.tiktokService.getConfig(
      this.requireTeam(user),
    );
  }

  @Post()
  async save(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.tiktokService.save(
      this.requireTeam(user),
      body,
    );
  }

  @Post("sync")
  async sync(@CurrentUser() user: any) {
    return this.tiktokService.sync(
      this.requireTeam(user),
    );
  }

  @Get("status")
  async status(@CurrentUser() user: any) {
    const config =
      await this.tiktokService.getConfig(
        this.requireTeam(user),
      );

    return {
      isConfigured: !!config,
    };
  }
}