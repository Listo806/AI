import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateMktSuppressionDto {
  @IsString() address!: string;
  @IsOptional() @IsIn(['Email', 'SMS']) channel?: string;
  @IsOptional() @IsString() reason?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
