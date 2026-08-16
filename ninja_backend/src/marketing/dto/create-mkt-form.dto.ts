import { IsOptional, IsString, IsUUID, IsIn, IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class MktFormFieldDto {
  @IsString() key!: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() required?: boolean;
}

export class CreateMktFormDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(['form', 'landing_page']) type?: string;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => MktFormFieldDto)
  fields?: MktFormFieldDto[];

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() campaignId?: string;
  @IsOptional() @IsString() campaignName?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() audienceId?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() redirectUrl?: string;
  @IsOptional() @IsString() submitMessage?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
