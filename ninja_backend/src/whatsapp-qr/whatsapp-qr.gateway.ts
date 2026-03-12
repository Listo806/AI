import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';
import { WhatsAppQrRealtimeService } from './whatsapp-qr-realtime.service';
import { Subscription } from 'rxjs';

/**
 * Namespace /whatsapp-qr — JWT in handshake auth.token or query.token.
 * Rooms: userId — events qr, connected, disconnected.
 * Spec: WHATSAPP-QR-ENTERPRISE-SPEC §6
 */
@WebSocketGateway({
  namespace: '/whatsapp-qr',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class WhatsAppQrGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WhatsAppQrGateway.name);
  private readonly subs = new Map<string, Subscription[]>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly config: ConfigService,
    private readonly realtime: WhatsAppQrRealtimeService,
  ) {}

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth as any)?.token ||
      (client.handshake.query?.token as string);
    if (!token || typeof token !== 'string') {
      this.logger.warn('WS reject: no token');
      client.disconnect(true);
      return;
    }
    let payload: any;
    try {
      payload = jwt.verify(token, this.config.getRequired('JWT_SECRET'));
    } catch {
      this.logger.warn('WS reject: invalid token');
      client.disconnect(true);
      return;
    }
    const userId = payload.id || payload.sub;
    if (!userId) {
      client.disconnect(true);
      return;
    }
    const room = String(userId);
    client.join(room);
    (client.data as any).userId = room;

    const subQr = this.realtime.qr$.subscribe(({ userId: uid, qr }) => {
      if (uid === room) client.emit('qr', { qr });
    });
    const subConn = this.realtime.connected$.subscribe(
      ({ userId: uid, phone }) => {
        if (uid === room) client.emit('connected', { phone });
      },
    );
    const subDisc = this.realtime.disconnected$.subscribe(
      ({ userId: uid, reason }) => {
        if (uid === room) client.emit('disconnected', { reason });
      },
    );
    const subMsg = this.realtime.message$.subscribe((payload) => {
      if (payload.userId === room) client.emit('message', payload);
    });
    this.subs.set(client.id, [subQr, subConn, subDisc, subMsg]);
    this.logger.log(`WS connected userId=${room} id=${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    const list = this.subs.get(client.id);
    if (list) {
      list.forEach((s) => s.unsubscribe());
      this.subs.delete(client.id);
    }
  }
}
