import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  Patch,
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
import { NotificationsService } from "../notifications/notifications.service";

@ApiTags("teams")
@ApiBearerAuth("JWT-auth")
@Controller("teams")
@UseGuards(JwtAuthGuard, VaRestrictionGuard)
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
  async getMembers(
    @Param("id") id: string,
    @CurrentUser() user: any,

    @Query("page") page = "1",
    @Query("limit") limit = "5",
    @Query("search") search = "",
    @Query("filter") filter = "all",
  ) {
    await this.teamsService.ensureCanAccessTeam(id, user.id);

    return this.teamsService.getMembersPaginated({
      teamId: id,
      page: Number(page),
      limit: Number(limit),
      search,
      filter,
    });
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
    @Body() body: { email: string; role?: string },
    @CurrentUser() user: any,
  ) {
    await this.teamsService.addMemberByEmail(
      teamId,
      body.email?.trim?.() || "",
      user.id,
      body.role || "agent",
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

    return this.teamsService.getDashboard(teamId, user.id);
  }

  @Get(":id/notifications")
  async getNotifications(
    @Param("id") teamId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    return this.notificationsService.getNotifications(teamId, user.id, 5);
  }

  @Patch(":id/notifications/:notificationId/read")
  async markNotificationAsRead(
    @Param("id") teamId: string,
    @Param("notificationId") notificationId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    return this.notificationsService.markNotificationAsRead(
      teamId,
      notificationId,
      user.id,
    );
  }

  @Patch(":id/notifications/read-all")
  async markAllNotificationsAsRead(
    @Param("id") teamId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    return this.notificationsService.markAllNotificationsAsRead(
      teamId,
      user.id,
    );
  }

  @Get(":id/notifications/unread-count")
  async getUnreadCount(@Param("id") teamId: string, @CurrentUser() user: any) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    const total = await this.notificationsService.getUnreadCount(
      teamId,
      user.id,
    );

    return {
      total,
    };
  }

  @Get(":id/ai-insights")
  async getAIInsights(@Param("id") teamId: string, @CurrentUser() user: any) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    return this.teamsService.getAIInsights(teamId);
  }

  @Post(":id/ai-insights/refresh")
  async refreshAIInsights(
    @Param("id") teamId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);

    return this.teamsService.refreshAIInsights(teamId, user.id);
  }

  @Get(":id/activities")
  async getActivities(
    @Param("id") teamId: string,
    @CurrentUser() user: any,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("search") search = "",
    @Query("type") type = "all",
    @Query("userId") userId = "",
    @Query("dateFrom") dateFrom = "",
    @Query("dateTo") dateTo = "",
    @Query("sort") sort = "createdAt:desc",
  ) {
    await this.teamsService.ensureCanAccessTeam(teamId, user.id);
    return this.teamsService.getActivitiesPaginated({
      teamId,
      page: Number(page),
      limit: Number(limit),
      search,
      type,
      userId,
      dateFrom,
      dateTo,
      sort,
    });
  }
}
