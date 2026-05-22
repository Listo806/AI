import { IsString, IsUUID } from 'class-validator';

export class CreateTeamNotificationDto {
  @IsUUID()
  teamId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;
}