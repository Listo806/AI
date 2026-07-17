import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { LeadsService } from "./leads.service";
import { WhatsAppLeadService } from "./services/whatsapp-lead.service";
import { LeadMessagesService } from "../messaging/lead-messages.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateWhatsAppLeadDto } from "./dto/create-whatsapp-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { LeadStatus } from "./entities/lead.entity";
import { SubscriptionRequiredGuard } from "../subscriptions/guards/subscription-required.guard";
import { CrmAccessGuard } from "../subscriptions/guards/crm-access.guard";
import { S3Service } from "../common/aws/s3.service";

@ApiTags("leads")
@Controller("leads")
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly whatsappLeadService: WhatsAppLeadService,
    private readonly leadMessages: LeadMessagesService,
    private readonly s3Service: S3Service,
  ) {}

  @Post("whatsapp")
  @ApiOperation({
    summary:
      "Create lead from WhatsApp gate and get WhatsApp redirect URL (public, no auth required)",
    description:
      "Creates a CRM lead before redirecting to WhatsApp. Required: phone (E.164), propertyId, source. Returns WhatsApp URL only after successful lead creation.",
  })
  @ApiBody({ type: CreateWhatsAppLeadDto })
  @ApiResponse({
    status: 200,
    description: "Lead created successfully, WhatsApp URL returned",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            leadId: { type: "string", format: "uuid" },
            whatsappUrl: {
              type: "string",
              example: "https://wa.me/593987654321?text=...",
            },
            assignedTo: {
              type: "string",
              enum: ["agent", "owner", "team", "system"],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid phone number or missing WhatsApp number",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Property not found",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string" },
      },
    },
  })
  async createWhatsAppLead(
    @Body() createWhatsAppLeadDto: CreateWhatsAppLeadDto,
  ) {
    // Service will throw BadRequestException or NotFoundException on errors
    // NestJS will handle these and return appropriate HTTP responses
    return await this.whatsappLeadService.createWhatsAppLead(
      createWhatsAppLeadDto,
    );
  }

  @Post("public")
  @ApiOperation({
    summary: "Create a new lead from public contact form (no auth required)",
  })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: "Lead created successfully" })
  async createPublic(@Body() createLeadDto: CreateLeadDto) {
    // For public leads, we don't have a user ID, so we'll use null
    // The service will handle this appropriately
    return this.leadsService.createPublic(createLeadDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new lead" })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: "Lead created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Active subscription required" })
  async create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.create(createLeadDto, user.id, user.teamId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all leads (optionally filtered by status)" })
  @ApiQuery({
    name: "status",
    required: false,
    enum: LeadStatus,
    description: "Filter leads by status",
  })
  @ApiResponse({ status: 200, description: "Leads retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @CurrentUser() user: any,
    @Query("status") status?: LeadStatus,
  ) {
    if (status) {
      return this.leadsService.findByStatus(status, user.id, user.teamId);
    }
    return this.leadsService.findAll(user.id, user.teamId);
  }
  @Get("dashboard")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  getDashboard(
    @Req() req: any,
    @Query("range") range = "30days",
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const user = req.user;

    return this.leadsService.getDashboard(
      user.id,
      user.teamId || user.team_id || null,
      range,
      Number(page),
      Number(limit),
    );
  }
  @Get("stats")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  getLeadStats(@Req() req: any, @Query("range") range = "all") {
    const user = req.user;

    return this.leadsService.getLeadStats(
      user.id,
      user.teamId || user.team_id || null,
      range,
    );
  }

  @Get(":id/email-thread")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get email thread for a lead" })
  @ApiParam({ name: "id", description: "Lead ID" })
  @ApiResponse({ status: 200, description: "Email thread" })
  @ApiResponse({ status: 403, description: "CRM access required" })
  @ApiResponse({ status: 404, description: "Lead not found" })
  async getEmailThread(@Param("id") id: string, @CurrentUser() user: any) {
    await this.assertLeadAccess(id, user);
    return { data: await this.leadMessages.getEmailThread(id) };
  }

  @Get(":id/messages")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all messages (WhatsApp + email) for a lead timeline",
  })
  @ApiParam({ name: "id", description: "Lead ID" })
  @ApiResponse({ status: 200, description: "Lead messages timeline" })
  @ApiResponse({ status: 403, description: "CRM access required" })
  @ApiResponse({ status: 404, description: "Lead not found" })
  async getMessages(@Param("id") id: string, @CurrentUser() user: any) {
    await this.assertLeadAccess(id, user);
    return { data: await this.leadMessages.findByLead(id) };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get a lead by ID" })
  @ApiParam({ name: "id", description: "Lead ID" })
  @ApiResponse({ status: 200, description: "Lead retrieved successfully" })
  @ApiResponse({ status: 404, description: "Lead not found" })
  async findOne(@Param("id") id: string) {
    return this.leadsService.findById(id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update a lead" })
  @ApiParam({ name: "id", description: "Lead ID" })
  @ApiBody({ type: UpdateLeadDto })
  @ApiResponse({ status: 200, description: "Lead updated successfully" })
  @ApiResponse({ status: 403, description: "CRM access required" })
  @ApiResponse({ status: 404, description: "Lead not found" })
  async update(
    @Param("id") id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user.id, user.teamId);
  }

  @Post(":id/convert-to-contact")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Convert a lead to a contact" })
  @ApiParam({
    name: "id",
    description: "Lead ID",
  })
  @ApiResponse({
    status: 201,
    description: "Lead converted to contact successfully",
  })
  @ApiResponse({
    status: 403,
    description: "CRM access required or insufficient permission",
  })
  @ApiResponse({
    status: 404,
    description: "Lead not found",
  })
  async convertToContact(@Param("id") id: string, @CurrentUser() user: any) {
    return this.leadsService.convertToContact(id, user);
  }

  @Post(":id/contact")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Log a contact action (call, WhatsApp, or email)" })
  @ApiParam({ name: "id", description: "Lead ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        actionType: { type: "string", enum: ["call", "whatsapp", "email"] },
      },
      required: ["actionType"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Contact action logged successfully",
  })
  @ApiResponse({ status: 403, description: "CRM access required" })
  @ApiResponse({ status: 404, description: "Lead not found" })
  async logContact(
    @Param("id") id: string,
    @Body() body: { actionType: "call" | "whatsapp" | "email" },
    @CurrentUser() user: any,
  ) {
    return this.leadsService.logContactAction(
      id,
      body.actionType,
      user.id,
      user.teamId,
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete a lead" })
  @ApiParam({ name: "id", description: "Lead ID" })
  @ApiResponse({ status: 200, description: "Lead deleted successfully" })
  @ApiResponse({ status: 403, description: "CRM access required" })
  @ApiResponse({ status: 404, description: "Lead not found" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    await this.leadsService.delete(id, user.id, user.teamId);
    return { message: "Lead deleted successfully" };
  }

  private async assertLeadAccess(leadId: string, user: any): Promise<void> {
    const lead = await this.leadsService.findById(leadId);
    if (!lead) throw new NotFoundException("Lead not found");
    if (lead.teamId !== user.teamId && lead.createdBy !== user.id) {
      throw new ForbiddenException("You do not have access to this lead");
    }
  }

  @Get(":id/events")
  getLeadEvents(
    @Param("id") id: string,
    @Query("limit") limit = "5",
    @Query("page") page = "1",
    @Req() req,
  ) {
    return this.leadsService.getLeadEvents(
      id,
      req.user,
      Number(limit),
      Number(page),
    );
  }

  @Post(":id/events")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth("JWT-auth")
  createLeadEvent(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.createLeadEvent(id, body, user);
  }

  @Post(":id/upload-message-file")
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadLeadMessageFile(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const uploaded = await this.s3Service.uploadFile(file);

    return this.leadsService.createLeadEvent(
      id,
      {
        eventType: file.mimetype?.startsWith("image/")
          ? "lead.image_sent"
          : file.mimetype?.startsWith("audio/")
            ? "lead.voice_sent"
            : "lead.file_sent",
        metadata: {
          title: file.mimetype?.startsWith("image/")
            ? "Image sent"
            : file.mimetype?.startsWith("audio/")
              ? "Voice message sent"
              : "File sent",
          sub: file.originalname,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileUrl: uploaded.url,
          fileKey: uploaded.key,
        },
      },
      req.user,
    );
  }
}
