import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";

import { ContactsService } from "./contacts.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { CreateContactActivityDto } from "./dto/create-contact-activity.dto";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { VaRestrictionGuard } from "../../auth/guards/va-restriction.guard";
import { CrmAccessGuard } from "../../subscriptions/guards/crm-access.guard";

import { CurrentUser } from "../../auth/decorators/current-user.decorator";

@ApiTags("contacts")
@ApiBearerAuth("JWT-auth")
@Controller("contacts")
@UseGuards(JwtAuthGuard, VaRestrictionGuard, CrmAccessGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // ======================================================
  // STATS
  // ======================================================

  @Get("stats")
  async getStats(@CurrentUser() user: any) {
    return this.contactsService.getStats(
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // AI INSIGHTS
  // ======================================================

  @Get("ai-insights")
  async getAiInsights(@CurrentUser() user: any) {
    return this.contactsService.getAiInsights(
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // AI REVIEW
  // ======================================================

  @Post("ai-review")
  async runAiReview(@CurrentUser() user: any) {
    return this.contactsService.runAiReview(
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // ACTIVITY
  // ======================================================

  @Get("activity")
  async getActivity(@CurrentUser() user: any) {
    return this.contactsService.getActivity(
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // CREATE
  // ======================================================

  @Post()
  async create(@Body() dto: CreateContactDto, @CurrentUser() user: any) {
    return this.contactsService.create(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // LIST
  // ======================================================

  @Get()
  async findAll(
    @CurrentUser() user: any,

    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query("status") status?: string,

    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.contactsService.findAll(
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
      {
        search,
        type,
        status,
        page: Number(page || 1),
        limit: Number(limit || 20),
      },
    );
  }

  // ======================================================
  // SINGLE
  // ======================================================

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.contactsService.findOne(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // UPDATE
  // ======================================================

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // MESSAGE
  // ======================================================

  @Post(":id/message")
  async messageContact(
    @Param("id") id: string,
    @Body()
    body: {
      channel: string;
      message: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.contactsService.messageContact(
      id,
      body,
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );
  }

  // ======================================================
  // DELETE
  // ======================================================

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    await this.contactsService.remove(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? "owner",
    );

    return {
      success: true,
    };
  }

  @Get(":id/activities")
  getActivities(@Param("id") id: string, @Req() req) {
    return this.contactsService.getActivities(id, req.user);
  }

  @Post(":id/activities")
  createActivity(
    @Param("id") id: string,
    @Body() dto: CreateContactActivityDto,
    @Req() req,
  ) {
    return this.contactsService.addActivity(id, req.user, dto);
  }
}
