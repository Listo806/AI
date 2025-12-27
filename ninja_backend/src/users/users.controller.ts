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
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
      isActive: user.isActive,
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

