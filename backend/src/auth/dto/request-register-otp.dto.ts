import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RequestRegisterOtpDto {
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username can only contain letters, numbers, and underscores',
  })
  username!: string;

  @IsEmail()
  email!: string;

  @Matches(/^\d{10}$/, { message: 'mobileNumber must be exactly 10 digits' })
  mobileNumber!: string;

  @IsString()
  @Length(8, 50)
  password!: string;
}
