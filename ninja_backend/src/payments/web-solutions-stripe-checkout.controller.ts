import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { WebSolutionsStripeCheckoutService } from './web-solutions-stripe-checkout.service';

@Controller('payment/web-solutions')
export class WebSolutionsStripeCheckoutController {
  constructor(
    private readonly service:
      WebSolutionsStripeCheckoutService,
  ) {}

  @Post('create-checkout-session')
  createCheckoutSession(
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
    return this.service.createSession(
      body,
    );
  }

  @Post('confirm-checkout-session')
  confirmCheckoutSession(
    @Body()
    body: {
      sessionId: string;
    },
  ) {
    return this.service.confirmSession(
      body.sessionId,
    );
  }
}
