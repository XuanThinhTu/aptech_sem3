"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const nodemailer = __importStar(require("nodemailer"));
const pending_registration_schema_1 = require("./schemas/pending-registration.schema");
const database_enums_1 = require("../database/enums/database.enums");
const friends_realtime_service_1 = require("../friends/friends-realtime.service");
const profile_schema_1 = require("../database/schemas/profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
let AuthService = class AuthService {
    configService;
    friendsRealtimeService;
    userModel;
    profileModel;
    pendingRegistrationModel;
    backendBaseUrl;
    defaultAvatarPath = '/uploads/no-image.jpg';
    constructor(configService, friendsRealtimeService, userModel, profileModel, pendingRegistrationModel) {
        this.configService = configService;
        this.friendsRealtimeService = friendsRealtimeService;
        this.userModel = userModel;
        this.profileModel = profileModel;
        this.pendingRegistrationModel = pendingRegistrationModel;
        this.backendBaseUrl =
            this.configService.get('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
    }
    async onModuleInit() {
        await this.ensureAdminAccount();
        await this.ensureSuperAdminAccount();
    }
    async checkUsernameAvailability(rawUsername) {
        const username = rawUsername?.trim();
        if (!username) {
            throw new common_1.BadRequestException('Username is required.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new common_1.BadRequestException('Username can only contain letters, numbers, and underscores.');
        }
        const existingUser = await this.userModel.exists({ username });
        const existingPendingRegistration = await this.pendingRegistrationModel.exists({
            username,
        });
        return {
            available: !existingUser && !existingPendingRegistration,
            message: existingUser || existingPendingRegistration
                ? 'This username has already been registered.'
                : 'This username is available.',
        };
    }
    async checkMobileAvailability(rawMobileNumber) {
        const mobileNumber = rawMobileNumber?.trim();
        if (!mobileNumber) {
            throw new common_1.BadRequestException('Mobile number is required.');
        }
        if (!/^\d{10}$/.test(mobileNumber)) {
            throw new common_1.BadRequestException('Mobile number must be exactly 10 digits.');
        }
        const existingUser = await this.userModel.exists({ mobileNumber });
        const existingPendingRegistration = await this.pendingRegistrationModel.exists({
            mobileNumber,
        });
        return {
            available: !existingUser && !existingPendingRegistration,
            message: existingUser || existingPendingRegistration
                ? 'THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY'
                : 'This mobile number is available.',
        };
    }
    async requestRegisterOtp(dto) {
        const username = dto.username.trim();
        const email = dto.email.trim().toLowerCase();
        const mobileNumber = dto.mobileNumber.trim();
        const existingUser = await this.userModel.findOne({
            $or: [{ username }, { email }, { mobileNumber }],
        });
        if (existingUser) {
            if (existingUser.mobileNumber === mobileNumber) {
                throw new common_1.BadRequestException('THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY');
            }
            if (existingUser.username === username) {
                throw new common_1.BadRequestException('This username has already been registered.');
            }
            throw new common_1.BadRequestException('This email has already been registered.');
        }
        const existingPendingRegistration = await this.pendingRegistrationModel.findOne({
            $or: [{ username }, { email }, { mobileNumber }],
        });
        if (existingPendingRegistration) {
            if (existingPendingRegistration.mobileNumber === mobileNumber) {
                throw new common_1.BadRequestException('THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY');
            }
            if (existingPendingRegistration.username === username) {
                throw new common_1.BadRequestException('This username has already been registered.');
            }
            throw new common_1.BadRequestException('This email has already been registered.');
        }
        const otpCode = this.generateOtp();
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.pendingRegistrationModel.findOneAndUpdate({ email }, {
            username,
            email,
            mobileNumber,
            passwordHash,
            otpCode,
            expiresAt,
            attempts: 0,
        }, {
            upsert: true,
            returnDocument: 'after',
            setDefaultsOnInsert: true,
        });
        try {
            await this.sendOtpEmail(email, otpCode);
        }
        catch {
            await this.pendingRegistrationModel.deleteOne({ email });
            throw new common_1.InternalServerErrorException('Unable to send OTP email. Please verify the SMTP settings in backend/.env.');
        }
        return {
            message: 'OTP has been sent to your email address.',
            expiresInMinutes: 10,
        };
    }
    async verifyRegisterOtp(dto) {
        const email = dto.email.trim().toLowerCase();
        const pendingRegistration = await this.pendingRegistrationModel.findOne({
            email,
        });
        if (!pendingRegistration) {
            throw new common_1.BadRequestException('Registration session not found. Please request a new OTP.');
        }
        if (pendingRegistration.expiresAt.getTime() < Date.now()) {
            await this.pendingRegistrationModel.deleteOne({ _id: pendingRegistration._id });
            throw new common_1.BadRequestException('OTP has expired. Please request a new OTP.');
        }
        if (pendingRegistration.otpCode !== dto.otpCode) {
            await this.pendingRegistrationModel.updateOne({ _id: pendingRegistration._id }, { $inc: { attempts: 1 } });
            throw new common_1.BadRequestException('OTP is incorrect.');
        }
        const existingUser = await this.userModel.findOne({
            $or: [
                { username: pendingRegistration.username },
                { email },
                { mobileNumber: pendingRegistration.mobileNumber },
            ],
        });
        if (existingUser) {
            await this.pendingRegistrationModel.deleteOne({ _id: pendingRegistration._id });
            if (existingUser.mobileNumber === pendingRegistration.mobileNumber) {
                throw new common_1.BadRequestException('THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY');
            }
            if (existingUser.username === pendingRegistration.username) {
                throw new common_1.BadRequestException('This username has already been registered.');
            }
            throw new common_1.BadRequestException('This email has already been registered.');
        }
        const createdUser = await this.userModel.create({
            username: pendingRegistration.username,
            passwordHash: pendingRegistration.passwordHash,
            email,
            mobileNumber: pendingRegistration.mobileNumber,
            mobileVerified: true,
            emailVerified: true,
            isActive: true,
            role: database_enums_1.UserRole.USER,
        });
        await this.pendingRegistrationModel.deleteOne({ _id: pendingRegistration._id });
        this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');
        return {
            message: 'Registration successful.',
            user: this.toSafeUser(createdUser),
        };
    }
    async login(dto) {
        const identifier = dto.identifier.trim().toLowerCase();
        const user = await this.userModel.findOne({
            $or: [
                { email: identifier },
                { username: dto.identifier.trim() },
                { mobileNumber: dto.identifier.trim() },
            ],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatches) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const profile = await this.profileModel.findOne({ userId: user._id }).lean();
        return {
            message: 'Login successful.',
            user: this.toSafeUser(user, profile ?? undefined),
        };
    }
    async ensureAdminAccount() {
        const adminEmail = (this.configService.get('ADMIN_EMAIL') ?? 'admin@gmail.com')
            .trim()
            .toLowerCase();
        const adminMobile = (this.configService.get('ADMIN_PHONE') ?? '0900000000').trim();
        const adminPassword = this.configService.get('ADMIN_PASSWORD') ?? 'Admin@123456';
        const existingAdmin = await this.userModel.findOne({ email: adminEmail });
        if (existingAdmin) {
            existingAdmin.role = database_enums_1.UserRole.ADMIN;
            existingAdmin.mobileNumber = adminMobile;
            existingAdmin.emailVerified = true;
            existingAdmin.mobileVerified = true;
            existingAdmin.isActive = true;
            existingAdmin.passwordHash = await bcrypt.hash(adminPassword, 10);
            await existingAdmin.save();
            return;
        }
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const username = await this.generateUniqueUsername(adminEmail, 'admin');
        await this.userModel.create({
            username,
            passwordHash,
            email: adminEmail,
            mobileNumber: adminMobile,
            mobileVerified: true,
            emailVerified: true,
            isActive: true,
            role: database_enums_1.UserRole.ADMIN,
        });
    }
    async ensureSuperAdminAccount() {
        const superAdminEmail = (this.configService.get('SUPERADMIN_EMAIL') ?? 'superadmin@gmail.com')
            .trim()
            .toLowerCase();
        const superAdminMobile = (this.configService.get('SUPERADMIN_PHONE') ?? '0999999999').trim();
        const superAdminPassword = this.configService.get('SUPERADMIN_PASSWORD') ?? '1234567890';
        const existingSuperAdmin = await this.userModel.findOne({ email: superAdminEmail });
        if (existingSuperAdmin) {
            existingSuperAdmin.role = database_enums_1.UserRole.SUPERADMIN;
            existingSuperAdmin.mobileNumber = superAdminMobile;
            existingSuperAdmin.emailVerified = true;
            existingSuperAdmin.mobileVerified = true;
            existingSuperAdmin.isActive = true;
            existingSuperAdmin.passwordHash = await bcrypt.hash(superAdminPassword, 10);
            await existingSuperAdmin.save();
            return;
        }
        const passwordHash = await bcrypt.hash(superAdminPassword, 10);
        const username = await this.generateUniqueUsername(superAdminEmail, 'superadmin');
        await this.userModel.create({
            username,
            passwordHash,
            email: superAdminEmail,
            mobileNumber: superAdminMobile,
            mobileVerified: true,
            emailVerified: true,
            isActive: true,
            role: database_enums_1.UserRole.SUPERADMIN,
        });
    }
    async generateUniqueUsername(email, fallback = 'user') {
        const localPart = email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') || fallback;
        let candidate = localPart.slice(0, 24) || fallback;
        let suffix = 1;
        while (await this.userModel.exists({ username: candidate })) {
            candidate = `${localPart.slice(0, 20) || fallback}${suffix}`;
            suffix += 1;
        }
        return candidate;
    }
    generateOtp() {
        return `${Math.floor(100000 + Math.random() * 900000)}`;
    }
    async sendOtpEmail(email, otpCode) {
        const host = this.configService.get('MAIL_HOST');
        const port = Number(this.configService.get('MAIL_PORT') ?? 587);
        const user = this.configService.get('MAIL_USERNAME');
        const pass = this.configService.get('MAIL_PASSWORD');
        const fromAddress = this.configService.get('MAIL_FROM_ADDRESS') ?? user ?? '';
        const fromName = this.configService.get('MAIL_FROM_NAME') ??
            this.configService.get('APP_NAME') ??
            'Project SEM3';
        const encryption = this.configService.get('MAIL_ENCRYPTION')?.toLowerCase() ?? 'tls';
        if (!host || !user || !pass) {
            throw new common_1.InternalServerErrorException('Mail configuration is incomplete. Please check backend .env.');
        }
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: encryption === 'ssl',
            auth: {
                user,
                pass,
            },
        });
        await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to: email,
            subject: 'Your Project SEM3 OTP code',
            text: `Your OTP code is ${otpCode}. It will expire in 10 minutes.`,
            html: `<p>Your OTP code is <strong>${otpCode}</strong>.</p><p>This code will expire in 10 minutes.</p>`,
        });
    }
    toSafeUser(user, profile) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            displayName: profile?.name?.trim() || user.username,
            avatarUrl: this.toPublicAssetUrl(profile?.imageUrl ?? this.defaultAvatarPath),
        };
    }
    toPublicAssetUrl(path) {
        if (!path) {
            return '';
        }
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __param(4, (0, mongoose_1.InjectModel)(pending_registration_schema_1.PendingRegistration.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        friends_realtime_service_1.FriendsRealtimeService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map