import { Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  @Get('client-token')
  @UseGuards(JwtAuthGuard)
  async getClientToken() {
    const token = await this.paddleService.getClientToken();
    // If token is null, frontend will automatically fall back to vendor ID
    return { clientToken: token };
  }
}

