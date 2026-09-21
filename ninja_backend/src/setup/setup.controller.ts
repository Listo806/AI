import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { SetupService } from "./setup.service";
@Controller("setup")
export class SetupController {
 constructor(private readonly service:SetupService){}
 @Get() get(@CurrentUser() u:any,@Query("workspace_id") ws?:string){ return this.service.get(u,ws); }
 @Patch() patch(@CurrentUser() u:any,@Query("workspace_id") ws:string|undefined,@Body() body:any){ return this.service.patch(u,ws,body); }
 @Post("test") test(@CurrentUser() u:any,@Query("workspace_id") ws:string|undefined,@Body() body:any){ return this.service.runTest(u,ws,body); }
 @Post("activate") activate(@CurrentUser() u:any,@Query("workspace_id") ws?:string){ return this.service.activate(u,ws); }
 @Post("assistance") assistance(@CurrentUser() u:any,@Query("workspace_id") ws:string|undefined,@Body() body:any){ return this.service.assistance(u,ws,body); }
 @Post("assistance/dismiss") dismiss(@CurrentUser() u:any,@Query("workspace_id") ws?:string){ return this.service.patch(u,ws,{assistanceDismissed:true}); }
}
