import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, Min, IsIn, IsDateString } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Assign deal to a team member' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Why the deal was lost (used by Analytics lost-reason breakdown)' })
  @IsOptional()
  @IsString()
  lostReason?: string | null;

  @ApiPropertyOptional({ description: 'Expected close date (YYYY-MM-DD; used by Upcoming Closings)' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string | null;
}
