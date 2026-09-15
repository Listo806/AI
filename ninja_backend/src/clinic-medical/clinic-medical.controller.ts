import {Body,Controller,Get,Param,Patch,Post,Query,UseGuards} from "@nestjs/common";
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {PaymentGuard} from "../auth/guards/payment.guard";
import {CurrentUser} from "../auth/decorators/current-user.decorator";
import {ClinicMedicalService} from "./clinic-medical.service";
@Controller("clinic-medical")
@UseGuards(JwtAuthGuard,PaymentGuard)
export class ClinicMedicalController{
 constructor(private readonly svc:ClinicMedicalService){}
 @Get("dashboard") dashboard(@CurrentUser()u:any){return this.svc.dashboard(u)}
 @Get("patients/stats") stats(@CurrentUser()u:any){return this.svc.patientStats(u)}
 @Get("patients") patients(@CurrentUser()u:any,@Query()q:any){return this.svc.patients(u,q)}
 @Post("patients") create(@CurrentUser()u:any,@Body()b:any){return this.svc.createPatient(u,b)}
 @Get("patients/:id") patient(@CurrentUser()u:any,@Param("id")id:string){return this.svc.patient(u,id)}
 @Patch("patients/:id") update(@CurrentUser()u:any,@Param("id")id:string,@Body()b:any){return this.svc.updatePatient(u,id,b)}
 @Patch("patients/:id/archive") archive(@CurrentUser()u:any,@Param("id")id:string){return this.svc.archivePatient(u,id)}
 @Get("patients/:id/consultations") consultations(@CurrentUser()u:any,@Param("id")id:string){return this.svc.consultations(u,id)}
 @Post("consultations") createConsult(@CurrentUser()u:any,@Body()b:any){return this.svc.createConsultation(u,b)}
 @Get("consultations/:id") consultation(@CurrentUser()u:any,@Param("id")id:string){return this.svc.consultation(u,id)}
 @Patch("consultations/:id") save(@CurrentUser()u:any,@Param("id")id:string,@Body()b:any){return this.svc.saveConsultation(u,id,b)}
 @Post("consultations/:id/complete") complete(@CurrentUser()u:any,@Param("id")id:string,@Body()b:any){return this.svc.completeConsultation(u,id,b)}
 @Get("providers") providers(@CurrentUser()u:any){return this.svc.providers(u)}
}