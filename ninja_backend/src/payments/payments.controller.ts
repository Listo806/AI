import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout')
  createCheckout(@Body() body: { userId: string }) {
    return this.paymentsService.createCheckout(body.userId);
  }

  @Post('payment-success')
  paymentSuccess(@Body() body: { userId: string }) {
    return this.paymentsService.paymentSuccess(body.userId);
  }
}
