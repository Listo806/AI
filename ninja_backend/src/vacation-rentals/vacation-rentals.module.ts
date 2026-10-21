import { Module } from '@nestjs/common';
import { VacationSampleImportService } from './vacation-sample-import.service';
import { VacationRentalsService } from './vacation-rentals.service';
import { VacationRentalsController } from './vacation-rentals.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  controllers: [VacationRentalsController, ReviewsController],
  providers: [VacationRentalsService, VacationSampleImportService, ReviewsService],
  exports: [VacationRentalsService, ReviewsService],
})
export class VacationRentalsModule {}
