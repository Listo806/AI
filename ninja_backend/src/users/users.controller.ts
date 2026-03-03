import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    // Fetch fresh user data to ensure teamId is up to date
    const freshUser = await this.usersService.findById(user.id);
    return {
      id: freshUser?.id,
      email: freshUser?.email,
      name: freshUser?.name ?? null,
      phone: freshUser?.phone ?? null,
      role: freshUser?.role,
      teamId: freshUser?.teamId,
      isActive: freshUser?.isActive,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (name, phone)' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name ?? null,
      phone: updated.phone ?? null,
      role: updated.role,
      teamId: updated.teamId,
      isActive: updated.isActive,
    };
  }

  @Get('admin-only')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Admin/Developer only endpoint (for testing)' })
  @ApiResponse({ status: 200, description: 'Access granted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Developer role required' })
  adminOnly() {
    return {
      message: 'This is an admin/developer only endpoint',
    };
  }
}

