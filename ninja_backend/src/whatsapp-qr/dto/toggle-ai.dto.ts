import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleAiDto {
  @ApiProperty({ description: 'When true, set owner_type=ai and ai_enabled=true' })
  @IsBoolean()
  aiEnabled: boolean;
}
