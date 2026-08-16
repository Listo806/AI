import {
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateCsTicketDto {
  @IsOptional() @IsString() ticketNumber?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;
  @IsOptional() @IsString() customerName?: string;

  @IsOptional() @IsString() channel?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() slaStatus?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() assignedTo?: string;
  @IsOptional() @IsString() assignedAgentName?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() dueAt?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsDateString() firstResponseAt?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
