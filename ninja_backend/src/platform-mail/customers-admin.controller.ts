import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CustomersAdminService } from './customers-admin.service';
import { PlanOverridesService } from '../plans/plan-overrides.service';

const CSV_FIELDS = [
  'email',
  'name',
  'phone',
  'language',
  'plan_label',
  'billing',
  'intro_amount',
  'recurring_amount',
  'status',
  'payment_status',
  'source_label',
  'seat_count',
  'created_at',
  'registered_at',
  'last_seen_at',
];

function csvCell(v: any): string {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// The master Customers admin surface: sign-ups, customers, and plan/billing in
// one place. Uses a dedicated base path so the legacy /admin/customers list
// keeps working until this page is verified and the old ones are retired.
@ApiTags('admin')
@Controller('admin/customers-hub')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class CustomersAdminController {
  constructor(
    private readonly customers: CustomersAdminService,
    private readonly planOverrides: PlanOverridesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Master customer list (all lifecycle statuses)' })
  @ApiQuery({ name: 'tab', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'plan', required: false })
  @ApiQuery({ name: 'billing', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async list(@Query() query: any) {
    return this.customers.list(query);
  }

  // All user ids matching the current filters (for "select all matching" bulk
  // selection). Declared before any :id route so the literal wins. Capped.
  @Get('ids')
  @ApiOperation({ summary: 'All customer ids matching the current filters' })
  async ids(@Query() query: any) {
    return this.customers.listIds(query);
  }

  @Post()
  @ApiOperation({ summary: 'Add a customer (creates a proper account)' })
  async create(@Body() body: any) {
    return this.customers.createCustomer(body);
  }

  @Get('summary')
  @ApiOperation({ summary: 'KPIs, tab counts, breakdowns, and funnel' })
  async summary(@Query() query: any) {
    return this.customers.summary(query);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Plan catalog for filters and Change Plan' })
  async plans() {
    return this.customers.plansCatalog();
  }

  @Get('plan-config')
  @ApiOperation({ summary: 'Editable plan limits + feature access (merged with overrides)' })
  async planConfig() {
    return this.planOverrides.listMerged();
  }

  @Post('plan-config/:planId')
  @ApiOperation({ summary: 'Override a plan\'s limits/features (real enforcement for Free)' })
  async setPlanConfig(@Param('planId') planId: string, @Body() body: any) {
    return this.planOverrides.setOverride(planId, body || {});
  }

  @Post('plan-config/:planId/reset')
  @ApiOperation({ summary: 'Reset a plan back to the code defaults' })
  async resetPlanConfig(@Param('planId') planId: string) {
    return this.planOverrides.resetOverride(planId);
  }

  @Get('export.csv')
  @ApiOperation({ summary: 'Export the filtered customer list as CSV' })
  async exportCsv(@Res() res: Response, @Query() query: any) {
    const rows = await this.customers.exportRows(query);
    const header = CSV_FIELDS.join(',');
    const body = rows
      .map((r: any) => CSV_FIELDS.map((f) => csvCell(r[f])).join(','))
      .join('\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="customers.csv"',
    });
    res.send(`${header}\n${body}`);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One customer with subscription, payments, activity, notes' })
  async detail(@Param('id') id: string) {
    return this.customers.detail(id);
  }

  @Get(':id/notes')
  async listNotes(@Param('id') id: string) {
    return { data: await this.customers.listNotes(id) };
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @CurrentUser() user: any,
  ) {
    return { data: await this.customers.addNote(id, body?.note || '', user) };
  }

  @Delete(':id/notes/:noteId')
  async deleteNote(@Param('id') id: string, @Param('noteId') noteId: string) {
    return this.customers.deleteNote(id, noteId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk import customers from CSV rows (upsert by email)' })
  async import(@Body() body: { customers?: any[] }) {
    return { data: await this.customers.importCustomers(body?.customers || []) };
  }

  @Post(':id/update')
  @ApiOperation({ summary: 'Edit a customer\'s contact fields' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.customers.updateCustomer(id, body);
  }

  @Post(':id/email')
  @ApiOperation({ summary: 'Send a free-form email to a customer via SendGrid' })
  async sendEmail(
    @Param('id') id: string,
    @Body() body: { subject?: string; message?: string },
  ) {
    return this.customers.sendCustomerEmail(id, body?.subject || '', body?.message || '');
  }

  // ── Team & Seats ──────────────────────────────────────────────────────────
  @Get(':id/team')
  @ApiOperation({ summary: 'Team roster + seat totals for a customer account' })
  async team(@Param('id') id: string) {
    return this.customers.teamAndSeats(id);
  }

  @Post(':id/team/members')
  @ApiOperation({ summary: 'Add a user to the customer account team' })
  async addMember(
    @Param('id') id: string,
    @Body() body: { email?: string; name?: string; role?: string },
  ) {
    return this.customers.addTeamMember(id, body || {});
  }

  @Post(':id/team/members/:userId/role')
  @ApiOperation({ summary: "Change a team member's role" })
  async memberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role?: string },
  ) {
    return this.customers.changeMemberRole(id, userId, body?.role || '');
  }

  @Post(':id/team/members/:userId/seat')
  @ApiOperation({ summary: 'Assign or remove a member seat' })
  async memberSeat(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { assigned?: boolean },
  ) {
    return this.customers.setMemberSeat(id, userId, !!body?.assigned);
  }

  @Delete(':id/team/members/:userId')
  @ApiOperation({ summary: 'Remove a user from the customer account team' })
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.customers.removeTeamMember(id, userId);
  }

  @Post(':id/team/transfer-ownership')
  @ApiOperation({ summary: 'Transfer account ownership to another team member' })
  async transferOwnership(
    @Param('id') id: string,
    @Body() body: { newOwnerId?: string },
  ) {
    return this.customers.transferOwnership(id, body?.newOwnerId || '');
  }

  @Post(':id/change-plan')
  @ApiOperation({ summary: 'Move a customer between plans (updates account config)' })
  async changePlan(@Param('id') id: string, @Body() body: any) {
    return this.customers.changePlan(id, body);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate: block access, keep account and history' })
  async deactivate(@Param('id') id: string) {
    return this.customers.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft): hide from list; financial records kept' })
  async remove(@Param('id') id: string) {
    return this.customers.remove(id);
  }
}
