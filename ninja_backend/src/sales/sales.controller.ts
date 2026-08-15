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

import { SalesService } from './sales.service';
import { CreateSalesQuoteDto } from './dto/create-sales-quote.dto';
import { UpdateSalesQuoteDto } from './dto/update-sales-quote.dto';

// Sales Workspace API. JwtAuthGuard authenticates, PaymentGuard gates unpaid
// accounts, and WorkspaceLockGuard enforces the $97 add-on ONLY when the 'sales'
// lock is turned on (no-op by default). All data access is team-scoped inside the
// service.
@ApiTags('sales')
@ApiBearerAuth('JWT-auth')
@Controller('sales')
@RequiresWorkspace('sales')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Sales Workspace Overview KPIs (real data)' })
  async stats(@CurrentUser() user: any) {
    return this.sales.getStats(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('contacts')
  @ApiOperation({ summary: "Search the account's existing contacts for a quote" })
  async searchContacts(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.sales.searchContacts(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      search,
    );
  }

  @Get('quotes')
  @ApiOperation({ summary: 'List quotes (paginated, filterable, team-scoped)' })
  async listQuotes(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sales.findAllQuotes(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('quotes')
  @ApiOperation({ summary: 'Create a quote' })
  async createQuote(
    @Body() dto: CreateSalesQuoteDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.createQuote(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('quotes/:id')
  @ApiOperation({ summary: 'Get one quote (team-scoped)' })
  async getQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.findOneQuote(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('quotes/:id')
  @ApiOperation({ summary: 'Update a quote (team-scoped)' })
  async updateQuote(
    @Param('id') id: string,
    @Body() dto: UpdateSalesQuoteDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.updateQuote(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('quotes/:id')
  @ApiOperation({ summary: 'Delete a quote (team-scoped)' })
  async removeQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.removeQuote(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }
}
