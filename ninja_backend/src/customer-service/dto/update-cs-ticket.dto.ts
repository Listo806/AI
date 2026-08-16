import {
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;
const notNull = (_o: any, v: any) => v !== null;

export class UpdateCsTicketDto {
  @IsOptional() @IsString() ticketNumber?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() contactId?: string | null;
  @IsOptional() @IsString() customerName?: string;

  @IsOptional() @IsString() channel?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() slaStatus?: string;

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsUUID() assignedTo?: string | null;
  @IsOptional() @IsString() assignedAgentName?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() dueAt?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() firstResponseAt?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() resolvedAt?: string | null;
  @IsOptional() @Transform(emptyToUndefined) @ValidateIf(notNull) @IsDateString() closedAt?: string | null;
}
