import { Injectable } from "@nestjs/common";
import { Subject } from "rxjs";

export type QrPayload = { userId: string; qr: string };
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
  readonly connected$ = new Subject<ConnectedPayload>();
  readonly disconnected$ = new Subject<DisconnectedPayload>();
  readonly message$ = new Subject<MessagePayload>();
  readonly messageStatus$ = new Subject<MessageStatusPayload>();

  /** Last QR per user — re-sent when client joins so they don't miss it */
  private readonly lastQrByUser = new Map<string, string>();

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

  emitConnected(userId: string, phone?: string | null): void {
    this.clearQr(userId);
    this.connected$.next({ userId, phone });
  }

  emitDisconnected(userId: string, reason?: string): void {
    this.disconnected$.next({ userId, reason });
  }

  emitMessage(payload: MessagePayload): void {
    this.message$.next(payload);
  }

  emitMessageStatus(payload: MessageStatusPayload): void {
    this.messageStatus$.next(payload);
  }
}
