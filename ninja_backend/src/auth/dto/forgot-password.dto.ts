import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    enum: ['/reset-password', '/e-commerce/reset-password'],
    description: 'Approved frontend reset route. Defaults to /reset-password.',
  })
  @IsOptional()
  @IsIn(['/reset-password', '/e-commerce/reset-password'])
  resetPath?: '/reset-password' | '/e-commerce/reset-password';
}
