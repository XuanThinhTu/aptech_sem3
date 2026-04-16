import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier!: string;

  @IsString()
  @Length(8, 50)
  password!: string;
}
