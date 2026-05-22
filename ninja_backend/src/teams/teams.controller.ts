import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { TeamsService } from "./teams.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { VaRestrictionGuard } from "../auth/guards/va-restriction.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";

@ApiTags("teams")
@ApiBearerAuth("JWT-auth")
@Controller("teams")
@UseGuards(JwtAuthGuard, VaRestrictionGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new team" })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: "Team created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: any) {
    return this.teamsService.create(createTeamDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all teams for current user" })
  @ApiResponse({ status: 200, description: "Teams retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@CurrentUser() user: any) {
    return this.teamsService.findByUserId(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get team by ID (owner or member only)" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiResponse({ status: 200, description: "Team retrieved successfully" })
  @ApiResponse({ status: 403, description: "Not your team" })
  @ApiResponse({ status: 404, description: "Team not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    await this.teamsService.ensureCanAccessTeam(id, user.id);
    return this.teamsService.findById(id);
  }

  @Get(":id/members")
  @ApiOperation({ summary: "List team members (team members only)" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiResponse({ status: 200, description: "Members list" })
  @ApiResponse({ status: 403, description: "Not a team member" })
  async getMembers(@Param("id") id: string, @CurrentUser() user: any) {
    await this.teamsService.ensureCanAccessTeam(id, user.id);
    const members = await this.teamsService.getMembers(id);
    return { data: members };
  }

  @Post(":id/members/invite")
  @ApiOperation({ summary: "Invite member by email (owner only)" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email"],
      properties: { email: { type: "string" } },
    },
  })
  @ApiResponse({ status: 200, description: "Member added" })
  @ApiResponse({ status: 404, description: "User not found" })
  async inviteByEmail(
    @Param("id") teamId: string,
    @Body() body: { email: string },
    @CurrentUser() user: any,
  ) {
    await this.teamsService.addMemberByEmail(
      teamId,
      body.email?.trim?.() || "",
      user.id,
    );
    return { message: "Member added successfully" };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update team (owner only)" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiBody({ type: UpdateTeamDto })
  @ApiResponse({ status: 200, description: "Team updated successfully" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only team owner can update",
  })
  async update(
    @Param("id") id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.update(id, updateTeamDto, user.id);
  }

  @Get(":id/seats")
  @ApiOperation({ summary: "Get team seat information (owner or member only)" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiResponse({
    status: 200,
    description: "Seat information retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Not your team" })
  async getSeatInfo(@Param("id") id: string, @CurrentUser() user: any) {
    await this.teamsService.ensureCanAccessTeam(id, user.id);
    const [seatCount, availableSeats] = await Promise.all([
      this.teamsService.getSeatCount(id),
      this.teamsService.getAvailableSeats(id),
    ]);
    return {
      total: (await this.teamsService.findById(id))?.seatLimit || 0,
      used: seatCount,
      available: availableSeats,
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete team (owner only, own teams only)" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiResponse({ status: 200, description: "Team deleted" })
  @ApiResponse({ status: 403, description: "Not your team" })
  @ApiResponse({ status: 404, description: "Team not found" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.teamsService.remove(id, user.id);
  }

  @Post(":id/members/:userId")
  @ApiOperation({ summary: "Add member to team" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiParam({ name: "userId", description: "User ID to add" })
  @ApiResponse({ status: 200, description: "Member added successfully" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only team owner can add members",
  })
  async addMember(
    @Param("id") teamId: string,
    @Param("userId") userId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.addMember(teamId, userId, user.id);
    return { message: "Member added successfully" };
  }

  @Delete(":id/members/:userId")
  @ApiOperation({ summary: "Remove member from team" })
  @ApiParam({ name: "id", description: "Team ID" })
  @ApiParam({ name: "userId", description: "User ID to remove" })
  @ApiResponse({ status: 200, description: "Member removed successfully" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only team owner can remove members",
  })
  async removeMember(
    @Param("id") teamId: string,
    @Param("userId") userId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.removeMember(teamId, userId, user.id);
    return { message: "Member removed successfully" };
  }

  @Get(":id/dashboard")
  async getDashboard(@Param("id") teamId: string, @CurrentUser() user: any) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    return this.teamsService.getDashboard(teamId);
  }

  @Get(":id/notifications")
  async getNotifications(
    @Param("id") teamId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    return this.teamsService.getNotifications(teamId);
  }
}
