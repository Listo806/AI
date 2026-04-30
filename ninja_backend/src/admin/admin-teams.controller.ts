import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminTeamsService } from './admin-teams.service';
import { CreateAdminTeamDto } from './dto/create-admin-team.dto';
import { UpdateAdminTeamDto } from './dto/update-admin-team.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminTeamsController {
  constructor(private readonly adminTeams: AdminTeamsService) {}

  @Get('teams')
  @ApiOperation({ summary: 'List all teams' })
  @ApiResponse({ status: 200 })
  async list() {
    const data = await this.adminTeams.findAll();
    return { data };
  }

  @Get('teams/:id')
  @ApiOperation({ summary: 'Get one team with members' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getOne(@Param('id') id: string) {
    const data = await this.adminTeams.findOne(id);
    return { data };
  }

  @Post('teams')
  @ApiOperation({ summary: 'Create team' })
  @ApiBody({ type: CreateAdminTeamDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  async create(@Body() body: CreateAdminTeamDto) {
    const data = await this.adminTeams.create(body);
    return { data };
  }

  @Put('teams/:id')
  @ApiOperation({ summary: 'Update team' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateAdminTeamDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async update(@Param('id') id: string, @Body() body: UpdateAdminTeamDto) {
    const data = await this.adminTeams.update(id, body);
    return { data };
  }

  @Delete('teams/:id')
  @ApiOperation({ summary: 'Delete team (unlinks all members)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async remove(@Param('id') id: string) {
    const data = await this.adminTeams.remove(id);
    return { data };
  }

  @Post('teams/:id/members/:userId')
  @ApiOperation({ summary: 'Add member to team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'userId', description: 'User ID to add' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 404 })
  async addMember(@Param('id') teamId: string, @Param('userId') userId: string) {
    const data = await this.adminTeams.addMember(teamId, userId);
    return { data };
  }

  @Delete('teams/:id/members/:userId')
  @ApiOperation({ summary: 'Remove member from team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 404 })
  async removeMember(@Param('id') teamId: string, @Param('userId') userId: string) {
    const data = await this.adminTeams.removeMember(teamId, userId);
    return { data };
  }
}
