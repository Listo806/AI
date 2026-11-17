import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, ForbiddenException, BadRequestException, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChartsSubscriptionService } from './charts-subscription.service';
import { UserRole } from '../users/entities/user.entity';
@Controller('charts')
@UseGuards(JwtAuthGuard)
export class ChartsBillingController {
 constructor(private readonly billing: ChartsSubscriptionService) {}
 @Get('access') access(@Req() req:any){return this.billing.access(req.user.id);}
 @Post('exit-offer-token') exitOfferToken(@Req() req:any){return this.billing.issueExitOffer(req.user.id);}
 @Post('checkout') checkout(@Req() req:any,@Body() body:{billing:string;offerCode?:string;offerToken?:string}){return this.billing.createOrder(req.user.id,body?.billing,body?.offerCode,body?.offerToken);}
 @Get('orders') orders(@Req() req:any){return this.billing.myOrders(req.user.id);}
 @Post('orders/:id/receipt') @UseInterceptors(FileInterceptor('receipt',{limits:{fileSize:8*1024*1024}}))
 receipt(@Req() req:any,@Param('id') id:string,@Body('bankTransactionReference') reference:string,@UploadedFile() receipt:Express.Multer.File){return this.billing.submitReceipt(req.user.id,id,reference,receipt);}
 @Get('admin/plans') adminPlans(@Req() req:any){this.admin(req);return this.billing.adminPlans();}
 @Get('admin/billing-calendar') adminCalendar(@Req() req:any,@Query('month') month?:string){this.admin(req);return this.billing.adminBillingCalendar(month);}
 private admin(req:any){if(![UserRole.SUPER_ADMIN,UserRole.ADMIN].includes(req.user?.internalRole))throw new ForbiddenException('Internal administrator required');}
 @Get('admin/orders') adminOrders(@Req() req:any,@Query('status') status?:string){this.admin(req);return this.billing.adminOrders(status);}
 @Get('admin/orders/:id/receipt') async adminReceipt(@Req() req:any,@Param('id') id:string,@Res() res:any){this.admin(req);const r=await this.billing.adminReceipt(id);res.setHeader('Content-Type',r.receipt_mime);res.setHeader('Cache-Control','no-store');return res.send(r.receipt_data);}
 @Post('admin/orders/:id/review') review(@Req() req:any,@Param('id') id:string,@Body() body:{approve:boolean;note?:string}){this.admin(req);if(typeof body?.approve!=='boolean')throw new BadRequestException('approve must be boolean');return this.billing.review(id,req.user.id,body.approve,body.note||'');}
}
