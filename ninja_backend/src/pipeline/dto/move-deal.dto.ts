import { IsIn, IsInt, IsOptional, Min } from "class-validator";

export class MoveDealDto {
  @IsIn(["new", "qualified", "proposal", "negotiation", "won", "lost"])
  stage: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}