import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ description: 'Lead ID' })
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Email body (plain text)' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
