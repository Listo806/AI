import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { MakeService } from "./make.service";

@Controller("integrations/make")
@UseGuards(JwtAuthGuard)
export class MakeController {
  constructor(
    private readonly makeService: MakeService,
  ) {}

  @Get()
  async getConfig(
    @CurrentUser() user: any,
  ) {
    return this.makeService.getConfig(
      user.teamId,
    );
  }

  @Get("config/status")
  async getStatus(
    @CurrentUser() user: any,
  ) {
    return this.makeService.getStatus(
      user.teamId,
    );
  }

  @Post()
  async saveConfig(
    @CurrentUser() user: any,

    @Body()
    body: any,
  ) {
    return this.makeService.saveConfig(
      user.teamId,
      body,
    );
  }

  @Post("trigger")
  async triggerWebhook(
    @Body()
    body: any,
  ) {
    return this.makeService.triggerWebhook(
      body,
    );
  }
}