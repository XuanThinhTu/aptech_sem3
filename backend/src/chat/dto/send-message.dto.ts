import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  friendUserId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  content!: string;
}
