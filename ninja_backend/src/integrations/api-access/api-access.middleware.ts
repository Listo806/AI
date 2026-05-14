import {
  Injectable,
  NestMiddleware,
} from "@nestjs/common";

import { Request, Response, NextFunction } from "express";

import { ApiAccessService } from "./api-access.service";

@Injectable()
export class ApiAccessMiddleware
  implements NestMiddleware
{
  constructor(
    private readonly apiAccessService: ApiAccessService,
  ) {}

  async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const apiKey =
      req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        message: "Missing API key",
      });
    }

    const key =
      await this.apiAccessService.validateApiKey(
        String(apiKey),
      );

    if (!key) {
      return res.status(401).json({
        message: "Invalid API key",
      });
    }

    /*
     * RATE LIMIT
     */

    const usage =
      await this.apiAccessService.getUsage(
        key.team_id,
      );

    const lastMinute = usage.filter(
      (x: any) =>
        Date.now() -
          new Date(
            x.created_at,
          ).getTime() <
        60000,
    );

    if (lastMinute.length > 100) {
      return res.status(429).json({
        message: "Rate limit exceeded",
      });
    }

    res.on("finish", async () => {
      await this.apiAccessService.logUsage(
        {
          apiKeyId: key.id,

          endpoint: req.originalUrl,

          method: req.method,

          ipAddress: req.ip || "",

          responseStatus: res.statusCode,
        },
      );
    });

    (req as any).apiTeamId =
      key.team_id;

    next();
  }
}