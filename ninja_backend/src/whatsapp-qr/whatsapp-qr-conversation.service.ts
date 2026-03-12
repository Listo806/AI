import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WhatsAppQrConversationService {
  constructor(private readonly db: DatabaseService) {}

  // Stub: getOrCreate and toggles implemented when inbound/outbound wired
}
