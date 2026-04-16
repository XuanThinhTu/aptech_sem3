import { IsEmail, IsMongoId, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateAdminAccountDto {
  @IsMongoId()
  actorUserId!: string;

  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @Matches(/^\d{10}$/)
  mobileNumber!: string;
}
