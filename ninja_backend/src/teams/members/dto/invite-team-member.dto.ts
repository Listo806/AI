import {
  IsEmail,
  IsOptional,
  IsString,
} from "class-validator";

export class InviteTeamMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  role?: string;
}