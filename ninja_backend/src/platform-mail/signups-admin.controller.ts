import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SignupsAdminService } from './signups-admin.service';

const CSV_FIELDS = [
  'email',
  'name',
  'phone',
  'language',
  'offer_used',
  'checkout_status',
  'payment_status',
  'plan_label',
  'billing',
  'intro_amount',
  'recurring_amount',
  'paddle_customer_id',
  'paddle_subscription_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'landing_page',
  'created_at',
];

function csvCell(v: any): string {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Admin-only Sign-ups and Customers sections with search, filters, detail, and
// CSV export. Sign-ups lists everyone who registered; Customers only the paid.
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class SignupsAdminController {
  constructor(private readonly signups: SignupsAdminService) {}

  @Get('signups')
  @ApiOperation({ summary: 'All sign-ups with attribution (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'offer', required: false })
  async signupsList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('offer') offer?: string,
  ) {
    return this.signups.list('signups', { limit, offset, q, paymentStatus, offer });
  }

  @Get('customers')
  @ApiOperation({ summary: 'Paid customers only (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'offer', required: false })
  async customersList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
    @Query('offer') offer?: string,
  ) {
    return this.signups.list('customers', { limit, offset, q, offer });
  }

  @Get('signups/export.csv')
  @ApiOperation({ summary: 'Export sign-ups as CSV (admin)' })
  async exportSignups(
    @Res() res: Response,
    @Query('q') q?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('offer') offer?: string,
  ) {
    const rows = await this.signups.exportRows('signups', {
      q,
      paymentStatus,
      offer,
    });
    this.sendCsv(res, 'signups', rows);
  }

  @Get('customers/export.csv')
  @ApiOperation({ summary: 'Export customers as CSV (admin)' })
  async exportCustomers(
    @Res() res: Response,
    @Query('q') q?: string,
    @Query('offer') offer?: string,
  ) {
    const rows = await this.signups.exportRows('customers', { q, offer });
    this.sendCsv(res, 'customers', rows);
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Sign-up to purchase funnel totals (admin)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'groupBy', required: false })
  async funnel(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.signups.funnel({ from, to, groupBy });
  }

  @Get('signups/:id')
  @ApiOperation({ summary: 'One sign-up with its email history (admin)' })
  async detail(@Param('id') id: string) {
    return this.signups.detail(id);
  }

  private sendCsv(res: Response, name: string, rows: any[]) {
    const header = CSV_FIELDS.join(',');
    const body = rows
      .map((r) => CSV_FIELDS.map((f) => csvCell(r[f])).join(','))
      .join('\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
    });
    res.send(`${header}\n${body}`);
  }
}
