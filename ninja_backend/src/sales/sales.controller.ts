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
import { CreateSalesProposalDto } from './dto/create-sales-proposal.dto';
import { UpdateSalesProposalDto } from './dto/update-sales-proposal.dto';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { CreateSalesContractDto } from './dto/create-sales-contract.dto';
import { UpdateSalesContractDto } from './dto/update-sales-contract.dto';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { UpdateSalesReturnDto } from './dto/update-sales-return.dto';

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

  @Post('quotes/:id/convert-to-proposal')
  @ApiOperation({ summary: 'Create a proposal from a quote (keeps the link)' })
  async convertQuoteToProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.convertQuoteToProposal(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Proposals ─────────────────────────────────────────────────────────────

  @Get('proposals')
  @ApiOperation({ summary: 'List proposals (paginated, filterable, team-scoped)' })
  async listProposals(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sales.findAllProposals(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('proposals')
  @ApiOperation({ summary: 'Create a proposal' })
  async createProposal(
    @Body() dto: CreateSalesProposalDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.createProposal(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('proposals/:id')
  @ApiOperation({ summary: 'Get one proposal (team-scoped)' })
  async getProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.findOneProposal(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('proposals/:id')
  @ApiOperation({ summary: 'Update a proposal (team-scoped)' })
  async updateProposal(
    @Param('id') id: string,
    @Body() dto: UpdateSalesProposalDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.updateProposal(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('proposals/:id')
  @ApiOperation({ summary: 'Delete a proposal (team-scoped)' })
  async removeProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.removeProposal(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Post('proposals/:id/convert-to-order')
  @ApiOperation({ summary: 'Create an order from a proposal (keeps the links)' })
  async convertProposalToOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.convertProposalToOrder(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

  @Get('orders')
  @ApiOperation({ summary: 'List orders (paginated, filterable, team-scoped)' })
  async listOrders(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sales.findAllOrders(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create an order' })
  async createOrder(@Body() dto: CreateSalesOrderDto, @CurrentUser() user: any) {
    return this.sales.createOrder(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get one order (team-scoped)' })
  async getOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.findOneOrder(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('orders/:id')
  @ApiOperation({ summary: 'Update an order (team-scoped)' })
  async updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.updateOrder(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Delete an order (team-scoped)' })
  async removeOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.removeOrder(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Contracts ───────────────────────────────────────────────────────────

  @Get('contracts')
  @ApiOperation({ summary: 'List contracts (paginated, filterable, team-scoped)' })
  async listContracts(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sales.findAllContracts(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('contracts')
  @ApiOperation({ summary: 'Create a contract' })
  async createContract(
    @Body() dto: CreateSalesContractDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.createContract(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Get one contract (team-scoped)' })
  async getContract(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.findOneContract(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('contracts/:id')
  @ApiOperation({ summary: 'Update a contract (team-scoped)' })
  async updateContract(
    @Param('id') id: string,
    @Body() dto: UpdateSalesContractDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.updateContract(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('contracts/:id')
  @ApiOperation({ summary: 'Delete a contract (team-scoped)' })
  async removeContract(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.removeContract(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Returns ─────────────────────────────────────────────────────────────

  @Get('returns')
  @ApiOperation({ summary: 'List returns (paginated, filterable, team-scoped)' })
  async listReturns(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sales.findAllReturns(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create a return' })
  async createReturn(@Body() dto: CreateSalesReturnDto, @CurrentUser() user: any) {
    return this.sales.createReturn(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get one return (team-scoped)' })
  async getReturn(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.findOneReturn(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('returns/:id')
  @ApiOperation({ summary: 'Update a return (team-scoped)' })
  async updateReturn(
    @Param('id') id: string,
    @Body() dto: UpdateSalesReturnDto,
    @CurrentUser() user: any,
  ) {
    return this.sales.updateReturn(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('returns/:id')
  @ApiOperation({ summary: 'Delete a return (team-scoped)' })
  async removeReturn(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sales.removeReturn(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }
}
