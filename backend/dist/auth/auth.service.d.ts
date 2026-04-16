import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { PendingRegistration } from './schemas/pending-registration.schema';
import { UserRole } from '../database/enums/database.enums';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
import { ProfileDocument } from '../database/schemas/profile.schema';
import { UserDocument } from '../database/schemas/user.schema';
export declare class AuthService implements OnModuleInit {
    private readonly configService;
    private readonly friendsRealtimeService;
    private readonly userModel;
    private readonly profileModel;
    private readonly pendingRegistrationModel;
    private readonly backendBaseUrl;
    private readonly defaultAvatarPath;
    constructor(configService: ConfigService, friendsRealtimeService: FriendsRealtimeService, userModel: Model<UserDocument>, profileModel: Model<ProfileDocument>, pendingRegistrationModel: Model<PendingRegistration>);
    onModuleInit(): Promise<void>;
    checkUsernameAvailability(rawUsername: string): Promise<{
        available: boolean;
        message: string;
    }>;
    checkMobileAvailability(rawMobileNumber: string): Promise<{
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
            role: UserRole;
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
            role: UserRole;
            displayName: string;
            avatarUrl: string;
        };
    }>;
    private ensureAdminAccount;
    private ensureSuperAdminAccount;
    private generateUniqueUsername;
    private generateOtp;
    private sendOtpEmail;
    private toSafeUser;
    private toPublicAssetUrl;
}
