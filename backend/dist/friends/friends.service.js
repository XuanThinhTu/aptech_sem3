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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../database/enums/database.enums");
const friend_request_schema_1 = require("../database/schemas/friend-request.schema");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
const profile_schema_1 = require("../database/schemas/profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const friends_realtime_service_1 = require("./friends-realtime.service");
let FriendsService = class FriendsService {
    configService;
    friendsRealtimeService;
    userModel;
    profileModel;
    friendRequestModel;
    friendshipModel;
    backendBaseUrl;
    defaultAvatarPath = '/uploads/no-image.jpg';
    constructor(configService, friendsRealtimeService, userModel, profileModel, friendRequestModel, friendshipModel) {
        this.configService = configService;
        this.friendsRealtimeService = friendsRealtimeService;
        this.userModel = userModel;
        this.profileModel = profileModel;
        this.friendRequestModel = friendRequestModel;
        this.friendshipModel = friendshipModel;
        this.backendBaseUrl =
            this.configService.get('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
    }
    async searchUsers(userId, rawQuery) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        const query = rawQuery?.trim();
        if (!query) {
            return [];
        }
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedQuery, 'i');
        const currentUserId = new mongoose_2.Types.ObjectId(userId);
        const [userMatches, profileMatches] = await Promise.all([
            this.userModel
                .find({
                _id: { $ne: currentUserId },
                $or: [{ username: regex }, { mobileNumber: regex }, { email: regex }],
            })
                .select('username email mobileNumber')
                .limit(12)
                .lean(),
            this.profileModel
                .find({ name: regex, userId: { $ne: currentUserId } })
                .select('userId name imageUrl')
                .limit(12)
                .lean(),
        ]);
        const matchedUserIds = new Set();
        for (const user of userMatches) {
            matchedUserIds.add(String(user._id));
        }
        for (const profile of profileMatches) {
            matchedUserIds.add(String(profile.userId));
        }
        if (!matchedUserIds.size) {
            return [];
        }
        const userIds = Array.from(matchedUserIds).map((id) => new mongoose_2.Types.ObjectId(id));
        const [users, profiles, friendships, pendingRequests] = await Promise.all([
            this.userModel
                .find({ _id: { $in: userIds } })
                .select('username email mobileNumber')
                .lean(),
            this.profileModel
                .find({ userId: { $in: userIds } })
                .select('userId name imageUrl')
                .lean(),
            this.friendshipModel
                .find({ userId: currentUserId, friendUserId: { $in: userIds } })
                .select('friendUserId')
                .lean(),
            this.friendRequestModel
                .find({
                status: database_enums_1.FriendRequestStatus.PENDING,
                $or: [
                    {
                        senderUserId: currentUserId,
                        receiverUserId: { $in: userIds },
                    },
                    {
                        senderUserId: { $in: userIds },
                        receiverUserId: currentUserId,
                    },
                ],
            })
                .select('senderUserId receiverUserId status')
                .lean(),
        ]);
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const friendIds = new Set(friendships.map((friendship) => String(friendship.friendUserId)));
        const outgoingRequestIds = new Set(pendingRequests
            .filter((request) => String(request.senderUserId) === userId)
            .map((request) => String(request.receiverUserId)));
        const incomingRequestIds = new Set(pendingRequests
            .filter((request) => String(request.receiverUserId) === userId)
            .map((request) => String(request.senderUserId)));
        return users
            .map((user) => {
            const profile = profileMap.get(String(user._id));
            const targetUserId = String(user._id);
            const relationshipStatus = friendIds.has(targetUserId)
                ? 'friends'
                : outgoingRequestIds.has(targetUserId)
                    ? 'pending_sent'
                    : incomingRequestIds.has(targetUserId)
                        ? 'pending_received'
                        : 'none';
            return {
                id: targetUserId,
                displayName: profile?.name ?? user.username,
                username: user.username,
                email: user.email,
                mobileNumber: user.mobileNumber,
                avatarUrl: this.toPublicAssetUrl(profile?.imageUrl ?? this.defaultAvatarPath),
                relationshipStatus,
            };
        })
            .sort((left, right) => left.displayName.localeCompare(right.displayName))
            .slice(0, 12);
    }
    async sendFriendRequest(userId, friendUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(friendUserId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        if (userId === friendUserId) {
            throw new common_1.BadRequestException('You cannot add yourself as a friend.');
        }
        const [user, friend] = await Promise.all([
            this.userModel.findById(userId),
            this.userModel.findById(friendUserId),
        ]);
        if (!user || !friend) {
            throw new common_1.NotFoundException('User account was not found.');
        }
        const [existingFriendship, outgoingRequest, incomingRequest] = await Promise.all([
            this.friendshipModel.exists({
                userId: new mongoose_2.Types.ObjectId(userId),
                friendUserId: new mongoose_2.Types.ObjectId(friendUserId),
            }),
            this.friendRequestModel.findOne({
                senderUserId: new mongoose_2.Types.ObjectId(userId),
                receiverUserId: new mongoose_2.Types.ObjectId(friendUserId),
                status: database_enums_1.FriendRequestStatus.PENDING,
            }),
            this.friendRequestModel.findOne({
                senderUserId: new mongoose_2.Types.ObjectId(friendUserId),
                receiverUserId: new mongoose_2.Types.ObjectId(userId),
                status: database_enums_1.FriendRequestStatus.PENDING,
            }),
        ]);
        if (existingFriendship) {
            return {
                message: 'You are already friends.',
                relationshipStatus: 'friends',
            };
        }
        if (outgoingRequest) {
            return {
                message: 'Friend request is waiting for confirmation.',
                relationshipStatus: 'pending_sent',
            };
        }
        if (incomingRequest) {
            return {
                message: 'This account already sent you a friend request.',
                relationshipStatus: 'pending_received',
            };
        }
        await this.friendRequestModel.create({
            senderUserId: user._id,
            receiverUserId: friend._id,
            receiverEmail: friend.email,
            status: database_enums_1.FriendRequestStatus.PENDING,
        });
        this.friendsRealtimeService.emitToUsers([String(user._id), String(friend._id)], 'friend-request-created', {
            senderUserId: String(user._id),
            receiverUserId: String(friend._id),
        });
        return {
            message: 'Friend request sent successfully.',
            relationshipStatus: 'pending_sent',
        };
    }
    async cancelFriendRequest(userId, friendUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(friendUserId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        const request = await this.friendRequestModel.findOne({
            senderUserId: new mongoose_2.Types.ObjectId(userId),
            receiverUserId: new mongoose_2.Types.ObjectId(friendUserId),
            status: database_enums_1.FriendRequestStatus.PENDING,
        });
        if (!request) {
            throw new common_1.NotFoundException('Pending friend request was not found.');
        }
        request.status = database_enums_1.FriendRequestStatus.REJECTED;
        request.respondedAt = new Date();
        await request.save();
        this.friendsRealtimeService.emitToUsers([userId, friendUserId], 'friend-request-cancelled', {
            senderUserId: userId,
            receiverUserId: friendUserId,
        });
        return {
            message: 'Friend request cancelled successfully.',
            relationshipStatus: 'none',
            friendUserId,
        };
    }
    async removeFriend(userId, friendUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(friendUserId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        const [removedForward, removedReverse] = await Promise.all([
            this.friendshipModel.deleteOne({
                userId: new mongoose_2.Types.ObjectId(userId),
                friendUserId: new mongoose_2.Types.ObjectId(friendUserId),
            }),
            this.friendshipModel.deleteOne({
                userId: new mongoose_2.Types.ObjectId(friendUserId),
                friendUserId: new mongoose_2.Types.ObjectId(userId),
            }),
        ]);
        if (!removedForward.deletedCount && !removedReverse.deletedCount) {
            throw new common_1.NotFoundException('Friendship was not found.');
        }
        this.friendsRealtimeService.emitToUsers([userId, friendUserId], 'friends-updated', {
            userId,
            friendUserId,
            relationshipStatus: 'none',
        });
        return {
            message: 'Friend removed successfully.',
            relationshipStatus: 'none',
            friendUserId,
        };
    }
    async getIncomingRequests(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        const receiverUserId = new mongoose_2.Types.ObjectId(userId);
        const requests = await this.friendRequestModel
            .find({
            receiverUserId,
            status: database_enums_1.FriendRequestStatus.PENDING,
        })
            .sort({ createdAt: -1 })
            .lean();
        if (!requests.length) {
            return {
                count: 0,
                requests: [],
            };
        }
        const senderIds = requests.map((request) => request.senderUserId);
        const [users, profiles] = await Promise.all([
            this.userModel
                .find({ _id: { $in: senderIds } })
                .select('username email mobileNumber')
                .lean(),
            this.profileModel
                .find({ userId: { $in: senderIds } })
                .select('userId name imageUrl')
                .lean(),
        ]);
        const userMap = new Map(users.map((user) => [String(user._id), user]));
        const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        return {
            count: requests.length,
            requests: requests
                .map((request) => {
                const sender = userMap.get(String(request.senderUserId));
                if (!sender) {
                    return null;
                }
                const profile = profileMap.get(String(request.senderUserId));
                return {
                    requestId: String(request._id),
                    senderUserId: String(request.senderUserId),
                    displayName: profile?.name ?? sender.username,
                    username: sender.username,
                    email: sender.email,
                    mobileNumber: sender.mobileNumber,
                    avatarUrl: this.toPublicAssetUrl(profile?.imageUrl ?? this.defaultAvatarPath),
                };
            })
                .filter(Boolean),
        };
    }
    async respondToRequest(userId, requestId, action) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(requestId)) {
            throw new common_1.BadRequestException('Invalid request id.');
        }
        const request = await this.friendRequestModel.findOne({
            _id: new mongoose_2.Types.ObjectId(requestId),
            receiverUserId: new mongoose_2.Types.ObjectId(userId),
            status: database_enums_1.FriendRequestStatus.PENDING,
        });
        if (!request) {
            throw new common_1.NotFoundException('Friend request was not found.');
        }
        request.status =
            action === 'accept'
                ? database_enums_1.FriendRequestStatus.ACCEPTED
                : database_enums_1.FriendRequestStatus.REJECTED;
        request.respondedAt = new Date();
        await request.save();
        if (action === 'accept') {
            const now = new Date();
            await this.friendshipModel.bulkWrite([
                {
                    updateOne: {
                        filter: {
                            userId: request.senderUserId,
                            friendUserId: request.receiverUserId,
                        },
                        update: { $setOnInsert: { becameFriendsAt: now } },
                        upsert: true,
                    },
                },
                {
                    updateOne: {
                        filter: {
                            userId: request.receiverUserId,
                            friendUserId: request.senderUserId,
                        },
                        update: { $setOnInsert: { becameFriendsAt: now } },
                        upsert: true,
                    },
                },
            ]);
        }
        this.friendsRealtimeService.emitToUsers([userId, String(request.senderUserId)], action === 'accept' ? 'friends-updated' : 'friend-request-responded', {
            senderUserId: String(request.senderUserId),
            receiverUserId: String(request.receiverUserId),
            action,
        });
        return {
            message: action === 'accept'
                ? 'Friend request accepted successfully.'
                : 'Friend request cancelled successfully.',
            relationshipStatus: action === 'accept' ? 'friends' : 'none',
            senderUserId: String(request.senderUserId),
            requestId: String(request._id),
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
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __param(4, (0, mongoose_1.InjectModel)(friend_request_schema_1.FriendRequest.name)),
    __param(5, (0, mongoose_1.InjectModel)(friendship_schema_1.Friendship.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        friends_realtime_service_1.FriendsRealtimeService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], FriendsService);
//# sourceMappingURL=friends.service.js.map