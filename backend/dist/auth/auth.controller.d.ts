import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    checkUsername(username: string): Promise<{
        available: boolean;
        message: string;
    }>;
    checkMobile(mobileNumber: string): Promise<{
        available: boolean;
        message: string;
    }>;
    requestRegisterOtp(dto: RequestRegisterOtpDto): Promise<{
        message: string;
        expiresInMinutes: number;
    }>;
    verifyRegisterOtp(dto: VerifyRegisterOtpDto): Promise<{
        message: string;
        user: {
            id: string;
            username: string;
            email: string;
            mobileNumber: string;
            role: import("../database/enums/database.enums").UserRole;
            displayName: string;
            avatarUrl: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        user: {
            id: string;
            username: string;
            email: string;
            mobileNumber: string;
            role: import("../database/enums/database.enums").UserRole;
            displayName: string;
            avatarUrl: string;
        };
    }>;
}
