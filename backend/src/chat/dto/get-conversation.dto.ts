import { IsMongoId } from 'class-validator';

export class GetConversationDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  friendUserId!: string;
}
