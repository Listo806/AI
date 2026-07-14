import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
  Param,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { AiCenterService } from "./ai-center.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CrmAccessGuard } from "../subscriptions/guards/crm-access.guard";
import { AiCenterAccessGuard } from "./guards/ai-center-access.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/entities/user.entity";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UploadedFiles, UseInterceptors } from "@nestjs/common";

import { FilesInterceptor } from "@nestjs/platform-express";

@ApiTags("ai-center")
@ApiBearerAuth("JWT-auth")
@Controller("ai-center")
//@UseGuards(JwtAuthGuard, CrmAccessGuard, AiCenterAccessGuard)
@UseGuards(JwtAuthGuard, CrmAccessGuard)
export class AiCenterController {
  constructor(private readonly service: AiCenterService) {}

  @Get("overview")
  @ApiOperation({
    summary: "AI Center overview (status, channels, recent actions)",
  })
  @ApiResponse({ status: 200, description: "Overview" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async overview(@CurrentUser() user: any) {
    return this.service.getOverview(user.teamId);
  }

  @Get("auto-reply")
  @ApiOperation({ summary: "Get AI Auto-Reply settings" })
  @ApiResponse({ status: 200, description: "enabled, tone" })
  async getAutoReply(@CurrentUser() user: any) {
    return this.service.getAutoReply(user.teamId);
  }

  @Put("auto-reply")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Update AI Auto-Reply (enabled, tone)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        tone: { type: "string", enum: ["professional", "friendly", "sales"] },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Updated settings" })
  @ApiResponse({ status: 403, description: "Edit requires Admin or Owner" })
  async setAutoReply(
    @CurrentUser() user: any,
    @Body() body: { enabled?: boolean; tone?: string },
  ) {
    return this.service.setAutoReply(user.teamId, body);
  }

  @Post("appointment-setter/enable")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Enable AI Setter" })
  @ApiResponse({ status: 200, description: "Enabled" })
  @ApiResponse({ status: 403, description: "Edit requires Admin or Owner" })
  async enableAppointmentSetter(@CurrentUser() user: any) {
    return this.service.enableAppointmentSetter(user.teamId);
  }

  @Post("appointment-setter/disable")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Disable AI Setter" })
  @ApiResponse({ status: 200, description: "Disabled" })
  @ApiResponse({ status: 403, description: "Edit requires Admin or Owner" })
  async disableAppointmentSetter(@CurrentUser() user: any) {
    return this.service.disableAppointmentSetter(user.teamId);
  }

  @Get("appointment-setter/status")
  @ApiOperation({ summary: "AI Setter status and metrics" })
  @ApiResponse({
    status: 200,
    description: "enabled, metrics, channels, calendars",
  })
  async getAppointmentSetterStatus(@CurrentUser() user: any) {
    return this.service.getAppointmentSetterStatus(user.teamId);
  }

  @Get("activity")
  @ApiOperation({ summary: "AI activity log (paginated by limit)" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: "List of actions" })
  async getActivity(
    @CurrentUser() user: any,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.service.getActivity(user.teamId, safeLimit);
  }

  @Get("qualification-rules")
  @ApiOperation({
    summary: "Active qualification ruleset (Phase 1: name + updated_at)",
  })
  @ApiResponse({ status: 200, description: "name, updated_at" })
  async getQualificationRules(@CurrentUser() user: any) {
    return this.service.getQualificationRules(user.teamId);
  }

  @Get("agent/setup")
  @ApiOperation({ summary: "Get AI Agent setup progress" })
  async getAgentSetup(@CurrentUser() user: any) {
    return this.service.getAgentSetup(user.teamId);
  }

  @Put("agent/setup")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({ summary: "Update AI Agent setup state" })
  async updateAgentSetup(
    @CurrentUser() user: any,
    @Body()
    body: {
      businessProfileCompleted?: boolean;
      appointmentRulesConfigured?: boolean;
      behaviorConfigured?: boolean;
      automationsConfigured?: boolean;
      tested?: boolean;
      launched?: boolean;
    },
  ) {
    return this.service.updateAgentSetup(user.teamId, body);
  }

  @Get("agent/business-profile")
  @ApiOperation({ summary: "Get AI Agent business profile" })
  async getAgentBusinessProfile(@CurrentUser() user: any) {
    return this.service.getAgentBusinessProfile(user.teamId);
  }

  @Put("agent/business-profile")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({ summary: "Create or update AI Agent business profile" })
  async saveAgentBusinessProfile(
    @CurrentUser() user: any,
    @Body()
    body: {
      businessName: string;
      businessType: string;
      description: string;

      website?: string | null;
      email?: string | null;
      phone?: string | null;

      addressLine1?: string | null;
      addressLine2?: string | null;
      city: string;
      state?: string | null;
      postalCode?: string | null;
      country: string;

      serviceAreas?: string[];
      specialties?: string[];
      languages?: string[];

      timezone?: string | null;
      currency?: string;
    },
  ) {
    return this.service.saveAgentBusinessProfile(user.teamId, user.id, body);
  }

  @Get("agent/dashboard")
  @ApiOperation({ summary: "Get AI Agent chat dashboard data" })
  async getAgentDashboard(@CurrentUser() user: any) {
    return this.service.getAgentDashboard(user.teamId);
  }

  @Get("agent/knowledge")
  @ApiOperation({
    summary: "Get AI Agent knowledge dashboard",
  })
  async getAgentKnowledge(
    @CurrentUser() user: any,

    @Query("page", new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query("limit", new DefaultValuePipe(20), ParseIntPipe)
    limit: number,

    @Query("category")
    category?: string,

    @Query("status")
    status?: string,

    @Query("search")
    search?: string,
  ) {
    return this.service.getAgentKnowledge(user.teamId, {
      page,
      limit,
      category,
      status,
      search,
    });
  }

  @Get("agent/knowledge/search")
  @ApiOperation({
    summary: "Search active AI Agent knowledge",
  })
  async searchAgentKnowledge(
    @CurrentUser() user: any,

    @Query("query")
    query: string,

    @Query("limit", new DefaultValuePipe(8), ParseIntPipe)
    limit: number,
  ) {
    return this.service.searchAgentKnowledge(user.teamId, query, limit);
  }

  @Get("agent/knowledge/items/:id")
  @ApiOperation({
    summary: "Get one AI knowledge item",
  })
  async getAgentKnowledgeItem(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.getAgentKnowledgeItem(user.teamId, id);
  }

  @Post("agent/knowledge/items")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({
    summary: "Create AI knowledge item",
  })
  async createAgentKnowledgeItem(
    @CurrentUser() user: any,

    @Body()
    body: {
      category: string;
      sourceType?: string;

      title: string;
      content: string;

      sourceUrl?: string | null;

      status?: string;
      priority?: number;

      metadata?: Record<string, any>;
    },
  ) {
    return this.service.createAgentKnowledgeItem(user.teamId, user.id, body);
  }

  @Put("agent/knowledge/items/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({
    summary: "Update AI knowledge item",
  })
  async updateAgentKnowledgeItem(
    @CurrentUser() user: any,
    @Param("id") id: string,

    @Body()
    body: {
      category?: string;
      sourceType?: string;

      title?: string;
      content?: string;

      sourceUrl?: string | null;

      status?: string;
      priority?: number;

      metadata?: Record<string, any>;
    },
  ) {
    return this.service.updateAgentKnowledgeItem(
      user.teamId,
      user.id,
      id,
      body,
    );
  }

  @Delete("agent/knowledge/items/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({
    summary: "Delete AI knowledge item",
  })
  async deleteAgentKnowledgeItem(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.deleteAgentKnowledgeItem(user.teamId, user.id, id);
  }

  @Get("agent/activity-feed")
  @ApiOperation({ summary: "Get paginated AI Agent activity" })
  async getAgentActivityFeed(
    @CurrentUser() user: any,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.service.getAgentActivityFeed(user.teamId, {
      page,
      limit,
      type,
      status,
      search,
    });
  }

  @Get("agent/controls")
  @ApiOperation({ summary: "Get AI Agent controls" })
  async getAgentControls(@CurrentUser() user: any) {
    return this.service.getAgentControls(user.teamId);
  }

  @Put("agent/controls")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({ summary: "Update AI Agent controls" })
  async updateAgentControls(
    @CurrentUser() user: any,
    @Body()
    body: {
      responseTone?: string;
      capabilities?: Record<string, boolean>;
      quickControls?: Record<string, boolean>;
    },
  ) {
    return this.service.updateAgentControls(user.teamId, body);
  }

  @Post("agent")
  @ApiOperation({ summary: "CORTEXA AI Agent Chat" })
  @ApiResponse({ status: 200, description: "AI response" })
  async cortexaAgent(
    @CurrentUser() user: any,
    @Body()
    body: {
      message: string;
      attachments?: any[];
      conversationId?: string;
      workspaceId?: string;
    },
  ) {
    return this.service.cortexaAgent({
      user,
      body,
    });
  }

  @Post("upload")
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    try {
      return await this.service.uploadFiles({
        files,
        user,
      });
    } catch (error) {
      console.error("UPLOAD ERROR:", error);

      throw error;
    }
  }

  @Get("agent/property-catalog")
  @ApiOperation({ summary: "Get properties available to AI Agent" })
  async getAgentPropertyCatalog(
    @CurrentUser() user: any,

    @Query("page", new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query("limit", new DefaultValuePipe(12), ParseIntPipe)
    limit: number,

    @Query("search")
    search?: string,
  ) {
    return this.service.getAgentPropertyCatalog(user.teamId, {
      page,
      limit,
      search,
    });
  }

  @Put("agent/property-catalog")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({ summary: "Save AI Agent property catalog" })
  async saveAgentPropertyCatalog(
    @CurrentUser() user: any,

    @Body()
    body: {
      propertyIds: string[];
    },
  ) {
    return this.service.saveAgentPropertyCatalog(
      user.teamId,
      user.id,
      body.propertyIds,
    );
  }

  @Get("agent/appointment-rules")
  async getAppointmentRules(@CurrentUser() user: any) {
    return this.service.getAppointmentRules(user.teamId);
  }

  @Put("agent/appointment-rules")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({
    summary: "Create or update AI Agent appointment rules",
  })
  async saveAppointmentRules(
    @CurrentUser() user: any,

    @Body()
    body: {
      timezone?: string;
      workingDays?: string[];

      startTime?: string;
      endTime?: string;

      bookingDuration?: number;
      bufferBefore?: number;
      bufferAfter?: number;

      maxDailyBookings?: number;

      allowWeekends?: boolean;
      autoConfirm?: boolean;
      requireHumanApproval?: boolean;

      reminderMinutes?: number;

      googleCalendarEnabled?: boolean;
      outlookCalendarEnabled?: boolean;

      intakeQuestions?: string[];
    },
  ) {
    return this.service.saveAppointmentRules(user.teamId, user.id, body);
  }

  @Get("agent/behavior")
  @ApiOperation({
    summary: "Get AI Agent behavior",
  })
  async getAgentBehavior(@CurrentUser() user: any) {
    return this.service.getAgentBehavior(user.teamId);
  }

  @Put("agent/behavior")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({
    summary: "Create or update AI Agent behavior",
  })
  async saveAgentBehavior(
    @CurrentUser() user: any,
    @Body()
    body: {
      tone?: string;
      personality?: string;
      responseLength?: string;

      greetingMessage?: string;
      fallbackMessage?: string;
      escalationMessage?: string;

      qualificationQuestions?: string[];
      forbiddenTopics?: string[];
      customInstructions?: string;

      askOneQuestionAtATime?: boolean;
      confirmBeforeBooking?: boolean;
      mentionAiIdentity?: boolean;
      useEmojis?: boolean;
      proactiveFollowUp?: boolean;
      autoEscalateHotLeads?: boolean;
    },
  ) {
    return this.service.saveAgentBehavior(user.teamId, user.id, body);
  }

  @Get("agent/automations")
  async getAutomations(@CurrentUser() user: any) {
    return this.service.getAutomations(user.teamId);
  }

  @Put("agent/automations")
  async saveAutomations(
    @CurrentUser() user: any,

    @Body()
    body: any,
  ) {
    return this.service.saveAutomations(user.teamId, user.id, body);
  }

  @Get("agent/test")
  async getTestStatus(@CurrentUser() user: any) {
    return this.service.getAgentTest(user.teamId);
  }

  @Post("agent/test/sessions")
  async createTestSession(@CurrentUser() user: any) {
    return this.service.createAgentTestSession(user.teamId, user.id);
  }

  @Post("agent/test")
  async runAgentTest(
    @CurrentUser() user: any,

    @Body()
    body: {
      message: string;
      sessionId?: string;
    },
  ) {
    return this.service.runAgentTest(
      user.teamId,
      user.id,
      body.message,
      body.sessionId,
    );
  }

  @Get("agent/chat/sessions")
  @ApiOperation({
    summary: "Get AI Agent chat sessions",
  })
  async getAgentChatSessions(
    @CurrentUser() user: any,

    @Query("limit", new DefaultValuePipe(20), ParseIntPipe)
    limit: number,
  ) {
    return this.service.getAgentChatSessions(user.teamId, limit);
  }

  @Post("agent/chat/sessions")
  @ApiOperation({
    summary: "Create AI Agent chat session",
  })
  async createAgentChatSession(@CurrentUser() user: any) {
    return this.service.createAgentChatSession(user.teamId, user.id);
  }

  @Get("agent/chat/sessions/:id")
  @ApiOperation({
    summary: "Get AI Agent chat session",
  })
  async getAgentChatSession(@CurrentUser() user: any, @Param("id") id: string) {
    return this.service.getAgentChatSession(user.teamId, id);
  }

  @Post("agent/chat/messages")
  @ApiOperation({
    summary: "Send message to AI Agent",
  })
  async sendAgentChatMessage(
    @CurrentUser() user: any,

    @Body()
    body: {
      message: string;
      sessionId?: string;
      attachments?: any[];
    },
  ) {
    return this.service.sendAgentChatMessage(user.teamId, user.id, body);
  }

  @Post("agent/knowledge/import")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DEVELOPER)
  @ApiOperation({
    summary: "Bulk import AI knowledge items",
  })
  async importAgentKnowledge(
    @CurrentUser() user: any,

    @Body()
    body: {
      items?: Array<{
        category?: string;
        sourceType?: string;
        title?: string;
        content?: string;
        sourceUrl?: string | null;
        status?: string;
        priority?: number;
        metadata?: Record<string, any>;
      }>;
    },
  ) {
    return this.service.importAgentKnowledge(
      user.teamId,
      user.id,
      body.items || [],
    );
  }

  @Get("agent/activity-feed/export")
  @ApiOperation({
    summary: "Export AI Agent activity as CSV",
  })
  async exportAgentActivityCsv(
    @CurrentUser() user: any,

    @Query("type")
    type?: string,

    @Query("status")
    status?: string,

    @Query("search")
    search?: string,
  ) {
    return this.service.exportAgentActivityCsv(user.teamId, {
      type,
      status,
      search,
    });
  }
}
