import { Controller } from '@nestjs/common';

@Controller("trial")
export class TrialController {
  constructor(private trialService: TrialService) {}

  @Post("start-trial")
  startTrial(@Body() dto: StartTrialDto) {
    return this.trialService.startTrial(dto);
  }
}
