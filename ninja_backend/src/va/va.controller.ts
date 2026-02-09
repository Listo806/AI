import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { VaListingsService } from './va-listings.service';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';

@ApiTags('va')
@Controller('va')
export class VaController {
  constructor(private readonly vaListings: VaListingsService) {}

  @Post('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VA_UPLOADER, UserRole.VA)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create listing (VA uploader; always PENDING_REVIEW)' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  async createListing(@Body() dto: CreatePropertyDto, @CurrentUser() user: any) {
    const listing = await this.vaListings.create(
      dto,
      user.id,
      user.teamId,
    );
    return { data: listing };
  }
}
