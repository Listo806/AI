import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ConnectQrDto {
  @ApiPropertyOptional({ description: 'Optional client correlation id' })
  @IsOptional()
  @IsUUID()
  clientRequestId?: string;
}
