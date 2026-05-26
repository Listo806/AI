import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from "class-validator";

export class InviteTeamMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsIn([
    "owner",
    "admin",
    "manager",
    "agent",
    "viewer",
  ])
  role?: string;
}