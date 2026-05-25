import {
  IsArray,
  ArrayNotEmpty,
  IsString,
} from "class-validator";

export class UpdateMemberPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}