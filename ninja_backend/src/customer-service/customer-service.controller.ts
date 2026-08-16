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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

import { CustomerServiceService } from './customer-service.service';
import { CreateCsTicketDto } from './dto/create-cs-ticket.dto';
import { UpdateCsTicketDto } from './dto/update-cs-ticket.dto';

// Customer Service Workspace API. JwtAuthGuard authenticates, PaymentGuard gates
// unpaid accounts, and WorkspaceLockGuard enforces the $97 add-on ONLY when the
// 'customer-service' lock is on (no-op by default). All data access is team-scoped
// inside the service; every :id route is UUID-validated (malformed -> 400).
@ApiTags('customer-service')
@ApiBearerAuth('JWT-auth')
@Controller('customer-service')
@RequiresWorkspace('customer-service')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class CustomerServiceController {
  constructor(private readonly cs: CustomerServiceService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Customer Service Overview KPIs + charts (real data)' })
  async stats(@CurrentUser() user: any) {
    return this.cs.getStats(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('contacts')
  @ApiOperation({ summary: "Search the account's CRM contacts (customer picker)" })
  async searchContacts(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.cs.searchContacts(user.id, user.teamId ?? null, user.role ?? 'owner', search);
  }

  @Get('agents')
  @ApiOperation({ summary: "Search the account's team users (agent picker)" })
  async searchAgents(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.cs.searchAgents(user.id, user.teamId ?? null, user.role ?? 'owner', search);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List tickets (paginated, filterable, team-scoped)' })
  async listTickets(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('channel') channel?: string,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('slaStatus') slaStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cs.findAllTickets(user.id, user.teamId ?? null, user.role ?? 'owner', {
      search,
      status,
      priority,
      channel,
      category,
      assignedTo,
      slaStatus,
      page,
      limit,
    });
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a ticket' })
  async createTicket(@Body() dto: CreateCsTicketDto, @CurrentUser() user: any) {
    return this.cs.createTicket(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get one ticket (team-scoped)' })
  async getTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.findOneTicket(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Put('tickets/:id')
  @ApiOperation({ summary: 'Update a ticket (assign, change status/priority, resolve, close)' })
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCsTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.cs.updateTicket(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete('tickets/:id')
  @ApiOperation({ summary: 'Delete a ticket (team-scoped)' })
  async removeTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.cs.removeTicket(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }
}
