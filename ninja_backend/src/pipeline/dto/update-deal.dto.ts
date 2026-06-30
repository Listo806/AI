import { IsIn, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsIn(["new", "qualified", "proposal", "negotiation", "won", "lost"])
  stage?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}