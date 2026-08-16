import { IsOptional, IsString, IsUUID, IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class MktFormFieldUpdateDto {
  @IsString() key!: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() required?: boolean;
}

export class UpdateMktFormDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => MktFormFieldUpdateDto)
  fields?: MktFormFieldUpdateDto[];

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() campaignId?: string;
  @IsOptional() @IsString() campaignName?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() audienceId?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() redirectUrl?: string;
  @IsOptional() @IsString() submitMessage?: string;
}
