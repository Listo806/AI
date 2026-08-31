import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  INTERNAL_USER_ROLES,
  INTERNAL_USER_STATUSES,
  InternalUserRole,
  InternalUserStatus,
} from './create-admin-user.dto';

export class UpdateAdminUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: INTERNAL_USER_ROLES })
  @IsOptional()
  @IsString()
  @IsIn(INTERNAL_USER_ROLES)
  role?: InternalUserRole;

  @ApiPropertyOptional({ enum: INTERNAL_USER_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(INTERNAL_USER_STATUSES)
  status?: InternalUserStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
