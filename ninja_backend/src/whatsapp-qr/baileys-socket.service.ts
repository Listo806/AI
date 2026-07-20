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
import { WhatsAppQrMessageService } from "./whatsapp-qr-message.service";

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

    private readonly messages: WhatsAppQrMessageService,
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

  private resolveBaileysMessageStatus(
    rawStatus: unknown,
  ): "sent" | "delivered" | "read" | null {
    /*
     * Very important:
     * Number(null) and Number("") are both equal to 0.
     * Failure to check beforehand will result in the message being incorrectly marked as failed.
     */
    if (rawStatus === null || rawStatus === undefined || rawStatus === "") {
      return null;
    }
    const status = Number(rawStatus);

    if (!Number.isFinite(status)) {
      return null;
    }

    /*
     * Baileys WAMessageStatus:
     *
     * 0 = ERROR
     * 1 = PENDING
     * 2 = SERVER_ACK
     * 3 = DELIVERY_ACK
     * 4 = READ
     * 5 = PLAYED
     *
     * Do not convert 0 to failed here.
     * The status=0 event may occur in incomplete updates.
     * Failed should be handled from the actual submission error.
     */
    if (status >= 4) {
      return "read";
    }
    if (status === 3) {
      return "delivered";
    }
    if (status === 2) {
      return "sent";
    }
    return null;
  }

  private normalizeReceiptTimestamp(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      /*
       * WhatsApp thường trả Unix seconds.
       * Nếu giá trị rất lớn thì coi là milliseconds.
       */
      const milliseconds = value > 10_000_000_000 ? value : value * 1000;

      const date = new Date(milliseconds);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    if (typeof value === "string" && value.trim()) {
      const numericValue = Number(value);

      if (Number.isFinite(numericValue)) {
        const milliseconds =
          numericValue > 10_000_000_000 ? numericValue : numericValue * 1000;

        const numericDate = new Date(milliseconds);

        if (!Number.isNaN(numericDate.getTime())) {
          return numericDate;
        }
      }

      const parsedDate = new Date(value);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return new Date();
  }

  private async persistMessageStatus(params: {
    userId: string;
    messageId: string;
    status: "sent" | "delivered" | "read" | "failed";
    occurredAt?: Date | string | null;
  }): Promise<void> {
    const messageId = String(params.messageId || "").trim();

    if (!messageId) {
      return;
    }

    try {
      let updatedMessage: any | null = null;

      for (let attempt = 1; attempt <= 5; attempt += 1) {
        updatedMessage = await this.messages.updateOutboundStatusByMessageId({
          messageId,
          status: params.status,
          occurredAt: params.occurredAt || new Date(),
        });

        if (updatedMessage) {
          break;
        }
        if (attempt < 5) {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, attempt * 150),
          );
        }
      }

      if (!updatedMessage) {
        this.logger.warn(
          `Receipt could not be matched after retries messageId=${messageId} status=${params.status}`,
        );
        return;
      }

      this.realtime.emitMessageStatus({
        userId: params.userId,
        databaseMessageId: updatedMessage.id || null,
        messageId: updatedMessage.message_id,
        conversationId: updatedMessage.conversation_id,
        contactPhone: updatedMessage.contact_phone,
        status: updatedMessage.status,

        sentAt:
          updatedMessage.sent_at?.toISOString?.() ||
          updatedMessage.sent_at ||
          null,

        deliveredAt:
          updatedMessage.delivered_at?.toISOString?.() ||
          updatedMessage.delivered_at ||
          null,

        readAt:
          updatedMessage.read_at?.toISOString?.() ||
          updatedMessage.read_at ||
          null,

        failedAt:
          updatedMessage.failed_at?.toISOString?.() ||
          updatedMessage.failed_at ||
          null,

        updatedAt: new Date().toISOString(),
      });

      this.logger.debug(
        `WhatsApp message status updated messageId=${messageId} status=${updatedMessage.status}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to update WhatsApp message status messageId=${messageId}`,
        error?.stack || error?.message || error,
      );
    }
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

    sock.ev.on("messages.update", async (updates: any[]) => {
      if (!Array.isArray(updates) || updates.length === 0) {
        return;
      }

      for (const item of updates) {
        const messageId = String(item?.key?.id || "").trim();
        this.logger.debug(
          `Baileys messages.update messageId=${messageId || "empty"} ` +
            `fromMe=${String(item?.key?.fromMe)} ` +
            `rawStatus=${String(item?.update?.status)}`,
        );
        if (!messageId) {
          continue;
        }
        if (item?.key?.fromMe !== true) {
          continue;
        }
        const status = this.resolveBaileysMessageStatus(item?.update?.status);
        if (!status) {
          continue;
        }
        await this.persistMessageStatus({
          userId,
          messageId,
          status,
          occurredAt: new Date(),
        });
      }
    });

    sock.ev.on("message-receipt.update", async (updates: any[]) => {
      if (!Array.isArray(updates) || updates.length === 0) {
        return;
      }
      for (const item of updates) {
        const messageId = String(item?.key?.id || "").trim();
        if (!messageId) {
          continue;
        }
        /*
         * readTimestamp This means the recipient has read it..
         */
        const readTimestamp =
          item?.receipt?.readTimestamp ??
          item?.receipt?.playedTimestamp ??
          null;

        if (readTimestamp) {
          await this.persistMessageStatus({
            userId,
            messageId,
            status: "read",
            occurredAt: this.normalizeReceiptTimestamp(readTimestamp),
          });

          continue;
        }
        /*
         * receiptTimestamp This means the device has been delivered..
         */
        const deliveredTimestamp =
          item?.receipt?.receiptTimestamp ??
          item?.receipt?.deliveredTimestamp ??
          null;

        if (deliveredTimestamp) {
          await this.persistMessageStatus({
            userId,
            messageId,
            status: "delivered",
            occurredAt: this.normalizeReceiptTimestamp(deliveredTimestamp),
          });
        }
      }
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
  async sendText(
    userId: string,
    toE164: string,
    text: string,
  ): Promise<string | null> {
    const ctx = this.contexts.get(userId);
    if (!ctx?.sock) {
      throw new Error("WhatsApp QR socket not connected");
    }
    const digits = String(toE164 || "").replace(/\D/g, "");
    if (digits.length < 10) {
      throw new Error("Invalid phone for send");
    }
    const jid = `${digits}@s.whatsapp.net`;
    const result = await ctx.sock.sendMessage(jid, {
      text,
    });
    return result?.key?.id || null;
  }

  /**
   * Send voice message (audio/ogg) to E.164 contact over Baileys.
   */
  async sendVoice(
    userId: string,
    toE164: string,
    audioBase64: string,
  ): Promise<string | null> {
    const ctx = this.contexts.get(userId);
    if (!ctx?.sock) {
      throw new Error("WhatsApp QR socket not connected");
    }
    const digits = String(toE164 || "").replace(/\D/g, "");
    if (digits.length < 10) {
      throw new Error("Invalid phone for send");
    }
    const jid = `${digits}@s.whatsapp.net`;
    const buffer = Buffer.from(audioBase64, "base64");
    const result = await ctx.sock.sendMessage(jid, {
      audio: buffer,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true,
    });
    return result?.key?.id || null;
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
