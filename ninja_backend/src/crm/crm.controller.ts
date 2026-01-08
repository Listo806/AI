import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  /**
   * GET /api/crm/dashboard/summary
   * Single lightweight endpoint to hydrate the entire dashboard above-the-fold
   */
  @Get('dashboard/summary')
  async getDashboardSummary(@CurrentUser() user: any) {
    return this.crmService.getDashboardSummary(
      user.id,
      user.teamId,
      user.role,
    );
  }

  /**
   * GET /api/crm/leads/recent?limit=10
   * Get recent leads with AI score logic
   */
  @Get('leads/recent')
  async getRecentLeads(
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Cap limit at 50 for performance
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.crmService.getRecentLeads(user.id, user.teamId, safeLimit);
  }

  /**
   * GET /api/crm/properties/recent?limit=10
   * Get recent properties with engagement metrics
   */
  @Get('properties/recent')
  async getRecentProperties(
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Cap limit at 50 for performance
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.crmService.getRecentProperties(user.id, user.teamId, safeLimit);
  }
}
