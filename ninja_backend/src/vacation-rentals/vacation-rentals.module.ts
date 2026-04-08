import { Module } from '@nestjs/common';
import { VacationRentalsService } from './vacation-rentals.service';
import { VacationRentalsController } from './vacation-rentals.controller';

@Module({
  controllers: [VacationRentalsController],
  providers: [VacationRentalsService],
  exports: [VacationRentalsService],
})
export class VacationRentalsModule {}
