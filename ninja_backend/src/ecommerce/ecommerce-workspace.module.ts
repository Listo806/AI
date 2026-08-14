import { Module } from '@nestjs/common';
import { EcommerceWorkspaceController } from './ecommerce-workspace.controller';
import { EcommerceWorkspaceService } from './ecommerce-workspace.service';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';

@Module({
  imports: [PlatformMailModule],
  controllers: [EcommerceWorkspaceController],
  providers: [EcommerceWorkspaceService],
  exports: [EcommerceWorkspaceService],
})
export class EcommerceWorkspaceModule {}