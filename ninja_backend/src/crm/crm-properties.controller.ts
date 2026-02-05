import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { CrmPropertiesService, CrmPropertyStatus } from './crm-properties.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';

@ApiTags('crm')
@ApiBearerAuth('JWT-auth')
@Controller('crm/properties')
@UseGuards(JwtAuthGuard, VaRestrictionGuard, CrmAccessGuard)
export class CrmPropertiesController {
  constructor(private readonly service: CrmPropertiesService) {}

  @Get('feed')
  @ApiOperation({ summary: 'CRM property feed (filtered by team; optional project_id, agent_id)' })
  @ApiQuery({ name: 'project_id', required: false, description: 'Filter by project' })
  @ApiQuery({ name: 'agent_id', required: false, description: 'Filter by assigned agent' })
  @ApiResponse({ status: 200, description: 'Property feed' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async feed(
    @CurrentUser() user: any,
    @Query('project_id') projectId?: string,
    @Query('agent_id') agentId?: string,
  ) {
    return this.service.feed({
      teamId: user.teamId ?? null,
      userId: user.id,
      projectId,
      agentId,
    });
  }

  @Post(':id/assign-agent')
  @ApiOperation({ summary: 'Assign agent to a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({ schema: { type: 'object', required: ['agent_id'], properties: { agent_id: { type: 'string', format: 'uuid' } } } })
  @ApiResponse({ status: 200, description: 'Agent assigned' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async assignAgent(
    @Param('id') propertyId: string,
    @Body() body: { agent_id: string },
    @CurrentUser() user: any,
  ) {
    return this.service.assignAgent(propertyId, body.agent_id, user.id, user.teamId ?? null);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update property CRM status (available | reserved | sold)' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({ schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['available', 'reserved', 'sold'] } } } })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'CRM access required or invalid status' })
  async updateStatus(
    @Param('id') propertyId: string,
    @Body() body: { status: CrmPropertyStatus },
    @CurrentUser() user: any,
  ) {
    return this.service.updateStatus(propertyId, body.status, user.id, user.teamId ?? null);
  }
}
