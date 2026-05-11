import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";

import { AppsIntegrationsService } from "./apps-integrations.service";

@Controller("crm/integrations")
export class AppsIntegrationsController {
  constructor(
    private readonly service: AppsIntegrationsService,
  ) {}

  @Get()
  async getAll(@Req() req: any) {
    const teamId =
      req.user?.teamId || req.user?.team_id;

    const userId = req.user?.id;

    const integrations = await this.service.getAll(
      teamId,
      userId,
    );

    return {
      success: true,
      integrations,
    };
  }

  @Get(":key")
  async getOne(
    @Req() req: any,
    @Param("key") key: string,
  ) {
    const teamId =
      req.user?.teamId || req.user?.team_id;

    const integration =
      await this.service.getOne(teamId, key);

    return {
      success: true,
      integration,
    };
  }

  @Post(":key/connect")
  async connect(
    @Req() req: any,
    @Param("key") key: string,
    @Body() body: any,
  ) {
    const teamId =
      req.user?.teamId || req.user?.team_id;

    const integration =
      await this.service.connect(
        teamId,
        key,
        body,
      );

    return {
      success: true,
      integration,
    };
  }

  @Post(":key/disconnect")
  async disconnect(
    @Req() req: any,
    @Param("key") key: string,
  ) {
    const teamId =
      req.user?.teamId || req.user?.team_id;

    const integration =
      await this.service.disconnect(
        teamId,
        key,
      );

    return {
      success: true,
      integration,
    };
  }

  @Post(":key/sync")
  async sync(
    @Req() req: any,
    @Param("key") key: string,
  ) {
    const teamId =
      req.user?.teamId || req.user?.team_id;

    const integration =
      await this.service.sync(teamId, key);

    return {
      success: true,
      integration,
    };
  }
}