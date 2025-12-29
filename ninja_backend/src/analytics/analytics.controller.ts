import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get dashboard metrics (comprehensive overview)
   */
  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: any,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const timeRange = this.parseTimeRange(startDateStr, endDateStr);

    return this.analyticsService.getDashboardMetrics(
      user.id,
      user.role,
      user.teamId,
      timeRange,
    );
  }

  /**
   * Get lead metrics
   */
  @Get('leads')
  async getLeadMetrics(
    @CurrentUser() user: any,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const timeRange = this.parseTimeRange(startDateStr, endDateStr);
    return this.analyticsService.getLeadMetrics(
      user.role === 'admin' ? null : user.teamId,
      timeRange,
    );
  }

  /**
   * Get property metrics
   */
  @Get('properties')
  async getPropertyMetrics(
    @CurrentUser() user: any,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const timeRange = this.parseTimeRange(startDateStr, endDateStr);
    return this.analyticsService.getPropertyMetrics(
      user.role === 'admin' ? null : user.teamId,
      timeRange,
    );
  }

  /**
   * Get subscription metrics
   */
  @Get('subscriptions')
  async getSubscriptionMetrics(@CurrentUser() user: any) {
    return this.analyticsService.getSubscriptionMetrics(
      user.role === 'admin' ? null : user.teamId,
    );
  }

  /**
   * Get team metrics
   */
  @Get('teams')
  async getTeamMetrics(@CurrentUser() user: any) {
    return this.analyticsService.getTeamMetrics(
      user.role === 'admin' ? null : user.teamId,
    );
  }

  /**
   * Get user metrics
   */
  @Get('users')
  async getUserMetrics(
    @CurrentUser() user: any,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('days') days?: string,
  ) {
    const timeRange = this.parseTimeRange(startDateStr, endDateStr, days);
    return this.analyticsService.getUserMetrics(
      user.role === 'admin' ? null : user.teamId,
      timeRange,
    );
  }

  /**
   * Get activity metrics
   */
  @Get('activity')
  async getActivityMetrics(
    @CurrentUser() user: any,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('days') days?: string,
  ) {
    const timeRange = this.parseTimeRange(startDateStr, endDateStr, days);
    return this.analyticsService.getActivityMetrics(
      user.role === 'admin' ? null : user.teamId,
      timeRange,
    );
  }

  /**
   * Parse time range from query parameters
   */
  private parseTimeRange(
    startDateStr?: string,
    endDateStr?: string,
    days?: string,
  ): { startDate: Date; endDate: Date } | undefined {
    if (days) {
      const daysNum = parseInt(days, 10);
      if (isNaN(daysNum) || daysNum < 1) {
        throw new BadRequestException('Invalid days parameter');
      }
      return {
        startDate: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      };
    }

    if (startDateStr || endDateStr) {
      const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = endDateStr ? new Date(endDateStr) : new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
      }

      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      return { startDate, endDate };
    }

    return undefined;
  }
}

