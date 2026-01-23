import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';

@ApiTags('crm')
@ApiBearerAuth('JWT-auth')
@Controller('crm')
@UseGuards(JwtAuthGuard, VaRestrictionGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  /**
   * GET /api/crm/dashboard/summary
   * Single lightweight endpoint to hydrate the entire dashboard above-the-fold
   * Available to all authenticated users (FREE/PRO get limited data, PRO PLUS+ get full data)
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
   * Requires CRM access (PRO PLUS+)
   */
  @Get('leads/recent')
  @UseGuards(CrmAccessGuard)
  @ApiOperation({ summary: 'Get recent leads with AI scores' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of leads to return (1-50)', example: 10 })
  @ApiResponse({ status: 200, description: 'Recent leads retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
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
   * Requires CRM access (PRO PLUS+)
   */
  @Get('properties/recent')
  @UseGuards(CrmAccessGuard)
  @ApiOperation({ summary: 'Get recent properties with engagement metrics' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of properties to return (1-50)', example: 10 })
  @ApiResponse({ status: 200, description: 'Recent properties retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async getRecentProperties(
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Cap limit at 50 for performance
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.crmService.getRecentProperties(user.id, user.teamId, safeLimit);
  }

  /**
   * GET /api/crm/owner/properties
   * Get all owner properties (role-scoped: owner only sees their own)
   * Requires CRM access (PRO PLUS+)
   */
  @Get('owner/properties')
  @UseGuards(CrmAccessGuard)
  @ApiOperation({ summary: 'Get all owner properties (read-only list)' })
  @ApiResponse({ status: 200, description: 'Owner properties retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'CRM access required or not an owner' })
  async getOwnerProperties(@CurrentUser() user: any) {
    // Ensure user is an owner
    if (user.role !== 'owner') {
      throw new ForbiddenException('This endpoint is only available for owners');
    }
    return this.crmService.getOwnerProperties(user.id, user.teamId);
  }

  /**
   * GET /api/crm/owner/leads
   * Get all owner leads (role-scoped: owner only sees their own)
   * Requires CRM access (PRO PLUS+)
   */
  @Get('owner/leads')
  @UseGuards(CrmAccessGuard)
  @ApiOperation({ summary: 'Get all owner leads (read-only list)' })
  @ApiResponse({ status: 200, description: 'Owner leads retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'CRM access required or not an owner' })
  async getOwnerLeads(@CurrentUser() user: any) {
    // Ensure user is an owner
    if (user.role !== 'owner') {
      throw new ForbiddenException('This endpoint is only available for owners');
    }
    return this.crmService.getOwnerLeads(user.id, user.teamId);
  }
}
