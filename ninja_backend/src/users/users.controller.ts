import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    // Fetch fresh user data to ensure teamId is up to date
    const freshUser = await this.usersService.findById(user.id);
    return {
      id: freshUser?.id,
      email: freshUser?.email,
      role: freshUser?.role,
      teamId: freshUser?.teamId,
      isActive: freshUser?.isActive,
    };
  }

  @Get('admin-only')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  adminOnly() {
    return {
      message: 'This is an admin/developer only endpoint',
    };
  }
}

