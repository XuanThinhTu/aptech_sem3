import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { LoginDto } from './dto/login.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { PendingRegistration } from './schemas/pending-registration.schema';
import { UserRole } from '../database/enums/database.enums';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
import { Profile, ProfileDocument } from '../database/schemas/profile.schema';
import { User, UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly backendBaseUrl: string;
  private readonly defaultAvatarPath = '/uploads/no-image.jpg';

  constructor(
    private readonly configService: ConfigService,
    private readonly friendsRealtimeService: FriendsRealtimeService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(PendingRegistration.name)
    private readonly pendingRegistrationModel: Model<PendingRegistration>,
  ) {
    this.backendBaseUrl =
      this.configService.get<string>('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
  }

  async onModuleInit() {
    await this.ensureAdminAccount();
    await this.ensureSuperAdminAccount();
  }

  async checkUsernameAvailability(rawUsername: string) {
    const username = rawUsername?.trim();

    if (!username) {
      throw new BadRequestException('Username is required.');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new BadRequestException(
        'Username can only contain letters, numbers, and underscores.',
      );
    }

    const existingUser = await this.userModel.exists({ username });
    const existingPendingRegistration = await this.pendingRegistrationModel.exists({
      username,
    });

    return {
      available: !existingUser && !existingPendingRegistration,
      message:
        existingUser || existingPendingRegistration
          ? 'This username has already been registered.'
          : 'This username is available.',
    };
  }

  async checkMobileAvailability(rawMobileNumber: string) {
    const mobileNumber = rawMobileNumber?.trim();

    if (!mobileNumber) {
      throw new BadRequestException('Mobile number is required.');
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      throw new BadRequestException('Mobile number must be exactly 10 digits.');
    }

    const existingUser = await this.userModel.exists({ mobileNumber });
    const existingPendingRegistration = await this.pendingRegistrationModel.exists({
      mobileNumber,
    });

    return {
      available: !existingUser && !existingPendingRegistration,
      message:
        existingUser || existingPendingRegistration
          ? 'THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY'
          : 'This mobile number is available.',
    };
  }

  async requestRegisterOtp(dto: RequestRegisterOtpDto) {
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    const mobileNumber = dto.mobileNumber.trim();

    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }, { mobileNumber }],
    });

    if (existingUser) {
      if (existingUser.mobileNumber === mobileNumber) {
        throw new BadRequestException(
          'THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY',
        );
      }

      if (existingUser.username === username) {
        throw new BadRequestException('This username has already been registered.');
      }

      throw new BadRequestException('This email has already been registered.');
    }

    const existingPendingRegistration = await this.pendingRegistrationModel.findOne({
      $or: [{ username }, { email }, { mobileNumber }],
    });

    if (existingPendingRegistration) {
      if (existingPendingRegistration.mobileNumber === mobileNumber) {
        throw new BadRequestException(
          'THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY',
        );
      }

      if (existingPendingRegistration.username === username) {
        throw new BadRequestException('This username has already been registered.');
      }

      throw new BadRequestException('This email has already been registered.');
    }

    const otpCode = this.generateOtp();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.pendingRegistrationModel.findOneAndUpdate(
      { email },
      {
        username,
        email,
        mobileNumber,
        passwordHash,
        otpCode,
        expiresAt,
        attempts: 0,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    );

    try {
      await this.sendOtpEmail(email, otpCode);
    } catch {
      await this.pendingRegistrationModel.deleteOne({ email });
      throw new InternalServerErrorException(
        'Unable to send OTP email. Please verify the SMTP settings in backend/.env.',
      );
    }

    return {
      message: 'OTP has been sent to your email address.',
      expiresInMinutes: 10,
    };
  }

  async verifyRegisterOtp(dto: VerifyRegisterOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const pendingRegistration = await this.pendingRegistrationModel.findOne({
      email,
    });

    if (!pendingRegistration) {
      throw new BadRequestException(
        'Registration session not found. Please request a new OTP.',
      );
    }

    if (pendingRegistration.expiresAt.getTime() < Date.now()) {
      await this.pendingRegistrationModel.deleteOne({ _id: pendingRegistration._id });
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (pendingRegistration.otpCode !== dto.otpCode) {
      await this.pendingRegistrationModel.updateOne(
        { _id: pendingRegistration._id },
        { $inc: { attempts: 1 } },
      );
      throw new BadRequestException('OTP is incorrect.');
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
        throw new BadRequestException(
          'THIS MOBILE NUMBER HAD BEEN REGISTERED ALREADY',
        );
      }

      if (existingUser.username === pendingRegistration.username) {
        throw new BadRequestException('This username has already been registered.');
      }

      throw new BadRequestException('This email has already been registered.');
    }

    const createdUser = await this.userModel.create({
      username: pendingRegistration.username,
      passwordHash: pendingRegistration.passwordHash,
      email,
      mobileNumber: pendingRegistration.mobileNumber,
      mobileVerified: true,
      emailVerified: true,
      isActive: true,
      role: UserRole.USER,
    });

    await this.pendingRegistrationModel.deleteOne({ _id: pendingRegistration._id });

    this.friendsRealtimeService.emitToUsers([], 'dashboard-overview-updated');

    return {
      message: 'Registration successful.',
      user: this.toSafeUser(createdUser),
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.userModel.findOne({
      $or: [
        { email: identifier },
        { username: dto.identifier.trim() },
        { mobileNumber: dto.identifier.trim() },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const profile = await this.profileModel.findOne({ userId: user._id }).lean();

    return {
      message: 'Login successful.',
      user: this.toSafeUser(user, profile ?? undefined),
    };
  }

  private async ensureAdminAccount() {
    const adminEmail = (
      this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@gmail.com'
    )
      .trim()
      .toLowerCase();
    const adminMobile = (
      this.configService.get<string>('ADMIN_PHONE') ?? '0900000000'
    ).trim();
    const adminPassword =
      this.configService.get<string>('ADMIN_PASSWORD') ?? 'Admin@123456';

    const existingAdmin = await this.userModel.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.role = UserRole.ADMIN;
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
      role: UserRole.ADMIN,
    });
  }

  private async ensureSuperAdminAccount() {
    const superAdminEmail = (
      this.configService.get<string>('SUPERADMIN_EMAIL') ?? 'superadmin@gmail.com'
    )
      .trim()
      .toLowerCase();
    const superAdminMobile = (
      this.configService.get<string>('SUPERADMIN_PHONE') ?? '0999999999'
    ).trim();
    const superAdminPassword =
      this.configService.get<string>('SUPERADMIN_PASSWORD') ?? '1234567890';

    const existingSuperAdmin = await this.userModel.findOne({ email: superAdminEmail });
    if (existingSuperAdmin) {
      existingSuperAdmin.role = UserRole.SUPERADMIN;
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
      role: UserRole.SUPERADMIN,
    });
  }

  private async generateUniqueUsername(email: string, fallback = 'user') {
    const localPart = email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') || fallback;
    let candidate = localPart.slice(0, 24) || fallback;
    let suffix = 1;

    while (await this.userModel.exists({ username: candidate })) {
      candidate = `${localPart.slice(0, 20) || fallback}${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private generateOtp() {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private async sendOtpEmail(email: string, otpCode: string) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const user = this.configService.get<string>('MAIL_USERNAME');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    const fromAddress =
      this.configService.get<string>('MAIL_FROM_ADDRESS') ?? user ?? '';
    const fromName =
      this.configService.get<string>('MAIL_FROM_NAME') ??
      this.configService.get<string>('APP_NAME') ??
      'Project SEM3';
    const encryption =
      this.configService.get<string>('MAIL_ENCRYPTION')?.toLowerCase() ?? 'tls';

    if (!host || !user || !pass) {
      throw new InternalServerErrorException(
        'Mail configuration is incomplete. Please check backend .env.',
      );
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

  private toSafeUser(
    user: UserDocument,
    profile?: Partial<Profile> & { imageUrl?: string; name?: string },
  ) {
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
  async changePassword(userId: string, dto: { oldPassword: string; newPassword: string }) {
    const user = await this.userModel.findById(userId).select('+passwordHash');
    
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { passwordHash: newPasswordHash } },
    );

    return { message: 'Password changed successfully.' };
  }
  private toPublicAssetUrl(path?: string) {
    if (!path) {
      return '';
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }


}
