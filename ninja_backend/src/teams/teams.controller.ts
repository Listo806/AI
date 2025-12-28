import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  async create(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: any) {
    return this.teamsService.create(createTeamDto, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.teamsService.findByUserId(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.update(id, updateTeamDto, user.id);
  }

  @Get(':id/seats')
  async getSeatInfo(@Param('id') id: string) {
    const [seatCount, availableSeats] = await Promise.all([
      this.teamsService.getSeatCount(id),
      this.teamsService.getAvailableSeats(id),
    ]);
    return {
      total: (await this.teamsService.findById(id))?.seatLimit || 0,
      used: seatCount,
      available: availableSeats,
    };
  }

  @Post(':id/members/:userId')
  async addMember(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.addMember(teamId, userId, user.id);
    return { message: 'Member added successfully' };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    await this.teamsService.removeMember(teamId, userId, user.id);
    return { message: 'Member removed successfully' };
  }
}

