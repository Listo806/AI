import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PaymentGuard } from "../auth/guards/payment.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AestheticWellnessService } from "./aesthetic-wellness.service";

@ApiTags("aesthetic-wellness")
@ApiBearerAuth("JWT-auth")
@Controller("aesthetic-wellness")
@UseGuards(JwtAuthGuard, PaymentGuard)
export class AestheticWellnessController {
  constructor(private readonly service: AestheticWellnessService) {}

  private teamId(user: any) {
    return user?.teamId || user?.team_id || null;
  }

  @Get("dashboard")
  async dashboard(
    @CurrentUser() user: any,
    @Query("range") range = "today",
    @Query("location_id") locationId?: string,
    @Query("provider_id") providerId?: string,
  ) {
    try {
      return await this.service.getDashboard(this.teamId(user), {
        range,
        locationId,
        providerId,
      });
    } catch (error: any) {
      console.error("[AESTHETIC DASHBOARD ERROR]", {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        table: error?.table,
        column: error?.column,
        constraint: error?.constraint,
        stack: error?.stack,
      });

      throw error;
    }
  }

  @Get("setup-status")
  setupStatus(@CurrentUser() user: any) {
    return this.service.getSetupStatus(this.teamId(user));
  }

  @Get("conversion-flow")
  conversionFlow(@CurrentUser() user: any) {
    return this.service.getConversionFlow(this.teamId(user));
  }

  @Patch("pipeline-config")
  savePipeline(@CurrentUser() user: any, @Body() body: any) {
    return this.service.savePipelineConfig(
      this.teamId(user),
      body?.pipelineConfig || body || {},
    );
  }

  @Get("locations")
  locations(@CurrentUser() user: any) {
    return this.service.listLocations(this.teamId(user));
  }

  @Post("locations")
  createLocation(@CurrentUser() user: any, @Body() body: any) {
    return this.service.saveLocation(this.teamId(user), body);
  }

  @Patch("locations/:id")
  updateLocation(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.saveLocation(this.teamId(user), body, id);
  }

  @Get("providers")
  providers(
    @CurrentUser() user: any,
    @Query("location_id") locationId?: string,
  ) {
    return this.service.listProviders(this.teamId(user), locationId);
  }

  @Post("providers")
  createProvider(@CurrentUser() user: any, @Body() body: any) {
    return this.service.saveProvider(this.teamId(user), body);
  }

  @Patch("providers/:id")
  updateProvider(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.saveProvider(this.teamId(user), body, id);
  }

  @Get("treatments")
  treatments(@CurrentUser() user: any) {
    return this.service.listTreatments(this.teamId(user));
  }

  @Post("treatments")
  createTreatment(@CurrentUser() user: any, @Body() body: any) {
    return this.service.saveTreatment(this.teamId(user), body);
  }

  @Patch("treatments/:id")
  updateTreatment(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.saveTreatment(this.teamId(user), body, id);
  }
}
