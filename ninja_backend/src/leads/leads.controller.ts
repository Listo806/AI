import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from './entities/lead.entity';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.create(createLeadDto, user.id, user.teamId);
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query('status') status?: LeadStatus) {
    if (status) {
      return this.leadsService.findByStatus(status, user.id, user.teamId);
    }
    return this.leadsService.findAll(user.id, user.teamId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user.id, user.teamId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.leadsService.delete(id, user.id, user.teamId);
    return { message: 'Lead deleted successfully' };
  }
}

