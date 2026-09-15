import {Module} from "@nestjs/common";
import {DatabaseModule} from "../database/database.module";
import {WorkspacesModule} from "../workspaces/workspaces.module";
import {PaymentGuard} from "../auth/guards/payment.guard";
import {AestheticWellnessController} from "./aesthetic-wellness.controller";
import {AestheticWellnessService} from "./aesthetic-wellness.service";
import {AestheticClientsController} from "./aesthetic-clients.controller";
import {AestheticClientsService} from "./aesthetic-clients.service";

@Module({
 imports:[DatabaseModule,WorkspacesModule],
 controllers:[AestheticWellnessController,AestheticClientsController],
 providers:[PaymentGuard,AestheticWellnessService,AestheticClientsService],
 exports:[AestheticWellnessService,AestheticClientsService],
})
export class AestheticWellnessModule{}
