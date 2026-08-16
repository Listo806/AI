import { IsOptional, IsString, IsUUID, IsIn, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

const TRIGGERS = ['manual', 'form_submission', 'lead_created', 'conversion', 'audience_added'];
const ACTIONS = ['add_tag', 'add_to_audience', 'create_task', 'send_message', 'notify'];

export class CreateMktAutomationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(TRIGGERS) triggerType?: string;
  @IsOptional() @IsObject() triggerConfig?: Record<string, any>;
  @IsOptional() @IsIn(ACTIONS) actionType?: string;
  @IsOptional() @IsObject() actionConfig?: Record<string, any>;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
