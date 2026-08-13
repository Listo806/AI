import { Injectable } from "@nestjs/common";
import { Subject } from "rxjs";

export type QrPayload = { userId: string; qr: string };
export type PairingCodePayload = { userId: string; code: string };
export type PairingErrorPayload = { userId: string; message: string };
export type ConnectedPayload = { userId: string; phone?: string | null };
export type DisconnectedPayload = { userId: string; reason?: string };
export type MessagePayload = {
  userId: string;
  conversationId: string;
  contactPhone: string;

  direction: "inbound" | "outbound";
  senderType: string;

  body: string | null;
  messageType: string;

  databaseMessageId?: string | null;
  messageId?: string | null;

  status?: "pending" | "sent" | "delivered" | "read" | "failed";

  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;

  createdAt: string;
};

export type MessageStatusPayload = {
  userId: string;

  databaseMessageId: string | null;
  messageId: string;

  conversationId: string;
  contactPhone: string;

  status: "sent" | "delivered" | "read" | "failed";

  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;

  updatedAt: string;
};
/**
 * Bridges Baileys socket lifecycle to Socket.IO without circular DI.
 * Gateway subscribes and emits to the user's room.
 */
@Injectable()
export class WhatsAppQrRealtimeService {
  readonly qr$ = new Subject<QrPayload>();
  readonly pairingCode$ = new Subject<PairingCodePayload>();
  readonly pairingError$ = new Subject<PairingErrorPayload>();
  readonly connected$ = new Subject<ConnectedPayload>();
  readonly disconnected$ = new Subject<DisconnectedPayload>();
  readonly message$ = new Subject<MessagePayload>();
  readonly messageStatus$ = new Subject<MessageStatusPayload>();

  /** Last QR per user — re-sent when client joins so they don't miss it */
  private readonly lastQrByUser = new Map<string, string>();
  /** Last mobile pairing-code per user — re-sent when client joins, but only while
   *  still fresh (codes expire WhatsApp-side within a few minutes). */
  private readonly lastPairingByUser = new Map<
    string,
    { code: string; at: number }
  >();
  private static readonly PAIRING_TTL_MS = 2 * 60 * 1000;

  emitQr(userId: string, qr: string): void {
    this.lastQrByUser.set(userId, qr);
    this.qr$.next({ userId, qr });
  }

  getLastQr(userId: string): string | null {
    return this.lastQrByUser.get(userId) ?? null;
  }

  clearQr(userId: string): void {
    this.lastQrByUser.delete(userId);
  }

  emitPairingCode(userId: string, code: string): void {
    this.lastPairingByUser.set(userId, { code, at: Date.now() });
    this.pairingCode$.next({ userId, code });
  }

  getLastPairingCode(userId: string): string | null {
    const entry = this.lastPairingByUser.get(userId);
    if (!entry) return null;
    if (Date.now() - entry.at > WhatsAppQrRealtimeService.PAIRING_TTL_MS) {
      this.lastPairingByUser.delete(userId);
      return null;
    }
    return entry.code;
  }

  clearPairingCode(userId: string): void {
    this.lastPairingByUser.delete(userId);
  }

  emitPairingError(userId: string, message: string): void {
    this.clearPairingCode(userId);
    this.pairingError$.next({ userId, message });
  }

  emitConnected(userId: string, phone?: string | null): void {
    this.clearQr(userId);
    this.clearPairingCode(userId);
    this.connected$.next({ userId, phone });
  }

  emitDisconnected(userId: string, reason?: string): void {
    this.clearPairingCode(userId);
    this.disconnected$.next({ userId, reason });
  }

  emitMessage(payload: MessagePayload): void {
    this.message$.next(payload);
  }

  emitMessageStatus(payload: MessageStatusPayload): void {
    this.messageStatus$.next(payload);
  }
}
