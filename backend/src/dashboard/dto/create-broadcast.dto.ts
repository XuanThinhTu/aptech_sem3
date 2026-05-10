import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBroadcastDto {
  @IsString()
  @IsNotEmpty()
  serviceType!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  scheduledTime!: string;

  @IsString()
  @IsOptional() 
  actorUserId?: string; 
}