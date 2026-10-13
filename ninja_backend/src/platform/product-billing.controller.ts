import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProductBillingService } from './product-billing.service';

@Controller('product-billing')
export class ProductBillingController {
  constructor(private readonly billing: ProductBillingService) {}
  @Get('catalog') catalog() { return this.billing.catalog(); }
  @Get('mine') @UseGuards(JwtAuthGuard) mine(@CurrentUser() user: any) { return this.billing.mine(user.id); }
  @Post('enroll') @UseGuards(JwtAuthGuard) enroll(@CurrentUser() user: any, @Body() body: any) {
    return this.billing.enroll(user.id, String(body?.planKey || ''), String(body?.interval || 'monthly'), body?.parentId,body?.autoRenew===true);
  }
  @Post('checkout') @UseGuards(JwtAuthGuard) checkout(@CurrentUser() user: any, @Body() body: any) {
    return this.billing.checkout(user.id, String(body?.enrollmentId || ''), String(body?.token || ''));
  }
  @Post('cancel/:id') @UseGuards(JwtAuthGuard) cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billing.cancel(user.id,id);
  }
  @Post('refund/:id') @UseGuards(JwtAuthGuard) refund(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billing.requestRefund(user.id,id);
  }
  @Get('payment/:id') @UseGuards(JwtAuthGuard) verify(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billing.verify(user.id, id);
  }
  @Post('admin/refund/:id/execute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  executeRefund(@Param('id') id: string) { return this.billing.executeApprovedRefund(id); }

  @Post('admin/refund/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  verifyRefund(@Param('id') id: string) { return this.billing.settleApprovedRefund(id); }

  @Get('entitlement/:category') @UseGuards(JwtAuthGuard) entitlement(@CurrentUser() user: any, @Param('category') category: string) {
    return this.billing.entitlement(user.id, category);
  }
}
