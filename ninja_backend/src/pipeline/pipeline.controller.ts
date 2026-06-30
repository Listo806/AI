import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CrmAccessGuard } from "../subscriptions/guards/crm-access.guard";
import { PipelineService } from "./pipeline.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { MoveDealDto } from "./dto/move-deal.dto";

@ApiTags("pipeline")
@ApiBearerAuth("JWT-auth")
@Controller("pipeline")
@UseGuards(JwtAuthGuard, CrmAccessGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}
  @Get("dashboard")
  getDashboard(
    @Req() req: any,
    @Query("forecastRange") forecastRange = "month",
  ) {
    const user = req.user;

    return this.pipelineService.getDashboard(
      user.id,
      user.teamId || user.team_id || null,
      forecastRange,
    );
  }
  @Get()
  getPipeline(@Req() req: any) {
    const user = req.user;

    return this.pipelineService.getPipeline(
      user.id,
      user.teamId || user.team_id || null,
    );
  }

  @Get("summary")
  getSummary(@Req() req: any) {
    const user = req.user;

    return this.pipelineService.getSummary(
      user.id,
      user.teamId || user.team_id || null,
    );
  }

  @Post("deals")
  createDeal(@Body() body: CreateDealDto, @Req() req: any) {
    const user = req.user;

    return this.pipelineService.createDeal(
      body,
      user.id,
      user.teamId || user.team_id || null,
    );
  }

  @Patch("deals/:id")
  updateDeal(
    @Param("id") id: string,
    @Body() body: UpdateDealDto,
    @Req() req: any,
  ) {
    const user = req.user;

    return this.pipelineService.updateDeal(
      id,
      body,
      user.id,
      user.teamId || user.team_id || null,
    );
  }

  @Patch("deals/:id/move")
  moveDeal(
    @Param("id") id: string,
    @Body() body: MoveDealDto,
    @Req() req: any,
  ) {
    const user = req.user;

    return this.pipelineService.moveDeal(
      id,
      body,
      user.id,
      user.teamId || user.team_id || null,
    );
  }

  @Delete("deals/:id")
  deleteDeal(@Param("id") id: string, @Req() req: any) {
    const user = req.user;

    return this.pipelineService.deleteDeal(
      id,
      user.id,
      user.teamId || user.team_id || null,
    );
  }

  @Get("deals/:id/events")
  getDealEvents(@Param("id") id: string, @Req() req: any) {
    const user = req.user;

    return this.pipelineService.getDealEvents(
      id,
      user.id,
      user.teamId || user.team_id || null,
    );
  }
}
