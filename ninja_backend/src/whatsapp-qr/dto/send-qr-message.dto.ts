import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendQrMessageDto {
  @ApiProperty({ description: 'Contact phone E.164; normalized server-side' })
  @IsString()
  @MinLength(1)
  contactPhone: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message: string;
}
