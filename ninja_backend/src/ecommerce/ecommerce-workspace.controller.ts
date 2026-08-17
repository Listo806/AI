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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EcommerceWorkspaceService } from './ecommerce-workspace.service';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

const CSV_FIELDS = [
  'email',
  'name',
  'phone',
  'language',
  'plan_label',
  'billing',
  'recurring_amount',
  'status',
  'payment_status',
  'source_label',
  'country',
  'seat_count',
  'seats_limit',
  'registered_at',
  'last_seen_at',
  'ltv',
];

function csvCell(value: any): string {
  if (value == null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Customer-facing E-Commerce Workspace.
 *
 * Unlike /admin/customers-hub, these endpoints are available to authenticated
 * workspace users and every operation is tenant-scoped inside the service.
 */
@ApiTags('ecommerce-workspace')
@RequiresWorkspace('ecommerce')
@Controller('ecommerce/customers-hub')
@UseGuards(JwtAuthGuard, WorkspaceLockGuard)
@ApiBearerAuth('JWT-auth')
export class EcommerceWorkspaceController {
  constructor(private readonly ecommerce: EcommerceWorkspaceService) {}

  @Get()
  @ApiOperation({ summary: 'Tenant E-Commerce customer/subscription list' })
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.ecommerce.list(user, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Tenant E-Commerce KPIs and breakdowns' })
  summary(@CurrentUser() user: any, @Query() query: any) {
    return this.ecommerce.summary(user, query);
  }

  @Get('plans')
  plans() {
    return this.ecommerce.plansCatalog();
  }

  @Get('plan-config')
  planConfig() {
    return this.ecommerce.planConfig();
  }

  @Post('plan-config/:planId')
  setPlanConfig(@Param('planId') planId: string, @Body() body: any) {
    return this.ecommerce.setPlanConfig();
  }

  @Post('plan-config/:planId/reset')
  resetPlanConfig(@Param('planId') planId: string) {
    return this.ecommerce.resetPlanConfig();
  }

  @Get('export.csv')
  async exportCsv(
    @CurrentUser() user: any,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const rows = await this.ecommerce.exportRows(user, query);
    const header = CSV_FIELDS.join(',');
    const body = rows
      .map((r: any) => CSV_FIELDS.map((f) => csvCell(r[f])).join(','))
      .join('\n');

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ecommerce-customers.csv"',
    });
    res.send(`${header}\n${body}`);
  }

  @Post('import')
  async import(@CurrentUser() user: any, @Body() body: { customers?: any[] }) {
    return {
      data: await this.ecommerce.importCustomers(user, body?.customers || []),
    };
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.ecommerce.createCustomer(user, body);
  }

  @Get(':id')
  detail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ecommerce.detail(user, id);
  }

  @Get(':id/notes')
  async notes(@CurrentUser() user: any, @Param('id') id: string) {
    return { data: await this.ecommerce.listNotes(user, id) };
  }

  @Post(':id/notes')
  async addNote(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return {
      data: await this.ecommerce.addNote(user, id, body?.note || ''),
    };
  }

  @Delete(':id/notes/:noteId')
  deleteNote(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    return this.ecommerce.deleteNote(user, id, noteId);
  }

  @Post(':id/update')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.ecommerce.updateCustomer(user, id, body);
  }

  @Post(':id/change-plan')
  changePlan(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.ecommerce.changePlan(user, id, body);
  }

  @Post(':id/deactivate')
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ecommerce.deactivate(user, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ecommerce.remove(user, id);
  }

  @Post(':id/email')
  email(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { subject?: string; message?: string },
  ) {
    return this.ecommerce.sendCustomerEmail(
      user,
      id,
      body?.subject || '',
      body?.message || '',
    );
  }

  @Get(':id/team')
  team(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ecommerce.teamAndSeats(user, id);
  }

  @Post(':id/team/members')
  addMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.ecommerce.addMember(user, id, body);
  }

  @Post(':id/team/members/:memberId/role')
  memberRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role?: string },
  ) {
    return this.ecommerce.memberRole(user, id, memberId, body?.role || 'user');
  }

  @Post(':id/team/members/:memberId/seat')
  memberSeat(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { assigned?: boolean },
  ) {
    return this.ecommerce.memberSeat(user, id, memberId, !!body?.assigned);
  }

  @Delete(':id/team/members/:memberId')
  removeMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.ecommerce.removeMember(user, id, memberId);
  }

  @Post(':id/team/transfer-ownership')
  transferOwnership(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { newOwnerId?: string },
  ) {
    return this.ecommerce.transferOwnership(user, id, body?.newOwnerId || '');
  }
}