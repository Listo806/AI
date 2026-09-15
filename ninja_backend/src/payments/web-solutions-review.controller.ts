import { Body, Controller, Post } from '@nestjs/common';
import { WebSolutionsReviewService } from './web-solutions-review.service';

@Controller('web-solutions')
export class WebSolutionsReviewController {
  constructor(private readonly reviews: WebSolutionsReviewService) {}

  @Post('free-review')
  submit(@Body() body: any) {
    return this.reviews.submit(body);
  }
}
