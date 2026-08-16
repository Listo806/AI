import { Controller, Post, Body, Param, ParseUUIDPipe, Ip, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { MarketingService } from './marketing.service';
import { PublicFormSubmissionDto } from './dto/public-form-submission.dto';

// PUBLIC marketing endpoints — intentionally UNAUTHENTICATED so real visitors can
// submit forms. Critically, NO account/team id is accepted from the caller: the
// owning account is resolved server-side from the form row, and only Published forms
// accept submissions. A submitter therefore cannot target, read, or write any other
// account's data — the only thing they can do is add a submission (and, with an
// email, a lead) to the exact form they posted to.
@ApiTags('marketing-public')
@Controller('marketing/public')
export class MarketingPublicController {
  constructor(private readonly marketing: MarketingService) {}

  @Post('forms/:id/submit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit a published form (public; account derived from the form)' })
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublicFormSubmissionDto,
    @Ip() ip: string,
  ) {
    return this.marketing.createPublicSubmission(id, dto, ip || null);
  }
}
