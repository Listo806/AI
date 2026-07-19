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

  @Post('create-payment-intent')
  createPaymentIntent(
    @Body()
    body: {
      plan?: string;
      planKey?: string;
      source?: string;
      userId?: string | null;
      email?: string;
      name?: string;
      phone?: string;
      currency?: string;
    },
  ) {
    return this.paymentsService.createPaymentIntent(body);
  }
}