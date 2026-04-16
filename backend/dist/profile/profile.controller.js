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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const path_1 = require("path");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const profile_service_1 = require("./profile.service");
const { diskStorage } = require('multer');
const uploadRoot = (0, path_1.join)(process.cwd(), 'uploads', 'profile');
if (!(0, fs_1.existsSync)(uploadRoot)) {
    (0, fs_1.mkdirSync)(uploadRoot, { recursive: true });
}
let ProfileController = class ProfileController {
    profileService;
    constructor(profileService) {
        this.profileService = profileService;
    }
    getFriendProfile(viewerUserId, friendUserId) {
        return this.profileService.getFriendProfile(viewerUserId, friendUserId);
    }
    getProfile(userId) {
        return this.profileService.getProfile(userId);
    }
    updateAvatar(userId, avatarFile) {
        return this.profileService.updateAvatar(userId, avatarFile);
    }
    updateProfile(userId, dto, avatarFile) {
        return this.profileService.updateProfile(userId, dto, avatarFile);
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)('friend/view'),
    __param(0, (0, common_1.Query)('viewerUserId')),
    __param(1, (0, common_1.Query)('friendUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "getFriendProfile", null);
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)(':userId/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        storage: diskStorage({
            destination: uploadRoot,
            filename: (_req, file, callback) => {
                callback(null, `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        fileFilter: (_req, file, callback) => {
            if (!file.mimetype.startsWith('image/')) {
                callback(new common_1.BadRequestException('Only image files are allowed.'), false);
                return;
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateAvatar", null);
__decorate([
    (0, common_1.Put)(':userId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        storage: diskStorage({
            destination: uploadRoot,
            filename: (_req, file, callback) => {
                callback(null, `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        fileFilter: (_req, file, callback) => {
            if (!file.mimetype.startsWith('image/')) {
                callback(new common_1.BadRequestException('Only image files are allowed.'), false);
                return;
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "updateProfile", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.Controller)('profile'),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map