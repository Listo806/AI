import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PaymentGuard } from "../auth/guards/payment.guard";
import { FeatureAccessGuard } from "../plans/feature-access.guard";
import { RequireFeature } from "../plans/require-feature.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CalendarService } from "./calendar.service";
import { BookingEngineService } from "./booking-engine.service";

@Controller("calendar")
@UseGuards(JwtAuthGuard, PaymentGuard)
export class CalendarController {
  constructor(
    private readonly calendar: CalendarService,
    private readonly bookingEngine: BookingEngineService,
  ) {}

  private requireTeam(user: any): string {
    if (!user?.teamId) {
      throw new ForbiddenException("User must belong to a team");
    }
    return user.teamId;
  }

  private userId(user: any): string | null {
    return user?.id || user?._id || user?.userId || null;
  }

  @Get("appointments")
  list(
    @CurrentUser() user: any,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("leadId") leadId?: string,
    @Query("contactId") contactId?: string,
  ) {
    return this.calendar.list(this.requireTeam(user), {
      from,
      to,
      leadId,
      contactId,
    });
  }

  @Get("stats")
  stats(
    @CurrentUser() user: any,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.calendar.stats(this.requireTeam(user), from, to);
  }

  // Active team members for the "Assigned Agent" dropdown.
  @Get("team-members")
  teamMembers(@CurrentUser() user: any) {
    return this.calendar.teamMembers(this.requireTeam(user));
  }

  // Type-ahead search across leads + contacts for linking an appointment to a
  // CRM record.
  @Get("crm-search")
  crmSearch(@CurrentUser() user: any, @Query("q") q = "") {
    return this.calendar.crmSearch(this.requireTeam(user), q);
  }

  // AI booking engine (Phase 1) — deterministic, rules-aware slot validation.
  // Read-only preview: returns a decision (slot_found / out_of_hours /
  // conflict / cap_reached / in_past / invalid) without writing anything.
  @Post("booking-engine/preview")
  previewSlot(
    @CurrentUser() user: any,
    @Body() body: { desiredStartIso: string },
  ) {
    return this.bookingEngine.computeSlot(
      this.requireTeam(user),
      body?.desiredStartIso,
    );
  }

  // Book the slot (re-validates first). Stored status honors auto_confirm /
  // require_human_approval. This does NOT touch the live WhatsApp path.
  @Post("booking-engine/book")
  bookSlot(
    @CurrentUser() user: any,
    @Body()
    body: {
      desiredStartIso: string;
      title?: string;
      leadId?: string;
      contactId?: string;
      propertyId?: string;
      attendeeName?: string;
      attendeeEmail?: string;
    },
  ) {
    return this.bookingEngine.confirmBooking(
      this.requireTeam(user),
      this.userId(user),
      body?.desiredStartIso,
      body,
    );
  }

  // Activity log for a single appointment (who did what, and when).
  @Get("appointments/:id/activity")
  activity(@CurrentUser() user: any, @Param("id") id: string) {
    return this.calendar.getActivity(this.requireTeam(user), id);
  }

  @Post("appointments")
  @UseGuards(FeatureAccessGuard)
  @RequireFeature("calendar")
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.calendar.create(this.requireTeam(user), this.userId(user), body);
  }

  @Patch("appointments/:id")
  update(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.calendar.update(
      this.requireTeam(user),
      id,
      body,
      this.userId(user),
    );
  }

  @Delete("appointments/:id")
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.calendar.remove(this.requireTeam(user), id);
  }
}
