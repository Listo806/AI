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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

import { FinancialService } from './financial.service';
import { CreateFinancialClientDto } from './dto/create-financial-client.dto';
import { UpdateFinancialClientDto } from './dto/update-financial-client.dto';
import { CreateFinancialApplicationDto } from './dto/create-financial-application.dto';
import { UpdateFinancialApplicationDto } from './dto/update-financial-application.dto';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { UpdateFinancialAccountDto } from './dto/update-financial-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import { CreateFinancialInvestmentDto } from './dto/create-financial-investment.dto';
import { UpdateFinancialInvestmentDto } from './dto/update-financial-investment.dto';
import { CreateFinancialCommissionDto } from './dto/create-financial-commission.dto';
import { UpdateFinancialCommissionDto } from './dto/update-financial-commission.dto';

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
  async getClient(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
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
    @Param('id', ParseUUIDPipe) id: string,
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
  async removeClient(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.removeClient(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('client-search')
  @ApiOperation({ summary: 'Search financial clients (for linking a record)' })
  async searchClients(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.financial.searchClients(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      search,
    );
  }

  // ─── Applications ──────────────────────────────────────────────────────────

  @Get('applications')
  @ApiOperation({ summary: 'List applications (paginated, filterable, team-scoped)' })
  async listApplications(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financial.findAllApplications(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('applications')
  @ApiOperation({ summary: 'Create an application' })
  async createApplication(
    @Body() dto: CreateFinancialApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.createApplication(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get one application (team-scoped)' })
  async getApplication(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.findOneApplication(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('applications/:id')
  @ApiOperation({ summary: 'Update an application (team-scoped)' })
  async updateApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.updateApplication(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('applications/:id')
  @ApiOperation({ summary: 'Delete an application (team-scoped)' })
  async removeApplication(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.removeApplication(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Accounts ──────────────────────────────────────────────────────────────

  @Get('accounts')
  @ApiOperation({ summary: 'List accounts (paginated, filterable, team-scoped)' })
  async listAccounts(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financial.findAllAccounts(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create an account (CRM record, not a bank account)' })
  async createAccount(
    @Body() dto: CreateFinancialAccountDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.createAccount(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get one account (team-scoped)' })
  async getAccount(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.findOneAccount(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update an account (team-scoped)' })
  async updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialAccountDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.updateAccount(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete an account (team-scoped)' })
  async removeAccount(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.removeAccount(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Transactions ────────────────────────────────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: 'List transactions (paginated, filterable, team-scoped)' })
  async listTransactions(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financial.findAllTransactions(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Record a transaction (tracking record, not execution)' })
  async createTransaction(
    @Body() dto: CreateFinancialTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.createTransaction(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get one transaction (team-scoped)' })
  async getTransaction(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.findOneTransaction(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('transactions/:id')
  @ApiOperation({ summary: 'Update a transaction (team-scoped)' })
  async updateTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.updateTransaction(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Delete a transaction (team-scoped)' })
  async removeTransaction(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.removeTransaction(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Investments ─────────────────────────────────────────────────────────────

  @Get('investments')
  @ApiOperation({ summary: 'List investments (paginated, filterable, team-scoped)' })
  async listInvestments(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financial.findAllInvestments(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('investments')
  @ApiOperation({ summary: 'Create an investment holding (recorded value, not live price)' })
  async createInvestment(
    @Body() dto: CreateFinancialInvestmentDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.createInvestment(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('investments/:id')
  @ApiOperation({ summary: 'Get one investment (team-scoped)' })
  async getInvestment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.findOneInvestment(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('investments/:id')
  @ApiOperation({ summary: 'Update an investment (team-scoped)' })
  async updateInvestment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialInvestmentDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.updateInvestment(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('investments/:id')
  @ApiOperation({ summary: 'Delete an investment (team-scoped)' })
  async removeInvestment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.removeInvestment(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Commissions ─────────────────────────────────────────────────────────────

  @Get('commissions')
  @ApiOperation({ summary: 'List commissions (paginated, filterable, team-scoped)' })
  async listCommissions(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financial.findAllCommissions(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('commissions')
  @ApiOperation({ summary: 'Record a commission (fee revenue; separate from AUM/balances)' })
  async createCommission(
    @Body() dto: CreateFinancialCommissionDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.createCommission(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('commissions/:id')
  @ApiOperation({ summary: 'Get one commission (team-scoped)' })
  async getCommission(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.findOneCommission(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('commissions/:id')
  @ApiOperation({ summary: 'Update a commission (team-scoped)' })
  async updateCommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialCommissionDto,
    @CurrentUser() user: any,
  ) {
    return this.financial.updateCommission(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('commissions/:id')
  @ApiOperation({ summary: 'Delete a commission (team-scoped)' })
  async removeCommission(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.removeCommission(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  @Get('documents')
  @ApiOperation({ summary: 'List documents (team-scoped, paginated, filterable)' })
  async listDocuments(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('clientId') clientId?: string,
    @Query('accountId') accountId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financial.listDocuments(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      {
        search,
        clientId,
        accountId,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
    );
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload a document (multipart; optional client/account link)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body('title') title?: string,
    @Body('docType') docType?: string,
    @Body('clientId') clientId?: string,
    @Body('accountId') accountId?: string,
    @Body('notes') notes?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.financial.createDocument(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      file,
      { title, docType, clientId, accountId, notes },
    );
  }

  @Get('documents/:id/link')
  @ApiOperation({ summary: 'Get a short-lived signed download URL for a document' })
  async getDocumentLink(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.getDocumentDownloadUrl(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      id,
    );
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a document (team-scoped; removes the stored file)' })
  async removeDocument(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.financial.removeDocument(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      id,
    );
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'Financial Services analytics (real data, team-scoped)' })
  async reports(@CurrentUser() user: any) {
    return this.financial.getReports(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }
}
