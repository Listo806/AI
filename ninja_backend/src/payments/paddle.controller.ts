import { Controller, Get, UseGuards } from '@nestjs/common';
import { PaddleService } from './paddle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments/paddle')
export class PaddleController {
  constructor(private readonly paddleService: PaddleService) {}

  @Get('config/status')
  @UseGuards(JwtAuthGuard)
  async getConfigStatus() {
    return this.paddleService.getConfigStatus();
  }
}

