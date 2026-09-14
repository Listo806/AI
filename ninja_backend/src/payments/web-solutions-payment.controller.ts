import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { WebSolutionsPaymentService } from './web-solutions-payment.service';

@Controller('payment/web-solutions')
export class WebSolutionsPaymentController {
  constructor(
    private readonly service:
      WebSolutionsPaymentService,
  ) {}

  @Get('config')
  config() {
    return this.service
      .getPublicConfig();
  }

  @Post('create-payment-intent')
  createPaymentIntent(
    @Body()
    body: {
      serviceId: string;
      fullName?: string;
      businessName?: string;
      email?: string;
      phone?: string;
      website?: string;
      userId?: string | null;
    },
  ) {
    return this.service
      .createPaymentIntent(
        body,
      );
  }

  @Post('confirm')
  confirm(
    @Body()
    body: {
      paymentIntentId: string;
      serviceId: string;
      userId?: string | null;
    },
  ) {
    return this.service
      .confirmPayment(
        body,
      );
  }
}
