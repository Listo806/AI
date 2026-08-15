import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateSalesContractDto {
  @IsOptional() @IsString() contractNumber?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() proposalId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() orderId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;

  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactRole?: string;
  @IsOptional() @IsString() dealName?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  value?: number;

  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() startDate?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsDateString() endDate?: string;

  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
