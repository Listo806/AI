import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, Min, IsIn } from 'class-validator';

const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

export class UpdateDealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ enum: [...STAGES] })
  @IsOptional()
  @IsString()
  @IsIn([...STAGES])
  stage?: typeof STAGES[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
