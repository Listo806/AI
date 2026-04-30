import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { BuyerEventsService } from './services/buyer-events.service';
import { IntentScoringService } from './services/intent-scoring.service';
import { MarketSignalsService } from './services/market-signals.service';
import { LogEventDto } from './dto/log-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';

@ApiTags('intelligence')
@Controller()
export class IntelligenceController {
  constructor(
    private readonly buyerEventsService: BuyerEventsService,
    private readonly intentScoringService: IntentScoringService,
    private readonly marketSignalsService: MarketSignalsService,
  ) {}

  /**
   * POST /api/events
   * Public endpoint for logging buyer behavior events
   */
  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Log a buyer behavior event',
    description: 'Public endpoint for logging buyer behavior events. Creates buyer record if it does not exist. Automatically detects revisits for listing_view events.'
  })
  @ApiBody({ type: LogEventDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Event logged successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            event: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                buyerId: { type: 'string', format: 'uuid' },
                eventType: { type: 'string', enum: ['property_search', 'filters_applied', 'listing_view', 'favorite_added', 'favorite_removed', 'saved_search', 'revisit', 'contacted', 'session_start', 'session_end'] },
                propertyId: { type: 'string', format: 'uuid', nullable: true },
                zoneId: { type: 'string', format: 'uuid', nullable: true },
                metadata: { type: 'object', nullable: true },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            intentScore: {
              type: 'object',
              properties: {
                buyerId: { type: 'string', format: 'uuid' },
                score: { type: 'number', example: 45.5, minimum: 0, maximum: 100 },
                lastCalculatedAt: { type: 'string', format: 'date-time', nullable: true },
                lastActivityAt: { type: 'string', format: 'date-time', nullable: true }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async logEvent(@Body() dto: LogEventDto) {
    const event = await this.buyerEventsService.logEvent(dto);
    
    // Get updated intent score
    const intentScore = await this.intentScoringService.getIntentScore(dto.buyerId);
    
    return {
      success: true,
      data: {
        event,
        intentScore: intentScore ? {
          buyerId: intentScore.buyerId,
          score: parseFloat(intentScore.score.toString()),
          lastCalculatedAt: intentScore.lastCalculatedAt,
          lastActivityAt: intentScore.lastActivityAt,
        } : {
          buyerId: dto.buyerId,
          score: 0,
          lastCalculatedAt: null,
          lastActivityAt: null,
        },
      },
    };
  }

  /**
   * GET /api/buyers/:id/intent
   * Get buyer intent score and history
   */
  @Get('buyers/:id/intent')
  @UseGuards(JwtAuthGuard, VaRestrictionGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get buyer intent score',
    description: 'Retrieves the current intent score for a buyer (0-100). Optionally includes complete score change history with before/after values and reasons.'
  })
  @ApiParam({ name: 'id', description: 'Buyer ID (UUID)', type: String })
  @ApiQuery({ name: 'includeHistory', required: false, type: Boolean, description: 'Set to true to include score change history' })
  @ApiResponse({ 
    status: 200, 
    description: 'Buyer intent score retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            buyerId: { type: 'string', format: 'uuid' },
            score: { type: 'number', example: 45.5, minimum: 0, maximum: 100 },
            lastCalculatedAt: { type: 'string', format: 'date-time', nullable: true },
            lastActivityAt: { type: 'string', format: 'date-time', nullable: true },
            lastEventAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scoreBefore: { type: 'number' },
                  scoreAfter: { type: 'number' },
                  changeReason: { type: 'string' },
                  eventId: { type: 'string', format: 'uuid', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Buyer not found' })
  async getBuyerIntent(
    @Param('id') buyerId: string,
    @Query('includeHistory') includeHistory?: string,
  ) {
    const score = await this.intentScoringService.getIntentScore(buyerId);

    // Get last event timestamp
    const lastEventAt = await this.buyerEventsService.getLastEventAt(buyerId);

    if (!score) {
      // Return default score if buyer doesn't exist yet
      return {
        success: true,
        data: {
          buyerId,
          score: 0,
          lastCalculatedAt: null,
          lastActivityAt: null,
          lastEventAt: lastEventAt,
          updatedAt: null,
          history: includeHistory === 'true' ? [] : undefined,
        },
      };
    }

    const result: any = {
      success: true,
      data: {
        buyerId: score.buyerId,
        score: parseFloat(score.score.toString()),
        lastCalculatedAt: score.lastCalculatedAt,
        lastActivityAt: score.lastActivityAt,
        lastEventAt: lastEventAt,
        updatedAt: score.updatedAt,
      },
    };

    if (includeHistory === 'true') {
      const history = await this.intentScoringService.getScoreHistory(buyerId);
      result.data.history = history.map((log) => ({
        scoreBefore: parseFloat(log.scoreBefore.toString()),
        scoreAfter: parseFloat(log.scoreAfter.toString()),
        changeReason: log.changeReason,
        eventId: log.eventId,
        createdAt: log.createdAt,
      }));
    }

    return result;
  }

  /**
   * GET /api/market/signals
   * Get market signals for a zone
   */
  @Get('market/signals')
  @UseGuards(JwtAuthGuard, VaRestrictionGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get market signals for a zone',
    description: 'Retrieves zone-level market analytics including new listings, sold/closed counts, active inventory, and inventory change flags (scarcity/increase).'
  })
  @ApiQuery({ name: 'zoneId', required: true, description: 'Zone ID (UUID)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Market signals retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            zoneId: { type: 'string', format: 'uuid' },
            zoneName: { type: 'string', example: 'Quito – Cumbayá' },
            newListingsCount7d: { type: 'number', example: 12 },
            newListingsCount30d: { type: 'number', example: 45 },
            soldCount7d: { type: 'number', example: 3 },
            soldCount30d: { type: 'number', example: 15 },
            closedCount7d: { type: 'number', example: 2 },
            closedCount30d: { type: 'number', example: 8 },
            activeListingsCount: { type: 'number', example: 28 },
            inventoryChange: {
              type: 'object',
              properties: {
                isScarcity: { type: 'boolean', description: 'True if active listings < 15' },
                isIncrease: { type: 'boolean', description: 'True if increase > 25% vs baseline' },
                percentageChange: { type: 'number', example: 28.5 }
              }
            },
            calculatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async getMarketSignals(@Query('zoneId') zoneId: string) {
    if (!zoneId) {
      throw new NotFoundException('zoneId query parameter is required');
    }

    const signals = await this.marketSignalsService.getMarketSignals(zoneId);
    return {
      success: true,
      data: signals,
    };
  }
}
