import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_MAX_PER_MINUTE = 20;
const WINDOW_MS = 60000;

@Injectable()
export class OutboundThrottleService {
  private readonly logger = new Logger(OutboundThrottleService.name);
  private readonly windows = new Map<string, number[]>();

  allow(sessionId: string, maxPerMinute = DEFAULT_MAX_PER_MINUTE): boolean {
    const now = Date.now();
    const list = this.windows.get(sessionId) || [];
    const cutoff = now - WINDOW_MS;
    const recent = list.filter((t) => t > cutoff);
    if (recent.length >= maxPerMinute) {
      this.logger.warn(`Throttle: session ${sessionId} exceeded ${maxPerMinute}/min`);
      return false;
    }
    recent.push(now);
    this.windows.set(sessionId, recent);
    return true;
  }

  reset(sessionId: string): void {
    this.windows.delete(sessionId);
  }
}
