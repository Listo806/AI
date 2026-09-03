import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminBillingCalendarService } from './admin-billing-calendar.service';

@ApiTags('admin-billing-calendar')
@Controller('admin/billing-calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER)
@ApiBearerAuth('JWT-auth')
export class AdminBillingCalendarController {
  constructor(private readonly billingCalendar: AdminBillingCalendarService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Billing Calendar KPI overview' })
  overview(@Query('month') month?: string) {
    return this.billingCalendar.getOverview(month);
  }

  @Get('month')
  @ApiOperation({ summary: 'Billing Calendar month cells' })
  month(@Query('month') month?: string) {
    return this.billingCalendar.getMonth(month);
  }

  @Get('day/:date')
  @ApiOperation({ summary: 'Billing Calendar selected day details' })
  day(
    @Param('date') date: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.billingCalendar.getDay(date, {
      page: Number(page || 1),
      limit: Number(limit || 7),
      status,
      search,
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Upcoming billing days' })
  upcoming(@Query('limit') limit?: string) {
    return this.billingCalendar.getUpcoming(Number(limit || 5));
  }

  @Get('activity')
  @ApiOperation({ summary: 'Recent billing activity' })
  activity(@Query('limit') limit?: string) {
    return this.billingCalendar.getActivity(Number(limit || 5));
  }

  @Get('exceptions')
  @ApiOperation({ summary: 'Billing exception counters' })
  exceptions() {
    return this.billingCalendar.getExceptions();
  }

  @Post('subscriptions/:subscriptionId/reschedule')
  @ApiOperation({ summary: 'Change next Paddle billing date' })
  reschedule(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { date?: string; time?: string; nextBilledAt?: string; prorationBillingMode?: string },
  ) {
    return this.billingCalendar.reschedule(subscriptionId, body || {});
  }

  @Post('bulk/reschedule')
  @ApiOperation({ summary: 'Change next Paddle billing date for selected subscriptions' })
  bulkReschedule(
    @Body() body: { subscriptionIds?: string[]; date?: string; time?: string; prorationBillingMode?: string },
  ) {
    if (!Array.isArray(body?.subscriptionIds) || body.subscriptionIds.length === 0) {
      throw new BadRequestException('subscriptionIds is required');
    }
    return this.billingCalendar.bulkReschedule(body);
  }

  @Post('subscriptions/:subscriptionId/pause')
  @ApiOperation({ summary: 'Pause a Paddle subscription' })
  pause(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { immediately?: boolean; resumeAt?: string } = {},
  ) {
    return this.billingCalendar.pause(subscriptionId, body || {});
  }

  @Post('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel a Paddle subscription' })
  cancel(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { immediately?: boolean } = {},
  ) {
    return this.billingCalendar.cancel(subscriptionId, body || {});
  }

  @Post('subscriptions/:subscriptionId/reminder')
  @ApiOperation({ summary: 'Get the secure Paddle payment-update URL for a billing reminder flow' })
  reminder(@Param('subscriptionId') subscriptionId: string) {
    return this.billingCalendar.getReminderTarget(subscriptionId);
  }

  @Post('subscriptions/:subscriptionId/retry')
  @ApiOperation({ summary: 'Retry failed payment when supported by the configured Paddle workflow' })
  retry(@Param('subscriptionId') subscriptionId: string) {
    return this.billingCalendar.retryPayment(subscriptionId);
  }
}
