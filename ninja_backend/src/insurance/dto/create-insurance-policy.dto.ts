import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// A blank form field arrives as '' (present), which would fail @IsUUID/@IsDateString
// and, with the global forbidNonWhitelisted pipe, reject the whole request. Treat
// empty strings as absent so partial forms validate.
const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// Every field is optional so a policy can be created with partial data from the
// workspace form. team_id is resolved server-side from the caller; a client
// value is only honored if the caller actually has access to that team.
export class CreateInsurancePolicyDto {
  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsString()
  holderName?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsString()
  policyType?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  coverageStart?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  coverageEnd?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  premium?: number;

  @IsOptional()
  @IsString()
  billingFrequency?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  nextBilling?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  teamId?: string;
}
