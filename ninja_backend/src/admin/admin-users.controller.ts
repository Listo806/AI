import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

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

  @Get('users/:id')
  @ApiOperation({ summary: 'Get one user by id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getOne(@Param('id') id: string) {
    const data = await this.adminUsers.findOne(id);
    return { data };
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user (admin)' })
  @ApiBody({ type: CreateAdminUserDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 409 })
  async create(@Body() body: CreateAdminUserDto) {
    const data = await this.adminUsers.create(body);
    return { data };
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (admin)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateAdminUserDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async update(@Param('id') id: string, @Body() body: UpdateAdminUserDto) {
    const data = await this.adminUsers.update(id, body);
    return { data };
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role (legacy)' })
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

  @Delete('users/:id')
  @ApiOperation({ summary: 'Deactivate user (soft: keep account/data, block access)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async remove(@Param('id') id: string) {
    const data = await this.adminUsers.remove(id);
    return { data };
  }

  @Delete('users/:id/permanent')
  @ApiOperation({
    summary: 'Permanently delete user (hard delete; blocked if owns a shared workspace)',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 400, description: 'Owns a workspace with other active members (transfer ownership first)' })
  async removePermanent(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.adminUsers.hardRemove(id, user?.id);
    return { data };
  }
}
