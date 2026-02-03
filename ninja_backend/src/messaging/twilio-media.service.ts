import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import axios from 'axios';

/**
 * Download WhatsApp media from Twilio MediaUrl (MediaUrl0, etc.).
 * Twilio requires HTTP Basic Auth with AccountSid:AuthToken.
 * Transcription: prefer Twilio when available; otherwise optional Whisper/external.
 */
@Injectable()
export class TwilioMediaService {
  private readonly logger = new Logger(TwilioMediaService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Download media from Twilio MediaUrl. Uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for Basic auth.
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const accountSid = this.config.get('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get('TWILIO_AUTH_TOKEN');
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured for media download');
    }
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: accountSid,
        password: authToken,
      },
    });
    return Buffer.from(response.data);
  }

  /**
   * Transcribe audio buffer to text. Prefer Twilio when available.
   * When Twilio transcription is not yet wired, returns a placeholder so routing can proceed.
   */
  async transcribeAudio(buffer: Buffer, contentType?: string): Promise<string> {
    // TODO: Wire Twilio transcription (e.g. Twilio Media Streams / Record transcript or partner API).
    // For now return placeholder so pipeline works; routing will use this as message body.
    this.logger.debug(`transcribeAudio: buffer length=${buffer.length}, contentType=${contentType || 'unknown'}`);
    return '[Voice message]';
  }
}
