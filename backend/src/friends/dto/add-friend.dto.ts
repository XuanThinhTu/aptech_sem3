import { IsMongoId } from 'class-validator';

export class AddFriendDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  friendUserId!: string;
}
