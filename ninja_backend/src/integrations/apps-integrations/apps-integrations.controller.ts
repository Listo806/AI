import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";

import { AppsIntegrationsService } from "./apps-integrations.service";

@Controller("integrations")
export class AppsIntegrationsController {
  constructor(
    private readonly service: AppsIntegrationsService,
  ) {}

  private getAuthData(req: any) {
    /*
     * DEBUG USER
     */
    console.log("REQ USER:", req.user);

    const teamId =
      req.user?.teamId ||
      req.user?.team_id ||
      req.user?.workspaceId ||
      req.user?.workspace_id;

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!teamId || !userId) {
      throw new UnauthorizedException(
        "Missing authenticated user/team",
      );
    }

    return {
      teamId,
      userId,
    };
  }

  @Get()
  async getAll(@Req() req: any) {
    const { teamId, userId } =
      this.getAuthData(req);

    const integrations =
      await this.service.getAll(
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
    const { teamId } =
      this.getAuthData(req);

    const integration =
      await this.service.getOne(
        teamId,
        key,
      );

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
    const { teamId } =
      this.getAuthData(req);

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
    const { teamId } =
      this.getAuthData(req);

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
    const { teamId } =
      this.getAuthData(req);

    const integration =
      await this.service.sync(
        teamId,
        key,
      );

    return {
      success: true,
      integration,
    };
  }
}