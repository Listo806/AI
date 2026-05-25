import { Injectable, NotFoundException } from "@nestjs/common";

import { Parser } from "json2csv";

import { MembersRepository } from "./members.repository";

import { TeamsService } from "../teams.service";

import { UsersService } from "../../users/users.service";

@Injectable()
export class MembersService {
  constructor(
    private readonly repository: MembersRepository,

    private readonly teamsService: TeamsService,

    private readonly usersService: UsersService,
  ) {}

  async getMembers(teamId: string, query: any) {
    const page = Math.max(1, Number(query.page || 1));

    /*
    LIMIT CLAMP
    min: 1
    max: 100
  */

    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));

    return this.repository.findMembers(teamId, {
      page,

      limit,

      search: query.search || "",

      filter: query.filter || "all",

      role: query.role || "",

      sort: query.sort || "createdAt:desc",
    });
  }

  async inviteMember(teamId: string, dto: any, userId: string) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.teamsService.addMember(teamId, user.id, userId);

    return {
      success: true,
    };
  }

  async removeMember(teamId: string, memberId: string, userId: string) {
    await this.teamsService.removeMember(teamId, memberId, userId);

    return {
      success: true,
    };
  }

  async exportMembers(teamId: string) {
    const members = await this.repository.findMembers(teamId, {
      page: 1,
      limit: 10000,
    });

    const parser = new Parser({
      fields: [
        "name",
        "email",
        "role",
        "isActive",
        "totalLeads",
        "dealsWon",
        "pipelineValue",
        "aiScore",
      ],
    });

    return parser.parse(members.data);
  }
}
