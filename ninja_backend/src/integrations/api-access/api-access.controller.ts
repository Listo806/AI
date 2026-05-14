import {
  Controller,
  Get,
  Post,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

import { ApiAccessService } from "./api-access.service";

@Controller("integrations/api-access")
@UseGuards(JwtAuthGuard)
export class ApiAccessController {
  constructor(
    private readonly apiAccessService: ApiAccessService,
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
  async get(
    @CurrentUser() user: any,
  ) {
    return this.apiAccessService.getApiKey(
      this.requireTeam(user),
    );
  }

  @Get("usage")
  async usage(
    @CurrentUser() user: any,
  ) {
    return this.apiAccessService.getUsage(
      this.requireTeam(user),
    );
  }

  @Post("generate")
  async generate(
    @CurrentUser() user: any,
  ) {
    return this.apiAccessService.generateApiKey(
      this.requireTeam(user),
    );
  }

  @Post("revoke")
  async revoke(
    @CurrentUser() user: any,
  ) {
    return this.apiAccessService.revoke(
      this.requireTeam(user),
    );
  }
}