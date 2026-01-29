import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendInstagramDmDto {
  @ApiProperty({ description: 'Lead ID' })
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ description: 'Message text (max 1000 chars)' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
