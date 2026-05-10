import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check-username')
  checkUsername(@Query('username') username: string) {
    return this.authService.checkUsernameAvailability(username);
  }

  @Get('check-mobile')
  checkMobile(@Query('mobileNumber') mobileNumber: string) {
    return this.authService.checkMobileAvailability(mobileNumber);
  }

  @Post('register/request-otp')
  requestRegisterOtp(@Body() dto: RequestRegisterOtpDto) {
    return this.authService.requestRegisterOtp(dto);
  }

  @Post('register/verify-otp')
  verifyRegisterOtp(@Body() dto: VerifyRegisterOtpDto) {
    return this.authService.verifyRegisterOtp(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @Post('change-password')
  async changePassword(@Body() data: { userId: string; oldPassword: string; newPassword: string }) {
    return await this.authService.changePassword(data.userId, {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  }
}
