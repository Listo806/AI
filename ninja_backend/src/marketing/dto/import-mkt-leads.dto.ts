import { IsArray, IsOptional, IsString, IsUUID, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class ImportLeadRowDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() source?: string;
}

export class ImportMktLeadsDto {
  @IsArray() @ArrayMaxSize(10000) @ValidateNested({ each: true }) @Type(() => ImportLeadRowDto)
  rows!: ImportLeadRowDto[];

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() campaignId?: string;
  @IsOptional() @IsString() defaultSource?: string;
}
