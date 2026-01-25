import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AgentPriorityFeedService } from './services/agent-priority-feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';

@ApiTags('agents')
@Controller('api/agents')
@UseGuards(JwtAuthGuard, VaRestrictionGuard)
@ApiBearerAuth('JWT-auth')
export class AgentsController {
  constructor(
    private readonly priorityFeedService: AgentPriorityFeedService,
  ) {}

  /**
   * GET /api/agents/:id/priority-feed
   * Get ranked priority feed for an agent
   */
  @Get(':id/priority-feed')
  @ApiOperation({ 
    summary: 'Get agent priority feed',
    description: 'Returns a ranked list of buyers with active triggers. Feed includes intent scores, trigger types, reasons, and suggested actions. Read-only guidance only - no auto-assignment or routing.'
  })
  @ApiParam({ name: 'id', description: 'Agent ID (UUID)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Priority feed retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              buyerId: { type: 'string', format: 'uuid' },
              intentScore: { type: 'number', example: 65.5, minimum: 0, maximum: 100 },
              triggerType: { type: 'string', enum: ['intent_spike', 'new_matching_listing', 'market_scarcity'] },
              triggeredAt: { type: 'string', format: 'date-time' },
              reason: { type: 'string', example: 'Intent score increased by 18.5 points in the last 24 hours' },
              matchedListingIds: { 
                type: 'array', 
                items: { type: 'string', format: 'uuid' },
                example: ['123e4567-e89b-12d3-a456-426614174000']
              },
              suggestedAction: { 
                type: 'string', 
                enum: ['contact_buyer', 'send_listing', 'follow_up', 'schedule_showing'],
                example: 'contact_buyer'
              },
              cooldownUntil: { type: 'string', format: 'date-time', nullable: true }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getPriorityFeed(@Param('id') agentId: string) {
    const feed = await this.priorityFeedService.getPriorityFeed(agentId);
    return {
      success: true,
      data: feed,
    };
  }
}
