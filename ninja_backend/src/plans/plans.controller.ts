import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { publicPlansConfig } from './plan-config';

// Public: the pricing page, exit popup, and lock/upgrade screens read the plan
// catalog (labels, prices, limits, features) from here so the frontend and
// backend always agree on what each plan costs and unlocks. No secrets are
// exposed (Paddle price ids stay in env).
@ApiTags('plans')
@Controller('plans')
export class PlansController {
  @Get('config')
  @ApiOperation({ summary: 'Public plan catalog: prices, limits, features' })
  getConfig() {
    return publicPlansConfig();
  }
}
