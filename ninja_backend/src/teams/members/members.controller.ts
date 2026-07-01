import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
} from "@nestjs/common";

import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { MembersService } from "./members.service";
import { TeamsService } from "../teams.service";
import { GetTeamMembersDto } from "./dto/get-team-members.dto";
import { InviteTeamMemberDto } from "./dto/invite-team-member.dto";

@Controller("teams/members/:teamId")
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly teamsService: TeamsService,
  ) {}

  @Get()
  async getMembers(
    @Param("teamId") teamId: string,

    @CurrentUser()
    user: any,

    @Query()
    query: GetTeamMembersDto,
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);
    return this.membersService.getMembers(teamId, query);
  }

  @Post("invite")
  async inviteMember(
    @Param("teamId") teamId: string,

    @Body()
    dto: InviteTeamMemberDto,

    @CurrentUser()
    user: any,
  ) {
    return this.membersService.inviteMember(teamId, dto, user.id);
  }

  @Get("export")
  async exportMembers(
    @Param("teamId")
    teamId: string,

    @CurrentUser()
    user: any,

    @Res()
    res: Response,
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    const csv = await this.membersService.exportMembers(teamId);

    res.setHeader("Content-Type", "text/csv");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="team-members.csv"`,
    );

    return res.status(200).send(csv);
  }

  @Delete(":memberId")
  async removeMember(
    @Param("teamId") teamId: string,

    @Param("memberId")
    memberId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.membersService.removeMember(teamId, memberId, user.id);
  }
}
