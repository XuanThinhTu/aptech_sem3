import { IsMongoId } from 'class-validator';

export class CancelFriendRequestDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  friendUserId!: string;
}
