import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { join, normalize } from 'path';
import { Model, Types } from 'mongoose';
import {
  Gender,
  MaritalStatus,
  WorkStatus,
} from '../database/enums/database.enums';
import { Friendship, FriendshipDocument } from '../database/schemas/friendship.schema';
import { Profile, ProfileDocument } from '../database/schemas/profile.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');
  private readonly profileUploadsRoot = join(this.uploadsRoot, 'profile');
  private readonly defaultAvatarPath = '/uploads/no-image.jpg';
  private readonly backendBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<FriendshipDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    this.backendBaseUrl =
      this.configService.get<string>('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';

    if (!existsSync(this.profileUploadsRoot)) {
      mkdirSync(this.profileUploadsRoot, { recursive: true });
    }
  }

  async getProfile(userId: string) {
    const user = await this.findUser(userId);
    const profile = await this.profileModel.findOne({ userId: user._id }).lean();

    return {
      user: this.toSafeUser(user, profile ?? undefined),
      profile: profile
        ? this.serializeProfile(profile)
        : this.createEmptyProfile(user),
    };
  }

  async getFriendProfile(viewerUserId: string, friendUserId: string) {
    if (!Types.ObjectId.isValid(viewerUserId) || !Types.ObjectId.isValid(friendUserId)) {
      throw new BadRequestException('Invalid user id.');
    }

    const [viewerObjectId, friendObjectId] = [
      new Types.ObjectId(viewerUserId),
      new Types.ObjectId(friendUserId),
    ];

    const friendship = await this.friendshipModel.exists({
      userId: viewerObjectId,
      friendUserId: friendObjectId,
    });
    if (!friendship) {
      throw new ForbiddenException('You can only view connected friends.');
    }

    const friendUser = await this.findUser(friendUserId);
    const profile = await this.profileModel.findOne({ userId: friendUser._id }).lean();
    const serializedProfile = profile
      ? this.serializeProfile(profile)
      : this.createEmptyProfile(friendUser);

    return {
      friend: {
        id: friendUser.id,
        displayName: serializedProfile.name || friendUser.username,
        email: friendUser.email,
        mobileNumber: friendUser.mobileNumber,
        avatarUrl: serializedProfile.imageUrl,
      },
      profile: serializedProfile,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, avatarFile?: { path?: string }) {
    const user = await this.findUser(userId);
    const normalizedEmail = dto.emailAddress.trim().toLowerCase();

    const emailOwner = await this.userModel.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });
    if (emailOwner) {
      await this.deleteUploadedFile(avatarFile?.path);
      throw new BadRequestException('This email has already been registered.');
    }

    const existingProfile = await this.profileModel.findOne({ userId: user._id });
    let nextImageUrl = existingProfile?.imageUrl ?? this.defaultAvatarPath;

    if (avatarFile?.path) {
      nextImageUrl = this.toRelativeUploadPath(avatarFile.path);
      if (existingProfile?.imageUrl) {
        await this.deleteStoredImage(existingProfile.imageUrl);
      }
    }

    const profilePayload = {
      userId: user._id,
      name: dto.name.trim(),
      gender: dto.gender,
      dob: dto.dob,
      address: dto.address.trim(),
      maritalStatus: dto.maritalStatus,
      emailAddress: normalizedEmail,
      hobbies: dto.hobbies,
      likes: dto.likes,
      dislikes: dto.dislikes,
      cuisines: dto.cuisines,
      sports: dto.sports,
      imageUrl: nextImageUrl,
      qualification: dto.qualification,
      school: dto.school,
      college: dto.college,
      workStatus: dto.workStatus,
      organization: dto.organization,
      designation: dto.designation,
    };

    const profile = await this.profileModel.findOneAndUpdate(
      { userId: user._id },
      profilePayload,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    user.email = normalizedEmail;
    await user.save();

    return {
      message: 'Profile updated successfully.',
      user: this.toSafeUser(user, profile.toObject()),
      profile: this.serializeProfile(profile.toObject()),
    };
  }

  async updateAvatar(userId: string, avatarFile?: { path?: string }) {
    if (!avatarFile?.path) {
      throw new BadRequestException('Please choose an image file.');
    }

    const user = await this.findUser(userId);
    const existingProfile = await this.profileModel.findOne({ userId: user._id });
    const nextImageUrl = this.toRelativeUploadPath(avatarFile.path);

    if (existingProfile?.imageUrl) {
      await this.deleteStoredImage(existingProfile.imageUrl);
      existingProfile.imageUrl = nextImageUrl;
      if (!existingProfile.emailAddress) {
        existingProfile.emailAddress = user.email;
      }
      await existingProfile.save();

      return {
        message: 'Avatar updated successfully.',
        imageUrl: this.toPublicAssetUrl(existingProfile.imageUrl),
      };
    }

    const createdProfile = await this.profileModel.create({
      userId: user._id,
      emailAddress: user.email,
      imageUrl: nextImageUrl,
    });

    return {
      message: 'Avatar updated successfully.',
      imageUrl: this.toPublicAssetUrl(createdProfile.imageUrl),
    };
  }

  private async findUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id.');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  private createEmptyProfile(user: UserDocument) {
    return {
      name: '',
      gender: Gender.MALE,
      dob: '',
      address: '',
      maritalStatus: MaritalStatus.SINGLE,
      emailAddress: user.email,
      hobbies: [] as string[],
      likes: [] as string[],
      dislikes: [] as string[],
      cuisines: [] as string[],
      sports: [] as string[],
      imageUrl: this.toPublicAssetUrl(this.defaultAvatarPath),
      qualification: '',
      school: '',
      college: '',
      workStatus: WorkStatus.STUDENT,
      organization: '',
      designation: '',
    };
  }

  private serializeProfile(profile: Partial<Profile> & { dob?: Date | string; imageUrl?: string }) {
    return {
      name: profile.name ?? '',
      gender: profile.gender ?? Gender.MALE,
      dob: profile.dob instanceof Date ? profile.dob.toISOString().slice(0, 10) : '',
      address: profile.address ?? '',
      maritalStatus: profile.maritalStatus ?? MaritalStatus.SINGLE,
      emailAddress: profile.emailAddress ?? '',
      hobbies: profile.hobbies ?? [],
      likes: profile.likes ?? [],
      dislikes: profile.dislikes ?? [],
      cuisines: profile.cuisines ?? [],
      sports: profile.sports ?? [],
      imageUrl: this.toPublicAssetUrl(profile.imageUrl ?? this.defaultAvatarPath),
      qualification: profile.qualification ?? '',
      school: profile.school ?? '',
      college: profile.college ?? '',
      workStatus: profile.workStatus ?? WorkStatus.STUDENT,
      organization: profile.organization ?? '',
      designation: profile.designation ?? '',
    };
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

  private toRelativeUploadPath(absolutePath: string) {
    const normalizedPath = normalize(absolutePath);
    const normalizedUploadRoot = normalize(this.uploadsRoot);
    const relativePath = normalizedPath.replace(`${normalizedUploadRoot}`, '');
    return `/uploads${relativePath}`;
  }

  private async deleteStoredImage(imageUrl: string) {
    if (imageUrl === this.defaultAvatarPath || imageUrl.endsWith('/uploads/no-image.jpg')) {
      return;
    }

    if (!imageUrl.startsWith('/uploads/')) {
      return;
    }

    const absolutePath = join(process.cwd(), imageUrl.replace(/^\/+/, ''));
    const normalizedAbsolutePath = normalize(absolutePath);
    const normalizedUploadRoot = normalize(this.uploadsRoot);

    if (!normalizedAbsolutePath.startsWith(normalizedUploadRoot)) {
      return;
    }

    await this.deleteUploadedFile(normalizedAbsolutePath);
  }

  private async deleteUploadedFile(filePath?: string) {
    if (!filePath) {
      return;
    }

    try {
      await unlink(filePath);
    } catch {
      // Ignore missing file cleanup failures.
    }
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
}
