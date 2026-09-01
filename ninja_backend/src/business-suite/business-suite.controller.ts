import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';
import { BusinessSuiteService } from './business-suite.service';

@ApiTags('business-suite')
@ApiBearerAuth('JWT-auth')
@Controller('business-suite')
@RequiresWorkspace('business')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class BusinessSuiteController {
  constructor(private readonly business: BusinessSuiteService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Business Suite overview with real workspace-scoped KPIs' })
  overview(@CurrentUser() user: any) {
    return this.business.getOverview(user);
  }

  @Get('reports')
  reports(@CurrentUser() user: any, @Query() query: any) {
    return this.business.getReports(user, query);
  }

  @Get('activity')
  activity(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.business.listActivity(user, limit);
  }

  @Get('settings')
  settings(@CurrentUser() user: any) {
    return this.business.getSettings(user);
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: any, @Body() body: any) {
    return this.business.updateSettings(user, body);
  }

  // Shared Cortexa records used by Business Suite.
  @Get('tasks')
  tasks(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listTasks(user, query);
  }

  @Post('tasks')
  createTask(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createTask(user, body);
  }

  @Patch('tasks/:id')
  updateTask(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateTask(user, id, body);
  }

  @Delete('tasks/:id')
  deleteTask(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteTask(user, id);
  }

  @Get('documents')
  documents(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listDocuments(user, query);
  }

  @Get('customers-summary')
  customersSummary(@CurrentUser() user: any) {
    return this.business.getCustomersSummary(user);
  }

  @Get('customers')
  customers(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listCustomers(user, query);
  }

  @Get('companies')
  companies(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'companies', query);
  }

  @Post('companies')
  createCompany(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'companies', body);
  }

  @Patch('companies/:id')
  updateCompany(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'companies', id, body);
  }

  @Delete('companies/:id')
  deleteCompany(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'companies', id);
  }

  @Get('customer-groups')
  customerGroups(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'customerGroups', query);
  }

  @Post('customer-groups')
  createCustomerGroup(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'customerGroups', body);
  }

  @Patch('customer-groups/:id')
  updateCustomerGroup(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'customerGroups', id, body);
  }

  @Delete('customer-groups/:id')
  deleteCustomerGroup(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'customerGroups', id);
  }

  @Get('segments')
  segments(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'segments', query);
  }

  @Post('segments')
  createSegment(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'segments', body);
  }

  @Patch('segments/:id')
  updateSegment(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'segments', id, body);
  }

  @Delete('segments/:id')
  deleteSegment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'segments', id);
  }

  // Business Suite native resources.
  @Get('follow-ups')
  followUps(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'followUps', query);
  }

  @Post('follow-ups')
  createFollowUp(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'followUps', body);
  }

  @Patch('follow-ups/:id')
  updateFollowUp(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'followUps', id, body);
  }

  @Delete('follow-ups/:id')
  deleteFollowUp(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'followUps', id);
  }

  @Get('work-items')
  workItems(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'workItems', query);
  }

  @Post('work-items')
  createWorkItem(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'workItems', body);
  }

  @Patch('work-items/:id')
  updateWorkItem(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'workItems', id, body);
  }

  @Delete('work-items/:id')
  deleteWorkItem(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'workItems', id);
  }

  @Get('estimates')
  estimates(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'estimates', query);
  }

  @Post('estimates')
  createEstimate(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createEstimate(user, body);
  }

  @Patch('estimates/:id')
  updateEstimate(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateEstimate(user, id, body);
  }

  @Delete('estimates/:id')
  deleteEstimate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'estimates', id);
  }

  @Post('estimates/:id/convert-to-invoice')
  convertEstimate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.convertEstimateToInvoice(user, id);
  }

  @Get('invoices')
  invoices(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'invoices', query);
  }

  @Post('invoices')
  createInvoice(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createInvoice(user, body);
  }

  @Patch('invoices/:id')
  updateInvoice(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateInvoice(user, id, body);
  }

  @Delete('invoices/:id')
  deleteInvoice(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'invoices', id);
  }

  @Get('payments')
  payments(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'payments', query);
  }

  @Post('payments')
  createPayment(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createPayment(user, body);
  }

  @Patch('payments/:id')
  updatePayment(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updatePayment(user, id, body);
  }

  @Delete('payments/:id')
  deletePayment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deletePayment(user, id);
  }

  @Get('expenses')
  expenses(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'expenses', query);
  }

  @Post('expenses')
  createExpense(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'expenses', body);
  }

  @Patch('expenses/:id')
  updateExpense(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'expenses', id, body);
  }

  @Delete('expenses/:id')
  deleteExpense(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'expenses', id);
  }

  @Get('products')
  products(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'products', query);
  }

  @Post('products')
  createProduct(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'products', body);
  }

  @Patch('products/:id')
  updateProduct(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'products', id, body);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'products', id);
  }

  @Get('services')
  services(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'services', query);
  }

  @Post('services')
  createService(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'services', body);
  }

  @Patch('services/:id')
  updateService(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'services', id, body);
  }

  @Delete('services/:id')
  deleteService(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'services', id);
  }

  @Get('price-lists')
  priceLists(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'priceLists', query);
  }

  @Post('price-lists')
  createPriceList(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'priceLists', body);
  }

  @Patch('price-lists/:id')
  updatePriceList(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'priceLists', id, body);
  }

  @Delete('price-lists/:id')
  deletePriceList(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'priceLists', id);
  }

  @Get('categories')
  categories(@CurrentUser() user: any, @Query() query: any) {
    return this.business.listResource(user, 'categories', query);
  }

  @Post('categories')
  createCategory(@CurrentUser() user: any, @Body() body: any) {
    return this.business.createResource(user, 'categories', body);
  }

  @Patch('categories/:id')
  updateCategory(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.business.updateResource(user, 'categories', id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.business.deleteResource(user, 'categories', id);
  }
}
