import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MarketplacePlansService } from './marketplace-plans.service';
@Controller('admin/marketplace/bank-transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class MarketplaceBankAdminController {
 constructor(private readonly plans:MarketplacePlansService){}
 @Get() list(@Query('status') status?:string){return this.plans.adminBankRequests(status)}
 @Post(':id/review') review(@Param('id') id:string,@CurrentUser() user:any,@Body() body:{approve:boolean;note:string}){
   return this.plans.adminReviewBankRequest(id,user.id,body?.approve===true,String(body?.note||''));
 }
}
