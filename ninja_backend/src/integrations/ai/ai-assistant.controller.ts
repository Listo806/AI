import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AiAssistantService, ChatRequestDto, AnalyzeLeadDto, SuggestPropertiesDto } from './ai-assistant.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AiFeaturesGuard } from '../../subscriptions/guards/ai-features.guard';

@Controller('integrations/ai')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  @UseGuards(AiFeaturesGuard)
  async chat(
    @Body() chatRequestDto: ChatRequestDto,
    @CurrentUser() user: any,
  ) {
    // Add user context if not provided
    if (!chatRequestDto.context) {
      chatRequestDto.context = {
        userId: user.id,
        teamId: user.teamId,
      };
    }

    const result = await this.aiAssistantService.chat(chatRequestDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('analyze-lead')
  @UseGuards(AiFeaturesGuard)
  async analyzeLead(
    @Body() analyzeLeadDto: AnalyzeLeadDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.aiAssistantService.analyzeLead(analyzeLeadDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('suggest-properties')
  @UseGuards(AiFeaturesGuard)
  async suggestProperties(
    @Body() suggestPropertiesDto: SuggestPropertiesDto,
    @CurrentUser() user: any,
  ) {
    // Add user context if not provided
    if (!suggestPropertiesDto.userId && !suggestPropertiesDto.teamId) {
      suggestPropertiesDto.userId = user.id;
      suggestPropertiesDto.teamId = user.teamId;
    }

    const suggestions = await this.aiAssistantService.suggestProperties(suggestPropertiesDto);
    return {
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    };
  }

  @Get('config/status')
  async getConfigStatus() {
    return this.aiAssistantService.getConfigStatus();
  }
}

