import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAdminTeamDto {
  @ApiProperty({ example: 'Acme Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seatLimit?: number;

  @ApiProperty({ description: 'User ID of the team owner' })
  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
