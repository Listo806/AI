import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type QrPayload = { userId: string; qr: string };
export type ConnectedPayload = { userId: string; phone?: string | null };
export type DisconnectedPayload = { userId: string; reason?: string };

/**
 * Bridges Baileys socket lifecycle to Socket.IO without circular DI.
 * Gateway subscribes and emits to the user's room.
 */
@Injectable()
export class WhatsAppQrRealtimeService {
  readonly qr$ = new Subject<QrPayload>();
  readonly connected$ = new Subject<ConnectedPayload>();
  readonly disconnected$ = new Subject<DisconnectedPayload>();

  emitQr(userId: string, qr: string): void {
    this.qr$.next({ userId, qr });
  }

  emitConnected(userId: string, phone?: string | null): void {
    this.connected$.next({ userId, phone });
  }

  emitDisconnected(userId: string, reason?: string): void {
    this.disconnected$.next({ userId, reason });
  }
}
