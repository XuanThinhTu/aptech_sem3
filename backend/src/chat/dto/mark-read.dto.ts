import { IsMongoId } from 'class-validator';

export class MarkReadDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  friendUserId!: string;
}
