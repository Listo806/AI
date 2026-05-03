import { Controller, Post, Body } from '@nestjs/common';
import { TrialService } from './trial.service';

@Controller('trial')
export class TrialController {
  constructor(private trialService: TrialService) {}

  @Post('start-trial')
  startTrial(@Body() dto: any) {
    return this.trialService.startTrial(dto);
  }
}