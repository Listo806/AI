import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SetupService } from "./setup.service";

@Controller("setup")
@UseGuards(JwtAuthGuard)
export class SetupController {
  constructor(private readonly service: SetupService) {}

  @Get()
  get(@CurrentUser() user: any, @Query("workspace_id") workspaceId?: string) {
    return this.service.get(user, workspaceId);
  }

  @Patch()
  patch(
    @CurrentUser() user: any,
    @Query("workspace_id") workspaceId: string | undefined,
    @Body() body: any,
  ) {
    return this.service.patch(user, workspaceId, body);
  }

  @Post("test")
  test(
    @CurrentUser() user: any,
    @Query("workspace_id") workspaceId: string | undefined,
    @Body() body: any,
  ) {
    return this.service.runTest(user, workspaceId, body);
  }

  @Post("activate")
  activate(
    @CurrentUser() user: any,
    @Query("workspace_id") workspaceId?: string,
  ) {
    return this.service.activate(user, workspaceId);
  }

  @Post("assistance")
  assistance(
    @CurrentUser() user: any,
    @Query("workspace_id") workspaceId: string | undefined,
    @Body() body: any,
  ) {
    return this.service.assistance(user, workspaceId, body);
  }

  @Post("assistance/dismiss")
  dismiss(
    @CurrentUser() user: any,
    @Query("workspace_id") workspaceId?: string,
  ) {
    return this.service.patch(user, workspaceId, {
      assistanceDismissed: true,
    });
  }
}
