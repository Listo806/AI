import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

/**
 * Redis namespace baileys:auth:{userId}. Full impl when ioredis + Baileys wired.
 */
@Injectable()
export class BaileysRedisAuthService {
  private readonly logger = new Logger(BaileysRedisAuthService.name);

  constructor(private readonly config: ConfigService) {}

  key(userId: string): string {
    return `baileys:auth:${userId}`;
  }

  async clearAuth(userId: string): Promise<void> {
    const redisUrl = this.config.get('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set; clearAuth no-op');
      return;
    }
    // TODO: DEL key when ioredis is added
    this.logger.log(`clearAuth requested for ${userId} (Redis DEL pending ioredis)`);
  }
}
