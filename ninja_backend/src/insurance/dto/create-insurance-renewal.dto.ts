import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// policyId optional here so the service returns a friendly "a renewal must be
// linked to a policy" message. Current expiration/premium, contact and carrier
// are snapshotted server-side from the policy, not accepted from the client.
export class CreateInsuranceRenewalDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  policyId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  renewalDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  renewalPremium?: number;

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
