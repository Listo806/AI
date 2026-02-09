import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminUsersService } from './admin-users.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiQuery({ name: 'role', required: false })
  @ApiResponse({ status: 200 })
  async list(@Query('role') role?: string) {
    const data = await this.adminUsers.findAll(role);
    return { data };
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: { role: { type: 'string', enum: ['owner', 'agent', 'admin', 'va', 'va_uploader', 'user', 'super_admin'] } },
    },
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    const data = await this.adminUsers.updateRole(id, body.role);
    return { data };
  }
}
