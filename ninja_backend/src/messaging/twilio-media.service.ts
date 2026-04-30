import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Download WhatsApp media from Twilio MediaUrl (MediaUrl0, etc.).
 * Twilio requires HTTP Basic Auth with AccountSid:AuthToken (owner credentials = full compliance for download).
 * Transcription: OpenAI Whisper (Twilio does not offer transcription for WhatsApp media files).
 */
@Injectable()
export class TwilioMediaService {
  private readonly logger = new Logger(TwilioMediaService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Download media from Twilio MediaUrl. Uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for Basic auth.
   * Owner (account) credentials satisfy Twilio's requirement for media download.
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
   * Map MIME type to file extension for Whisper (filename hint).
   */
  private getExtensionForContentType(contentType: string): string {
    const lower = (contentType || '').toLowerCase().split(';')[0].trim();
    const map: Record<string, string> = {
      'audio/ogg': '.ogg',
      'audio/opus': '.opus',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'audio/mp3': '.mp3',
      'audio/webm': '.webm',
      'audio/wav': '.wav',
      'audio/x-m4a': '.m4a',
    };
    return map[lower] || '.ogg';
  }

  /**
   * Transcribe audio buffer to text via OpenAI Whisper.
   * Twilio does not provide transcription for WhatsApp media; Whisper is used for full compliance.
   * Falls back to placeholder if OPENAI_API_KEY is missing or request fails.
   */
  async transcribeAudio(buffer: Buffer, contentType?: string): Promise<string> {
    const apiKey = this.config.get('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.debug('transcribeAudio: OPENAI_API_KEY not set, returning placeholder');
      return '[Voice message]';
    }

    const ext = this.getExtensionForContentType(contentType || '');
    const form = new FormData();
    form.append('file', buffer, {
      filename: `audio${ext}`,
      contentType: contentType || 'audio/ogg',
    });
    form.append('model', 'whisper-1');

    try {
      const response = await axios.post<{ text?: string }>(
        'https://api.openai.com/v1/audio/transcriptions',
        form,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...form.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 30_000,
        },
      );
      const text = response.data?.text?.trim();
      if (text) {
        this.logger.debug(`transcribeAudio: transcribed ${buffer.length} bytes -> ${text.length} chars`);
        return text;
      }
      return '[Voice message]';
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? (err as Error).message : String(err);
      this.logger.warn(`transcribeAudio: Whisper failed (${message}), returning placeholder`);
      return '[Voice message]';
    }
  }
}
