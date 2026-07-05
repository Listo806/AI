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

    const limit = Math.min(100, Math.max(1, Number(query.limit || 2)));

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

    console.log("FOUND USER", user);

    await this.teamsService.addMember(teamId, user.id, userId, dto.role);

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

  async streamExportMembers(teamId: string, res: any) {
    res.write(
      [
        "Name",
        "Email",
        "Role",
        "Status",
        "Total Leads",
        "Deals Won",
        "Pipeline Value",
        "AI Score",
        "Last Active",
      ].join(",") + "\n",
    );

    const batchSize = 5000;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.repository.findMembers(teamId, {
        page,
        limit: batchSize,
        filter: "active",
        search: "",
        role: "",
        sort: "createdAt:desc",
      });

      const rows = result.data || [];

      for (const m of rows) {
        const line = [
          m.name || "",
          m.email || "",
          m.role || "",
          m.isActive ? "Active" : "Inactive",
          m.totalLeads || 0,
          m.dealsWon || 0,
          m.pipelineValue || 0,
          m.aiScore || 0,
          m.lastSeenAt || "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",");

        res.write(line + "\n");
      }

      hasMore = rows.length === batchSize;
      page++;
    }

    res.end();
  }
}
