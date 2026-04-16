"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../database/enums/database.enums");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
const profile_schema_1 = require("../database/schemas/profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
let ProfileService = class ProfileService {
    configService;
    friendshipModel;
    profileModel;
    userModel;
    uploadsRoot = (0, path_1.join)(process.cwd(), 'uploads');
    profileUploadsRoot = (0, path_1.join)(this.uploadsRoot, 'profile');
    defaultAvatarPath = '/uploads/no-image.jpg';
    backendBaseUrl;
    constructor(configService, friendshipModel, profileModel, userModel) {
        this.configService = configService;
        this.friendshipModel = friendshipModel;
        this.profileModel = profileModel;
        this.userModel = userModel;
        this.backendBaseUrl =
            this.configService.get('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
        if (!(0, fs_1.existsSync)(this.profileUploadsRoot)) {
            (0, fs_1.mkdirSync)(this.profileUploadsRoot, { recursive: true });
        }
    }
    async getProfile(userId) {
        const user = await this.findUser(userId);
        const profile = await this.profileModel.findOne({ userId: user._id }).lean();
        return {
            user: this.toSafeUser(user, profile ?? undefined),
            profile: profile
                ? this.serializeProfile(profile)
                : this.createEmptyProfile(user),
        };
    }
    async getFriendProfile(viewerUserId, friendUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(viewerUserId) || !mongoose_2.Types.ObjectId.isValid(friendUserId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        const [viewerObjectId, friendObjectId] = [
            new mongoose_2.Types.ObjectId(viewerUserId),
            new mongoose_2.Types.ObjectId(friendUserId),
        ];
        const friendship = await this.friendshipModel.exists({
            userId: viewerObjectId,
            friendUserId: friendObjectId,
        });
        if (!friendship) {
            throw new common_1.ForbiddenException('You can only view connected friends.');
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
    async updateProfile(userId, dto, avatarFile) {
        const user = await this.findUser(userId);
        const normalizedEmail = dto.emailAddress.trim().toLowerCase();
        const emailOwner = await this.userModel.findOne({
            email: normalizedEmail,
            _id: { $ne: user._id },
        });
        if (emailOwner) {
            await this.deleteUploadedFile(avatarFile?.path);
            throw new common_1.BadRequestException('This email has already been registered.');
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
        const profile = await this.profileModel.findOneAndUpdate({ userId: user._id }, profilePayload, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        user.email = normalizedEmail;
        await user.save();
        return {
            message: 'Profile updated successfully.',
            user: this.toSafeUser(user, profile.toObject()),
            profile: this.serializeProfile(profile.toObject()),
        };
    }
    async updateAvatar(userId, avatarFile) {
        if (!avatarFile?.path) {
            throw new common_1.BadRequestException('Please choose an image file.');
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
    async findUser(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user;
    }
    createEmptyProfile(user) {
        return {
            name: '',
            gender: database_enums_1.Gender.MALE,
            dob: '',
            address: '',
            maritalStatus: database_enums_1.MaritalStatus.SINGLE,
            emailAddress: user.email,
            hobbies: [],
            likes: [],
            dislikes: [],
            cuisines: [],
            sports: [],
            imageUrl: this.toPublicAssetUrl(this.defaultAvatarPath),
            qualification: '',
            school: '',
            college: '',
            workStatus: database_enums_1.WorkStatus.STUDENT,
            organization: '',
            designation: '',
        };
    }
    serializeProfile(profile) {
        return {
            name: profile.name ?? '',
            gender: profile.gender ?? database_enums_1.Gender.MALE,
            dob: profile.dob instanceof Date ? profile.dob.toISOString().slice(0, 10) : '',
            address: profile.address ?? '',
            maritalStatus: profile.maritalStatus ?? database_enums_1.MaritalStatus.SINGLE,
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
            workStatus: profile.workStatus ?? database_enums_1.WorkStatus.STUDENT,
            organization: profile.organization ?? '',
            designation: profile.designation ?? '',
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
    toRelativeUploadPath(absolutePath) {
        const normalizedPath = (0, path_1.normalize)(absolutePath);
        const normalizedUploadRoot = (0, path_1.normalize)(this.uploadsRoot);
        const relativePath = normalizedPath.replace(`${normalizedUploadRoot}`, '');
        return `/uploads${relativePath}`;
    }
    async deleteStoredImage(imageUrl) {
        if (imageUrl === this.defaultAvatarPath || imageUrl.endsWith('/uploads/no-image.jpg')) {
            return;
        }
        if (!imageUrl.startsWith('/uploads/')) {
            return;
        }
        const absolutePath = (0, path_1.join)(process.cwd(), imageUrl.replace(/^\/+/, ''));
        const normalizedAbsolutePath = (0, path_1.normalize)(absolutePath);
        const normalizedUploadRoot = (0, path_1.normalize)(this.uploadsRoot);
        if (!normalizedAbsolutePath.startsWith(normalizedUploadRoot)) {
            return;
        }
        await this.deleteUploadedFile(normalizedAbsolutePath);
    }
    async deleteUploadedFile(filePath) {
        if (!filePath) {
            return;
        }
        try {
            await (0, promises_1.unlink)(filePath);
        }
        catch {
        }
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
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(friendship_schema_1.Friendship.name)),
    __param(2, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ProfileService);
//# sourceMappingURL=profile.service.js.map