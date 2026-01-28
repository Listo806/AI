import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { LeadsService } from '../leads.service';
import { AILeadAnalysisService } from '../services/ai-lead-analysis.service';
import { MessageDraftService, MessageChannel } from '../services/message-draft.service';

@ApiTags('leads')
@Controller('leads')
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth('JWT-auth')
export class AILeadController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly aiAnalysis: AILeadAnalysisService,
    private readonly messageDraft: MessageDraftService,
  ) {}

  @Get(':id/ai-analysis')
  @ApiOperation({
    summary: 'Get AI analysis for a lead',
    description: 'Returns score, intent, priority, summary, and next-action. Cached in DB. AI failures never block.',
  })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'AI analysis' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async getAiAnalysis(@Param('id') id: string, @CurrentUser() user: any) {
    const lead = await this.leadsService.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertAccess(lead, user);

    const teamId = lead.teamId ?? null;
    const analysis = await this.aiAnalysis.getOrGenerateAnalysis(id, teamId);
    return { data: analysis };
  }

  @Get(':id/ai/score')
  @ApiOperation({
    summary: 'Get AI score only for a lead',
    description: 'Returns 0–100 score, intent, priority. Cached. AI failures never block.',
  })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Score, intent, priority' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async getAiScore(@Param('id') id: string, @CurrentUser() user: any) {
    const lead = await this.leadsService.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertAccess(lead, user);

    const teamId = lead.teamId ?? null;
    const analysis = await this.aiAnalysis.getOrGenerateAnalysis(id, teamId);
    return {
      data: {
        score: analysis.score,
        intent_label: analysis.intent_label,
        priority: analysis.priority,
        updated_at: analysis.updated_at,
      },
    };
  }

  @Post(':id/ai/generate-draft')
  @ApiOperation({
    summary: 'Generate message draft for a lead',
    description: 'On-demand only. Channel: whatsapp | instagram | email. Never cached.',
  })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { channel: { type: 'string', enum: ['whatsapp', 'instagram', 'email'] } },
      required: ['channel'],
    },
  })
  @ApiResponse({ status: 200, description: 'Draft with content (and subject for email)' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async generateDraft(
    @Param('id') id: string,
    @Body() body: { channel: MessageChannel },
    @CurrentUser() user: any,
  ) {
    const lead = await this.leadsService.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertAccess(lead, user);

    const channel = body?.channel;
    if (!channel || !['whatsapp', 'instagram', 'email'].includes(channel)) {
      throw new ForbiddenException('channel must be one of: whatsapp, instagram, email');
    }

    const teamId = lead.teamId ?? null;
    const draft = await this.messageDraft.generateDraft(id, channel as MessageChannel, teamId);
    return { data: draft };
  }

  private assertAccess(lead: any, user: any): void {
    const ok = lead.teamId === user.teamId || lead.createdBy === user.id;
    if (!ok) throw new ForbiddenException('You do not have access to this lead');
  }
}
