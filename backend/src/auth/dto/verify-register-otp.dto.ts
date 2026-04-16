import { IsEmail, Matches } from 'class-validator';

export class VerifyRegisterOtpDto {
  @IsEmail()
  email!: string;

  @Matches(/^\d{6}$/, { message: 'otpCode must be 6 digits' })
  otpCode!: string;
}
