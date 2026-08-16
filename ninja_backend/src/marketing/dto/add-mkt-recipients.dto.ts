import { IsArray, IsOptional, IsString, IsUUID, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class MktRecipientDto {
  @IsString() address!: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() leadId?: string;
}

export class AddMktRecipientsDto {
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => MktRecipientDto)
  recipients!: MktRecipientDto[];
}
