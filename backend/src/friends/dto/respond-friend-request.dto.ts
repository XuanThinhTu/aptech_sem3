import { IsIn, IsMongoId } from 'class-validator';

export class RespondFriendRequestDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  requestId!: string;

  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';
}
