import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string | null;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;
}
