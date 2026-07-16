import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { DatabaseService } from "../../database/database.service";
import { ALLOW_BEFORE_AGENT_SETUP_KEY } from "../decorators/allow-before-agent-setup.decorator";

@Injectable()
export class AiAgentSetupCompleteGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowBeforeSetup = this.reflector.getAllAndOverride<boolean>(
      ALLOW_BEFORE_AGENT_SETUP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowBeforeSetup) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    const teamId = user?.teamId || user?.team_id || null;
    console.log("===== AI SETUP GUARD =====");
    console.log("teamId:", teamId);
    if (!teamId) {
      throw new ForbiddenException({
        code: "AI_AGENT_TEAM_REQUIRED",
        message: "A team is required to use the AI Agent.",
      });
    }

    const result = await this.db.query(
      `
      SELECT
        business_profile_completed,
        appointment_rules_configured,
        behavior_configured,
        automations_configured,
        tested,
        launched,
        paused

      FROM ai_agent_settings

      WHERE team_id = $1

      LIMIT 1
      `,
      [teamId],
    );

    const settings = result.rows[0];
    console.log("BLOCK:", settings);
    if (!settings) {
      await this.logBlockedAction(request, user, teamId, "settings_not_found");

      throw new ForbiddenException({
        code: "AI_AGENT_SETUP_REQUIRED",
        message: "Complete AI Agent setup before using this action.",
        setupComplete: false,
        launched: false,
      });
    }

    const launched = Boolean(settings.launched);

    if (!launched) {
      await this.logBlockedAction(request, user, teamId, "agent_not_launched");

      throw new ForbiddenException({
        code: "AI_AGENT_SETUP_REQUIRED",
        message:
          "Complete setup and launch your AI Agent before using this action.",

        setupComplete: false,
        launched: false,

        progress: {
          businessProfileCompleted: Boolean(
            settings.business_profile_completed,
          ),

          appointmentRulesConfigured: Boolean(
            settings.appointment_rules_configured,
          ),

          behaviorConfigured: Boolean(settings.behavior_configured),

          automationsConfigured: Boolean(settings.automations_configured),

          tested: Boolean(settings.tested),
        },
      });
    }

    return true;
  }

  private async logBlockedAction(
    request: any,
    user: any,
    teamId: string,
    reason: string,
  ) {
    const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

    if (!writeMethods.has(String(request?.method || "").toUpperCase())) {
      return;
    }

    try {
      await this.db.query(
        `
        INSERT INTO ai_activity (
          team_id,
          action,
          channel,
          outcome,
          metadata,
          created_at
        )
        VALUES (
          $1,
          'ai_action_blocked_before_setup',
          'web',
          'blocked',
          $2::jsonb,
          NOW()
        )
        `,
        [
          teamId,

          JSON.stringify({
            userId: user?.id || null,

            reason,

            method: request?.method || null,

            path: request?.originalUrl || request?.url || null,
          }),
        ],
      );
    } catch (error) {
      console.error("AI SETUP GUARD AUDIT FAILED:", error);
    }
  }
}
