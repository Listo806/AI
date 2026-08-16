import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

/**
 * Projects / Client Delivery Workspace API.
 *
 * Gated by the shared $97 workspace add-on (RequiresWorkspace + WorkspaceLockGuard)
 * exactly like the Sales / Financial / Marketing workspaces. All data is
 * team-scoped inside the service; the controller only forwards the current user.
 */
@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
@RequiresWorkspace('projects')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  /* ---- context / dashboard ---- */

  @Get('context')
  @ApiOperation({ summary: 'Resolved team, members and clients for pickers/uploads' })
  getContext(@CurrentUser() user: any) {
    return this.projects.getContext(user);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Overview KPIs, status breakdown, activity and deadlines' })
  getOverview(@CurrentUser() user: any) {
    return this.projects.getOverview(user);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Aggregated delivery reports' })
  getReports(@CurrentUser() user: any, @Query() query: any) {
    return this.projects.getReports(user, query);
  }

  @Get('time-expenses')
  @ApiOperation({ summary: 'Time entries + expenses summary for the Time & Expenses tab' })
  getTimeAndExpenses(@CurrentUser() user: any, @Query() query: any) {
    return this.projects.getTimeAndExpenses(user, query);
  }

  /* ---- tasks (shared team_tasks) ---- */

  @Get('tasks')
  listTasks(@CurrentUser() user: any, @Query() query: any) {
    return this.projects.listTasks(user, query);
  }

  @Post('tasks')
  createTask(@CurrentUser() user: any, @Body() body: any) {
    return this.projects.createTask(user, body);
  }

  @Get('tasks/:id')
  getTask(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.getTask(user, id);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.projects.updateTask(user, id, body);
  }

  @Delete('tasks/:id')
  deleteTask(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.deleteTask(user, id);
  }

  @Post('tasks/:id/time')
  logTime(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.projects.logTime(user, id, body);
  }

  /* ---- milestones ---- */

  @Get('milestones')
  listMilestones(@CurrentUser() user: any, @Query() query: any) {
    return this.projects.listMilestones(user, query);
  }

  @Post('milestones')
  createMilestone(@CurrentUser() user: any, @Body() body: any) {
    return this.projects.createMilestone(user, body);
  }

  @Patch('milestones/:id')
  updateMilestone(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.projects.updateMilestone(user, id, body);
  }

  @Delete('milestones/:id')
  deleteMilestone(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.deleteMilestone(user, id);
  }

  /* ---- deliverables ---- */

  @Get('deliverables')
  listDeliverables(@CurrentUser() user: any, @Query() query: any) {
    return this.projects.listDeliverables(user, query);
  }

  @Post('deliverables')
  createDeliverable(@CurrentUser() user: any, @Body() body: any) {
    return this.projects.createDeliverable(user, body);
  }

  @Patch('deliverables/:id')
  updateDeliverable(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.projects.updateDeliverable(user, id, body);
  }

  @Delete('deliverables/:id')
  deleteDeliverable(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.deleteDeliverable(user, id);
  }

  /* ---- expenses ---- */

  @Post('expenses')
  createExpense(@CurrentUser() user: any, @Body() body: any) {
    return this.projects.createExpense(user, body);
  }

  @Patch('expenses/:id')
  updateExpense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.projects.updateExpense(user, id, body);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.deleteExpense(user, id);
  }

  /* ---- clients (shared contacts) ---- */

  @Get('clients')
  listClients(@CurrentUser() user: any, @Query() query: any) {
    return this.projects.listClients(user, query);
  }

  @Get('clients/:id')
  getClientDetail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.getClientDetail(user, id);
  }

  /* ---- projects (collection + item; item routes MUST stay last) ---- */

  @Get()
  listProjects(@CurrentUser() user: any, @Query() query: any) {
    return this.projects.listProjects(user, query);
  }

  @Post()
  createProject(@CurrentUser() user: any, @Body() body: any) {
    return this.projects.createProject(user, body);
  }

  @Get(':id')
  getProject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.getProject(user, id);
  }

  @Post(':id/duplicate')
  duplicateProject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.duplicateProject(user, id);
  }

  @Patch(':id')
  updateProject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.projects.updateProject(user, id, body);
  }

  @Delete(':id')
  deleteProject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projects.deleteProject(user, id);
  }
}
