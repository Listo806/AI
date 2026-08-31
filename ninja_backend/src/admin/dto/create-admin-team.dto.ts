import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const INTERNAL_USER_ROLES = [
  'super_admin',
  'admin',
  'developer',
  'support',
] as const;

export const INTERNAL_USER_STATUSES = ['active', 'inactive'] as const;

export type InternalUserRole = (typeof INTERNAL_USER_ROLES)[number];
export type InternalUserStatus = (typeof INTERNAL_USER_STATUSES)[number];

export class CreateAdminUserDto {
  @ApiProperty({ example: 'Maria Lopez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'maria.lopez@cortexa.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: INTERNAL_USER_ROLES, example: 'admin' })
  @IsString()
  @IsIn(INTERNAL_USER_ROLES)
  role: InternalUserRole;

  @ApiPropertyOptional({ enum: INTERNAL_USER_STATUSES, default: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(INTERNAL_USER_STATUSES)
  status?: InternalUserStatus = 'active';

  @ApiPropertyOptional({
    type: [String],
    description: 'Explicit internal permissions. Defaults are derived from the role.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
