import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChartsController } from './charts.controller';
@Module({imports:[AuthModule],controllers:[ChartsController]})
export class ChartsModule {}
