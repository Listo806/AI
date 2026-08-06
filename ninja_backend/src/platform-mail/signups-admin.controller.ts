import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SignupsAdminService } from './signups-admin.service';

// Admin-only Sign-ups and Customers sections. Sign-ups lists everyone who
// registered; Customers lists only those who paid. Same record moves between
// them, so a paid sign-up appears in both with checkout_status = 'paid'.
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class SignupsAdminController {
  constructor(private readonly signups: SignupsAdminService) {}

  @Get('signups')
  @ApiOperation({ summary: 'All sign-ups (registered), with attribution (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'q', required: false })
  async signupsList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
  ) {
    return this.signups.list('signups', limit, offset, q);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Paid customers only (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'q', required: false })
  async customersList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
  ) {
    return this.signups.list('customers', limit, offset, q);
  }

  @Get('signups/:id')
  @ApiOperation({ summary: 'One sign-up with its email history (admin)' })
  async detail(@Param('id') id: string) {
    return this.signups.detail(id);
  }
}
