import { IsEmail, IsOptional, IsIn } from "class-validator";

export class InviteTeamMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(["agent", "manager", "admin"])
  role?: string;
}
