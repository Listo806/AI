import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CustomerTwilioController } from './customer-twilio.controller';
import { CustomerTwilioService } from './customer-twilio.service';
@Module({imports:[DatabaseModule],controllers:[CustomerTwilioController],providers:[CustomerTwilioService],exports:[CustomerTwilioService]})
export class CustomerTwilioModule {}
