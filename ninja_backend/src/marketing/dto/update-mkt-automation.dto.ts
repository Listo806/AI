import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateMktAutomationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsObject() triggerConfig?: Record<string, any>;
  @IsOptional() @IsObject() actionConfig?: Record<string, any>;
  @IsOptional() @IsString() status?: string;
}
