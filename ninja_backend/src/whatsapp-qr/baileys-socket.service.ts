import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnApplicationShutdown,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import { BaileysRedisAuthService } from "./baileys-redis-auth.service";
import { WhatsAppQrRealtimeService } from "./whatsapp-qr-realtime.service";
import { WhatsAppQrSessionService } from "./whatsapp-qr-session.service";
import { WhatsAppQrInboundService } from "./whatsapp-qr-inbound.service";

/**
 * One Baileys socket per userId. QR + connection events via WhatsAppQrRealtimeService.
 * Reconnect with backoff; SIGTERM does not clear auth (spec).
 */
export type SocketHandle = {
  userId: string;
  sessionId: string;
  connected: boolean;
  phone?: string | null;
};

type UserSocketContext = {
  sessionId: string;
  sock: any;
  reconnectAttempt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  closing: boolean;
};

@Injectable()
export class BaileysSocketService
  implements OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(BaileysSocketService.name);
  private readonly contexts = new Map<string, UserSocketContext>();
  private readonly handles = new Map<string, SocketHandle>();

  constructor(
    private readonly config: ConfigService,
    private readonly redisAuth: BaileysRedisAuthService,
    private readonly realtime: WhatsAppQrRealtimeService,
    private readonly sessions: WhatsAppQrSessionService,
    @Inject(forwardRef(() => WhatsAppQrInboundService))
    private readonly inbound: WhatsAppQrInboundService,
  ) {}

  isQrEnabled(): boolean {
    return this.config.get("WHATSAPP_QR_ENABLED") === "true";
  }

  getHandle(userId: string): SocketHandle | undefined {
    return this.handles.get(userId);
  }

  async ensureSocket(userId: string, sessionId: string): Promise<SocketHandle> {
    if (!this.isQrEnabled()) {
      return { userId, sessionId, connected: false };
    }

    const existing = this.handles.get(userId);
    if (existing?.connected) return existing;

    const authResult = await this.redisAuth.useRedisAuthState(userId);
    if (!authResult) {
      this.logger.warn(
        `No Redis auth for user ${userId}; set REDIS_URL to persist QR session`,
      );
      const handle: SocketHandle = { userId, sessionId, connected: false };
      this.handles.set(userId, handle);
      return handle;
    }

    await this.startSocket(userId, sessionId, authResult);
    return this.handles.get(userId) || { userId, sessionId, connected: false };
  }

  private async startSocket(
    userId: string,
    sessionId: string,
    authResult: { state: any; saveCreds: () => Promise<void> },
  ): Promise<void> {
    const oldCtx = this.contexts.get(userId);
    if (oldCtx?.sock) {
      try {
        oldCtx.sock.ev?.removeAllListeners?.();
        await oldCtx.sock.end?.(undefined);
      } catch {
        /* ignore */
      }
      try {
        oldCtx.sock.ws?.close?.();
      } catch {
        /* ignore */
      }
      if (oldCtx.reconnectTimer) {
        clearTimeout(oldCtx.reconnectTimer);
        oldCtx.reconnectTimer = null;
      }
      this.contexts.delete(userId);
    }

    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default || baileys.makeWASocket;
    const { DisconnectReason } = baileys;

    const { state, saveCreds } = authResult;

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      browser: ["Ninja", "Chrome", "120.0.0"],
      getMessage: async () => undefined,
    });

    const ctx: UserSocketContext = {
      sessionId,
      sock,
      reconnectAttempt: 0,
      reconnectTimer: null,
      closing: false,
    };
    this.contexts.set(userId, ctx);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.realtime.emitQr(userId, qr);
      }

      if (connection === "open") {
        ctx.reconnectAttempt = 0;
        const phone =
          state.creds?.me?.id?.split(":")[0]?.replace(/\D/g, "") || null;
        const handle: SocketHandle = {
          userId,
          sessionId,
          connected: true,
          phone,
        };
        this.handles.set(userId, handle);
        await this.sessions.setStatus(sessionId, "connected", phone);
        this.realtime.emitConnected(userId, phone);
        await this.redisAuth.refreshAuthTtl(userId);
        this.logger.log(`WhatsApp QR connected user=${userId} phone=${phone}`);
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut &&
          statusCode !== DisconnectReason.badSession;

        const handle: SocketHandle = {
          userId,
          sessionId,
          connected: false,
          phone: this.handles.get(userId)?.phone,
        };
        this.handles.set(userId, handle);

        if (statusCode === DisconnectReason.loggedOut) {
          await this.redisAuth.clearAuth(userId);
          await this.sessions.setStatus(sessionId, "disconnected");
        } else {
          await this.sessions.setStatus(sessionId, "connecting");
        }

        this.realtime.emitDisconnected(
          userId,
          lastDisconnect?.error?.message || "close",
        );

        if (ctx.closing || !shouldReconnect) {
          this.contexts.delete(userId);
          return;
        }

        const attempt = ++ctx.reconnectAttempt;
        const delayMs = Math.min(30000, 2000 * Math.pow(2, attempt - 1));
        this.logger.warn(
          `Baileys reconnect user=${userId} in ${delayMs}ms attempt=${attempt}`,
        );
        ctx.reconnectTimer = setTimeout(async () => {
          ctx.reconnectTimer = null;
          if (ctx.closing) return;
          const nextAuth = await this.redisAuth.useRedisAuthState(userId);
          if (nextAuth) await this.startSocket(userId, sessionId, nextAuth);
        }, delayMs);
      }
    });

    sock.ev.on("messages.upsert", async (upsert: any) => {
      const messages = upsert?.messages || [];
      const type = upsert?.type || "";
      if (!messages.length) return;
      await this.inbound.handleUpsert(userId, sessionId, messages, type);
    });

    const handle: SocketHandle = {
      userId,
      sessionId,
      connected: false,
    };
    this.handles.set(userId, handle);
  }

  /**
   * Send text to E.164 contact over Baileys (outbound).
   */
  async sendText(userId: string, toE164: string, text: string): Promise<void> {
    const ctx = this.contexts.get(userId);
    if (!ctx?.sock) throw new Error("WhatsApp QR socket not connected");
    const digits = toE164.replace(/\D/g, "");
    if (digits.length < 10) throw new Error("Invalid phone for send");
    const jid = `${digits}@s.whatsapp.net`;
    await ctx.sock.sendMessage(jid, { text });
  }

  /**
   * Send voice message (audio/ogg) to E.164 contact over Baileys.
   */
  async sendVoice(
    userId: string,
    toE164: string,
    audioBase64: string,
  ): Promise<void> {
    const ctx = this.contexts.get(userId);
    if (!ctx?.sock) throw new Error("WhatsApp QR socket not connected");
    const digits = toE164.replace(/\D/g, "");
    if (digits.length < 10) throw new Error("Invalid phone for send");
    const jid = `${digits}@s.whatsapp.net`;
    const buffer = Buffer.from(audioBase64, "base64");
    await ctx.sock.sendMessage(
      jid,
      {
        audio: buffer,
        mimetype: "audio/ogg; codecs=opus",
      },
      { sendAudioAsVoice: true },
    );
  }

  async disconnectUser(userId: string): Promise<void> {
    const ctx = this.contexts.get(userId);
    if (ctx) {
      ctx.closing = true;
      if (ctx.reconnectTimer) {
        clearTimeout(ctx.reconnectTimer);
        ctx.reconnectTimer = null;
      }
      const sock = ctx.sock;
      try {
        if (sock?.ev?.removeAllListeners) {
          sock.ev.removeAllListeners();
        }
        await sock?.end?.(undefined);
      } catch {
        // ignore
      }
      try {
        if (sock?.ws?.close) sock.ws.close();
      } catch {
        // ignore
      }
      this.contexts.delete(userId);
    }
    this.handles.delete(userId);
    this.logger.log(`Socket disconnected for user ${userId}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.shutdownAll(false);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.shutdownAll(false);
  }

  /** clearAuth=false on shutdown so next deploy can resume session */
  private async shutdownAll(clearAuth: boolean): Promise<void> {
    for (const userId of [...this.contexts.keys()]) {
      if (clearAuth) await this.redisAuth.clearAuth(userId);
      await this.disconnectUser(userId);
    }
  }

  async hasStoredAuth(userId: string): Promise<boolean> {
    return this.redisAuth.hasStoredCredentials(userId);
  }
}
