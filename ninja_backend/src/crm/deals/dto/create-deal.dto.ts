import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, Min, IsIn } from 'class-validator';

const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

export class CreateDealDto {
  @ApiProperty({ example: 'Acme Corp - Downtown Unit' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 150000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ enum: [...STAGES], default: 'new' })
  @IsOptional()
  @IsString()
  @IsIn([...STAGES])
  stage?: typeof STAGES[number];

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
