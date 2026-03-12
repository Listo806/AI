import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

/**
 * One Baileys socket per userId. Full Baileys wiring in follow-up step.
 * Spec: WHATSAPP-QR-ENTERPRISE-SPEC.md §3, §6
 */
export type SocketHandle = {
  userId: string;
  sessionId: string;
  connected: boolean;
  phone?: string | null;
};

@Injectable()
export class BaileysSocketService implements OnModuleDestroy {
  private readonly logger = new Logger(BaileysSocketService.name);
  private readonly sockets = new Map<string, SocketHandle>();

  constructor(private readonly config: ConfigService) {}

  isQrEnabled(): boolean {
    return this.config.get('WHATSAPP_QR_ENABLED') === 'true';
  }

  getHandle(userId: string): SocketHandle | undefined {
    return this.sockets.get(userId);
  }

  /**
   * Placeholder: real implementation creates Baileys socket + Redis auth.
   */
  async ensureSocket(userId: string, sessionId: string): Promise<SocketHandle> {
    if (!this.isQrEnabled()) {
      return { userId, sessionId, connected: false };
    }
    const existing = this.sockets.get(userId);
    if (existing) return existing;
    const handle: SocketHandle = { userId, sessionId, connected: false };
    this.sockets.set(userId, handle);
    this.logger.log(`Socket placeholder registered for user ${userId} (Baileys not wired yet)`);
    return handle;
  }

  async disconnectUser(userId: string): Promise<void> {
    this.sockets.delete(userId);
    this.logger.log(`Socket removed for user ${userId}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.sockets.clear();
  }
}
