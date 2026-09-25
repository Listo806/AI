import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.OWNER, description: 'User role' })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({
    example: 'es',
    description: 'Preferred language for localized emails and UI (en, es, pt)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'es', 'pt'])
  language?: string;

  // Where the visitor originally came from, as recorded by the browser on their
  // first visit. Optional, and stored once: a later visit never replaces it.
  @ApiPropertyOptional({
    description:
      'First-touch acquisition: { source, medium, campaign, landingRoute, firstVisitAt }',
  })
  @IsOptional()
  @IsObject()
  firstTouch?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Last-touch acquisition: the visit that brought the customer back. Same shape as firstTouch, plus referrerHost and lastVisitAt. Never replaces the first touch.',
  })
  @IsOptional()
  @IsObject()
  lastTouch?: Record<string, any>;
}

