import { Controller, Get, Post, Param, Body, ParseUUIDPipe, UseGuards, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class CreateReviewDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  reviewer_name?: string;
}

@ApiTags('vacation-rentals')
@Controller('properties')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** Public — list reviews for a property */
  @Get(':id/reviews')
  @ApiOperation({ summary: 'List reviews for a property (public)' })
  async list(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.listForProperty(id);
  }

  /** Authenticated — submit a review */
  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a review for a vacation property' })
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.create({
      property_id: id,
      rating: dto.rating,
      comment: dto.comment,
      reviewer_id: user?.id || null,
      reviewer_name: dto.reviewer_name || user?.name || user?.email || null,
    });
  }
}
