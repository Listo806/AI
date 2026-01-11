import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('crm')
@ApiBearerAuth('JWT-auth')
@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  /**
   * GET /api/crm/dashboard/summary
   * Single lightweight endpoint to hydrate the entire dashboard above-the-fold
   */
  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get recent leads with AI scores' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of leads to return (1-50)', example: 10 })
  @ApiResponse({ status: 200, description: 'Recent leads retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get recent properties with engagement metrics' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of properties to return (1-50)', example: 10 })
  @ApiResponse({ status: 200, description: 'Recent properties retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecentProperties(
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Cap limit at 50 for performance
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.crmService.getRecentProperties(user.id, user.teamId, safeLimit);
  }
}
