import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendWhatsAppDto {
  @ApiProperty({ description: 'Lead ID' })
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ description: 'Message text' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
