import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectWhatsAppDto {
  @ApiProperty({ description: 'Twilio sub-account SID (AC...)' })
  @IsString()
  @IsNotEmpty()
  twilioSubAccountSid: string;

  @ApiProperty({ description: 'Twilio sub-account auth token' })
  @IsString()
  @IsNotEmpty()
  twilioAuthToken: string;

  @ApiProperty({ description: 'WhatsApp number in E.164 (e.g. +14155551234)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'whatsappNumber must be E.164' })
  whatsappNumber: string;
}
