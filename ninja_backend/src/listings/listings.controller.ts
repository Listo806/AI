import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ComparableListingsService } from './services/comparable-listings.service';
import { MatchExplanationService } from './services/match-explanation.service';

@ApiTags('listings')
@Controller('listings')
// TODO: Consider adding rate limiting for public endpoints (e.g., 100 requests per minute per IP)
export class ListingsController {
  constructor(
    private readonly comparableListingsService: ComparableListingsService,
    private readonly matchExplanationService: MatchExplanationService,
  ) {}

  /**
   * GET /api/listings/:id/comps?buyerId=...
   * Get comparable listings for a property
   */
  @Get(':id/comps')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get comparable listings for a property',
    description: 'Returns comparable listings based on zone, property type, bedrooms, and price (±15% tolerance). Excludes the listing itself, sold/rented properties, and properties the buyer has viewed. Results are cached for 24 hours.'
  })
  @ApiParam({ name: 'id', description: 'Listing ID (UUID)', type: String })
  @ApiQuery({ name: 'buyerId', required: true, description: 'Buyer ID (UUID)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Comparable listings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              address: { type: 'string', nullable: true },
              city: { type: 'string', nullable: true },
              state: { type: 'string', nullable: true },
              zipCode: { type: 'string', nullable: true },
              price: { type: 'number', nullable: true },
              type: { type: 'string', enum: ['sale', 'rent'] },
              status: { type: 'string', enum: ['draft', 'published', 'sold', 'rented', 'archived'] },
              bedrooms: { type: 'number', nullable: true },
              bathrooms: { type: 'number', nullable: true },
              squareFeet: { type: 'number', nullable: true },
              lotSize: { type: 'number', nullable: true },
              yearBuilt: { type: 'number', nullable: true },
              zoneId: { type: 'string', format: 'uuid', nullable: true },
              latitude: { type: 'number', nullable: true },
              longitude: { type: 'number', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              publishedAt: { type: 'string', format: 'date-time', nullable: true },
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'buyerId query parameter is required' })
  async getComparableListings(
    @Param('id') listingId: string,
    @Query('buyerId') buyerId: string,
  ) {
    if (!buyerId) {
      return {
        success: false,
        error: 'buyerId query parameter is required',
      };
    }

    const comps = await this.comparableListingsService.getComparableListings(
      listingId,
      buyerId,
    );

    return {
      success: true,
      data: comps,
    };
  }

  /**
   * GET /api/listings/:id/match-explanation?buyerId=...
   * Get match explanation for a listing and buyer
   */
  @Get(':id/match-explanation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get match explanation for a listing',
    description: 'Returns why this listing fits the buyer (array of bullet points) and why now (market context text). Uses buyer preferences if available, otherwise returns generic explanation. Results are cached for 24 hours.'
  })
  @ApiParam({ name: 'id', description: 'Listing ID (UUID)', type: String })
  @ApiQuery({ name: 'buyerId', required: true, description: 'Buyer ID (UUID)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Match explanation retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            whyFits: {
              type: 'array',
              items: { type: 'string' },
              example: ['Within your preferred price range', 'Located in your desired zone', 'Matches your bedroom requirements']
            },
            whyNow: {
              type: 'string',
              nullable: true,
              example: 'Only 12 active listings available in this zone. Recent increase in new listings indicates active market.'
            },
            calculatedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'buyerId query parameter is required' })
  async getMatchExplanation(
    @Param('id') listingId: string,
    @Query('buyerId') buyerId: string,
  ) {
    if (!buyerId) {
      return {
        success: false,
        error: 'buyerId query parameter is required',
      };
    }

    const explanation = await this.matchExplanationService.getMatchExplanation(
      listingId,
      buyerId,
    );

    return {
      success: true,
      data: explanation,
    };
  }
}
