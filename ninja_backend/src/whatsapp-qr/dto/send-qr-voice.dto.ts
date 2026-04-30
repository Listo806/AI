import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendQrVoiceDto {
  @ApiProperty({ description: 'Contact phone E.164; normalized server-side' })
  @IsString()
  @MinLength(1)
  contactPhone: string;

  @ApiProperty({ description: 'Audio as base64 (e.g. audio/ogg from MediaRecorder)' })
  @IsString()
  @MinLength(1)
  audioBase64: string;
}
