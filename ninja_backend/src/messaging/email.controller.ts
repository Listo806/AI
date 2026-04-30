import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('email')
@Controller('email')
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth('JWT-auth')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email to a lead' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async send(@Body() dto: SendEmailDto, @CurrentUser() user: any) {
    const result = await this.email.sendForLead(dto, user.id, user.teamId);
    return { success: true, data: result };
  }
}
