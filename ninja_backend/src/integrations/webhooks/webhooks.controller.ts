import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  private requireTeam(user: any): string {
    if (!user.teamId) {
      throw new ForbiddenException('User must be part of a team to manage webhooks');
    }
    return user.teamId;
  }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(this.requireTeam(user), dto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.webhooksService.findAll(this.requireTeam(user));
  }

  @Get('logs')
  async getLogs(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.webhooksService.getLogs(
      this.requireTeam(user),
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.findOne(id, this.requireTeam(user));
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(id, this.requireTeam(user), dto);
  }

  @Patch(':id/toggle')
  async toggleActive(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.toggleActive(id, this.requireTeam(user));
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.webhooksService.remove(id, this.requireTeam(user));
    return { deleted: true };
  }

  @Post(':id/test')
  async sendTest(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.sendTest(id, this.requireTeam(user));
  }
}
