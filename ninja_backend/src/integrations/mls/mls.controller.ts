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
import { MlsService } from "./mls.service";

@Controller("integrations/mls")
@UseGuards(JwtAuthGuard)
export class MlsController {
  constructor(private readonly mlsService: MlsService) {}

  private requireTeam(user: any) {
    if (!user?.teamId) {
      throw new ForbiddenException("User must belong to a team");
    }

    return user.teamId;
  }

  @Get()
  async get(@CurrentUser() user: any) {
    return this.mlsService.getConfig(this.requireTeam(user));
  }

  @Post()
  async save(@CurrentUser() user: any, @Body() body: any) {
    return this.mlsService.save(this.requireTeam(user), body);
  }

  @Post("sync")
  async sync(@CurrentUser() user: any) {
    return this.mlsService.sync(this.requireTeam(user));
  }
  @Get("status")
  async status(@CurrentUser() user: any) {
    const configs = await this.mlsService.getAll(this.requireTeam(user));

    return {
      isConfigured: configs.length > 0,
    };
  }
}
