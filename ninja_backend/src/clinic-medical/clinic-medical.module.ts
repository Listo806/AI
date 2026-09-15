import {Module} from "@nestjs/common";
import {ClinicMedicalController} from "./clinic-medical.controller";
import {ClinicMedicalService} from "./clinic-medical.service";
@Module({controllers:[ClinicMedicalController],providers:[ClinicMedicalService],exports:[ClinicMedicalService]})
export class ClinicMedicalModule{}