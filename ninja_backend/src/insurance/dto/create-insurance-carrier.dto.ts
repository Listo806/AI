import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateInsuranceCarrierDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  carrierMark?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  teamId?: string;
}
