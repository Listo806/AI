import {Body,Controller,Get,Param,Patch,Post,Query,UseGuards} from "@nestjs/common";
import {ApiBearerAuth,ApiTags} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {PaymentGuard} from "../auth/guards/payment.guard";
import {CurrentUser} from "../auth/decorators/current-user.decorator";
import {AestheticClientsService} from "./aesthetic-clients.service";

@ApiTags("aesthetic-wellness-clients")
@ApiBearerAuth("JWT-auth")
@Controller("aesthetic-wellness/clients")
@UseGuards(JwtAuthGuard,PaymentGuard)
export class AestheticClientsController{
 constructor(private readonly service:AestheticClientsService){}
 @Get() list(@CurrentUser() user:any,@Query() query:any){return this.service.list(user,query)}
 @Get("stats") stats(@CurrentUser() user:any){return this.service.stats(user)}
 @Get(":id") get(@CurrentUser() user:any,@Param("id") id:string){return this.service.get(user,id)}
 @Post() create(@CurrentUser() user:any,@Body() body:any){return this.service.create(user,body)}
 @Patch(":id") update(@CurrentUser() user:any,@Param("id") id:string,@Body() body:any){return this.service.update(user,id,body)}
 @Patch(":id/archive") archive(@CurrentUser() user:any,@Param("id") id:string){return this.service.archive(user,id)}
 @Get(":id/activity") activity(@CurrentUser() user:any,@Param("id") id:string){return this.service.activity(user,id)}
}
