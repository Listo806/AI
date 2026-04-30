import { IsUUID, IsDateString, IsOptional, IsString, IsEmail } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  property_id: string;

  @IsDateString()
  booking_start: string;

  @IsDateString()
  booking_end: string;

  @IsOptional()
  @IsString()
  guest_name?: string;

  @IsOptional()
  @IsEmail()
  guest_email?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
