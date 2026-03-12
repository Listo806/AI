import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WhatsAppQrMessageService {
  constructor(private readonly db: DatabaseService) {}

  // Stub: insert with ON CONFLICT when inbound wired
}
