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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from './entities/lead.entity';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('public')
  @ApiOperation({ summary: 'Create a new lead from public contact form (no auth required)' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async createPublic(@Body() createLeadDto: CreateLeadDto) {
    // For public leads, we don't have a user ID, so we'll use null
    // The service will handle this appropriately
    return this.leadsService.createPublic(createLeadDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.create(createLeadDto, user.id, user.teamId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all leads (optionally filtered by status)' })
  @ApiQuery({ name: 'status', required: false, enum: LeadStatus, description: 'Filter leads by status' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: any, @Query('status') status?: LeadStatus) {
    if (status) {
      return this.leadsService.findByStatus(status, user.id, user.teamId);
    }
    return this.leadsService.findAll(user.id, user.teamId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({ type: UpdateLeadDto })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user.id, user.teamId);
  }

  @Post(':id/contact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Log a contact action (call, WhatsApp, or email)' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        actionType: { type: 'string', enum: ['call', 'whatsapp', 'email'] } 
      },
      required: ['actionType']
    } 
  })
  @ApiResponse({ status: 200, description: 'Contact action logged successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async logContact(
    @Param('id') id: string,
    @Body() body: { actionType: 'call' | 'whatsapp' | 'email' },
    @CurrentUser() user: any,
  ) {
    return this.leadsService.logContactAction(id, body.actionType, user.id, user.teamId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Lead deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.leadsService.delete(id, user.id, user.teamId);
    return { message: 'Lead deleted successfully' };
  }
}

