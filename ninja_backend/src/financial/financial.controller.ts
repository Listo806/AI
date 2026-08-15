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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

import { FinancialService } from './financial.service';
import { CreateFinancialClientDto } from './dto/create-financial-client.dto';
import { UpdateFinancialClientDto } from './dto/update-financial-client.dto';

// Financial Services Workspace API. JwtAuthGuard authenticates, PaymentGuard gates
// unpaid accounts, and WorkspaceLockGuard enforces the $97 add-on ONLY when the
// 'financial_services' lock is on (no-op by default). All data access is
// team-scoped inside the service.
@ApiTags('financial')
@ApiBearerAuth('JWT-auth')
@Controller('financial')
@RequiresWorkspace('financial_services')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class FinancialController {
  constructor(private readonly financial: FinancialService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Financial Services Overview KPIs (real data)' })
  async stats(@CurrentUser() user: any) {
    return this.financial.getStats(user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get('contacts')
  @ApiOperation({ summary: "Search the account's existing contacts for a client" })
  async searchContacts(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.financial.searchContacts(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      search,
    );
  }

  @Get('clients')
  @ApiOperation({ summary: 'List clients (paginated, filterable, team-scoped)' })
  async listClients(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientType') clientType?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financial.findAllClients(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, clientType, riskLevel, page, limit },
    );
  }

  @Post('clients')
  @ApiOperation({ summary: 'Create a client (extends an existing contact)' })
  async createClient(
    @Body() dto: CreateFinancialClientDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.createClient(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get one client (team-scoped)' })
  async getClient(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financial.findOneClient(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('clients/:id')
  @ApiOperation({ summary: 'Update a client (team-scoped)' })
  async updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateFinancialClientDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.updateClient(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('clients/:id')
  @ApiOperation({ summary: 'Delete a client (team-scoped)' })
  async removeClient(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financial.removeClient(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }
}
