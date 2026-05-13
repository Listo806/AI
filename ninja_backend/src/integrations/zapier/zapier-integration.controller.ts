import {
  Controller,
  Get,
  Post,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { ZapierIntegrationService } from "./zapier-integration.service";

@Controller("integrations/zapier")
@UseGuards(JwtAuthGuard)
export class ZapierIntegrationController {
  constructor(
    private readonly zapierService: ZapierIntegrationService,
  ) {}

  private requireTeam(user: any): string {
    if (!user.teamId) {
      throw new ForbiddenException(
        "User must be part of a team",
      );
    }

    return user.teamId;
  }

  @Get("config")
  async getConfig(@CurrentUser() user: any) {
    return this.zapierService.getConfig(
      this.requireTeam(user),
    );
  }

  @Post("generate")
  async generate(@CurrentUser() user: any) {
    return this.zapierService.generateApiKey(
      this.requireTeam(user),
    );
  }

  @Post("regenerate")
  async regenerate(@CurrentUser() user: any) {
    return this.zapierService.regenerateApiKey(
      this.requireTeam(user),
    );
  }

  @Get("config/status")
  async getStatus(@CurrentUser() user: any) {
    return this.zapierService.getStatus(
      this.requireTeam(user),
    );
  }
}