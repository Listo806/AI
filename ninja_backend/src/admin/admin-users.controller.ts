import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import {
  CreateAdminUserDto,
  InternalUserRole,
  INTERNAL_USER_ROLES,
} from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { InternalAdminGuard } from './internal-admin.guard';

class ResetInternalUserPasswordDto {
  @IsString()
  @MinLength(8)
  password: string;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, InternalAdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get('users')
  @ApiOperation({ summary: 'List internal users only' })
  @ApiQuery({ name: 'role', required: false, enum: INTERNAL_USER_ROLES })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'q', required: false })
  async list(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    const data = await this.adminUsers.findAll(role, status, q);
    return { data };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get one internal user with recent access audit' })
  @ApiParam({ name: 'id' })
  async getOne(@Param('id') id: string) {
    const data = await this.adminUsers.findOne(id);
    return { data };
  }

  @Post('users')
  @ApiOperation({ summary: 'Grant internal access; reuses an existing identity when email already exists' })
  @ApiBody({ type: CreateAdminUserDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Identity already has internal access' })
  async create(@Body() body: CreateAdminUserDto, @CurrentUser() actor: any) {
    const data = await this.adminUsers.create(body, actor?.id);
    return { data };
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update internal user identity/access' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateAdminUserDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
    @CurrentUser() actor: any,
  ) {
    const data = await this.adminUsers.update(id, body, actor?.id);
    return { data };
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update internal role' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: { role: { type: 'string', enum: [...INTERNAL_USER_ROLES] } },
    },
  })
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: InternalUserRole },
    @CurrentUser() actor: any,
  ) {
    const data = await this.adminUsers.updateRole(id, body.role, actor?.id);
    return { data };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Deactivate internal access only; preserves the users identity and customer data' })
  async deactivate(@Param('id') id: string, @CurrentUser() actor: any) {
    const data = await this.adminUsers.deactivate(id, actor?.id);
    return { data };
  }

  @Post('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate internal access' })
  async reactivate(@Param('id') id: string, @CurrentUser() actor: any) {
    const data = await this.adminUsers.reactivate(id, actor?.id);
    return { data };
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Set a new password and invalidate prior sessions' })
  async resetPassword(
    @Param('id') id: string,
    @Body() body: ResetInternalUserPasswordDto,
    @CurrentUser() actor: any,
  ) {
    const data = await this.adminUsers.resetPassword(id, body.password, actor?.id);
    return { data };
  }

  @Delete('users/:id/permanent')
  @ApiOperation({
    summary: 'Delete internal access record only. Authentication/customer identity is preserved.',
  })
  async removePermanent(@Param('id') id: string, @CurrentUser() actor: any) {
    const data = await this.adminUsers.hardRemove(id, actor?.id);
    return { data };
  }
}
