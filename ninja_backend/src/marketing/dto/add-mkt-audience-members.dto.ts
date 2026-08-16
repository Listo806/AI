import { IsArray, IsOptional, IsString, IsUUID, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class MktAudienceMemberDto {
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() leadId?: string;
}

export class AddMktAudienceMembersDto {
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => MktAudienceMemberDto)
  members!: MktAudienceMemberDto[];
}
