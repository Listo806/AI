import { IsOptional, IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// A recorded campaign cost (actual spend). Kept separate from campaign budget.
export class CreateMktCostDto {
  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsNumber() @Min(0) @Max(999999999999.99)
  amount?: number;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() costDate?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() description?: string;
}
