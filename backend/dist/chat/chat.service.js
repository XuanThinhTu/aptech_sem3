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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const database_enums_1 = require("../database/enums/database.enums");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
const message_schema_1 = require("../database/schemas/message.schema");
const profile_schema_1 = require("../database/schemas/profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const conversation_schema_1 = require("../database/schemas/conversation.schema");
const friends_realtime_service_1 = require("../friends/friends-realtime.service");
let ChatService = class ChatService {
    configService;
    friendsRealtimeService;
    messageModel;
    friendshipModel;
    userModel;
    profileModel;
    conversationModel;
    backendBaseUrl;
    defaultAvatarPath = '/uploads/no-image.jpg';
    constructor(configService, friendsRealtimeService, messageModel, friendshipModel, userModel, profileModel, conversationModel) {
        this.configService = configService;
        this.friendsRealtimeService = friendsRealtimeService;
        this.messageModel = messageModel;
        this.friendshipModel = friendshipModel;
        this.userModel = userModel;
        this.profileModel = profileModel;
        this.conversationModel = conversationModel;
        this.backendBaseUrl =
            this.configService.get('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
    }
    async getConversation(userId, friendUserId) {
        const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
        await this.ensureFriends(currentUserObjectId, friendUserObjectId);
        const messages = await this.messageModel
            .find({
            recipientType: database_enums_1.MessageRecipientType.FRIEND,
            $or: [
                {
                    senderUserId: currentUserObjectId,
                    recipientUserId: friendUserObjectId,
                },
                {
                    senderUserId: friendUserObjectId,
                    recipientUserId: currentUserObjectId,
                },
            ],
        })
            .sort({ createdAt: 1 })
            .limit(200)
            .lean();
        return {
            messages: messages.map((message) => this.toConversationMessage(message, userId)),
        };
    }
    async getUnreadCounts(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        const unreadItems = await this.messageModel.aggregate([
            {
                $match: {
                    recipientUserId: new mongoose_2.Types.ObjectId(userId),
                    recipientType: database_enums_1.MessageRecipientType.FRIEND,
                    isRead: false,
                },
            },
            {
                $group: {
                    _id: '$senderUserId',
                    unreadCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    friendUserId: '$_id',
                    unreadCount: 1,
                },
            },
        ]);
        return unreadItems.map((item) => ({
            friendUserId: String(item.friendUserId),
            unreadCount: item.unreadCount,
        }));
    }
    async sendMessage(userId, friendUserId, rawContent) {
        const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
        const content = rawContent.trim();
        if (!content) {
            throw new common_1.BadRequestException('Message content is required.');
        }
        await this.ensureFriends(currentUserObjectId, friendUserObjectId);
        const [sender, recipient, recipientProfile] = await Promise.all([
            this.userModel.findById(currentUserObjectId),
            this.userModel.findById(friendUserObjectId),
            this.profileModel.findOne({ userId: friendUserObjectId }).lean(),
        ]);
        if (!sender || !recipient) {
            throw new common_1.BadRequestException('Chat account was not found.');
        }
        const message = await this.messageModel.create({
            senderUserId: sender._id,
            recipientUserId: recipient._id,
            recipientPhoneNumber: recipient.mobileNumber,
            recipientName: recipientProfile?.name ?? recipient.username,
            content,
            recipientType: database_enums_1.MessageRecipientType.FRIEND,
            isFree: true,
            chargeAmount: 0,
            countedAgainstDailyFreeLimit: false,
            deliveryStatus: database_enums_1.MessageDeliveryStatus.SENT,
            isRead: false,
            sentAt: new Date(),
        });
        const payload = await this.buildRealtimeMessagePayload(message, userId, friendUserId);
        this.friendsRealtimeService.emitToUsers([userId, friendUserId], 'chat-message', payload);
        this.friendsRealtimeService.emitToUsers([friendUserId], 'unread-counts-updated', { friendUserId: userId });
        return {
            message: 'Message sent successfully.',
            chatMessage: payload,
        };
    }
    async markConversationRead(userId, friendUserId) {
        const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
        await this.ensureFriends(currentUserObjectId, friendUserObjectId);
        const readAt = new Date();
        await this.messageModel.updateMany({
            senderUserId: friendUserObjectId,
            recipientUserId: currentUserObjectId,
            recipientType: database_enums_1.MessageRecipientType.FRIEND,
            isRead: false,
        }, {
            $set: {
                isRead: true,
                readAt,
            },
        });
        this.friendsRealtimeService.emitToUsers([userId, friendUserId], 'conversation-read', {
            userId,
            friendUserId,
            readAt: readAt.toISOString(),
        });
        this.friendsRealtimeService.emitToUsers([userId], 'unread-counts-updated', { friendUserId });
        return {
            message: 'Conversation marked as read.',
        };
    }
    async createGroup(title, adminId, memberIds) {
        if (!mongoose_2.Types.ObjectId.isValid(adminId)) {
            throw new common_1.BadRequestException('Invalid admin id.');
        }
        const uniqueMemberIds = [...new Set([...memberIds, adminId])]
            .filter((id) => mongoose_2.Types.ObjectId.isValid(id))
            .map((id) => new mongoose_2.Types.ObjectId(id));
        return this.conversationModel.create({
            title: title.trim(),
            adminId: new mongoose_2.Types.ObjectId(adminId),
            memberIds: uniqueMemberIds,
            isGroup: true,
        });
    }
    async getUserGroups(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        return this.conversationModel.find({
            memberIds: new mongoose_2.Types.ObjectId(userId)
        }).lean();
    }
    async getGroupMessages(conversationId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
            throw new common_1.BadRequestException('Invalid conversation id.');
        }
        const messages = await this.messageModel
            .find({ conversationId: new mongoose_2.Types.ObjectId(conversationId) })
            .sort({ createdAt: 1 })
            .lean();
        return {
            messages: messages.map((m) => this.toConversationMessage(m, userId)),
        };
    }
    async sendGroupMessage(senderUserId, conversationId, content) {
        if (!mongoose_2.Types.ObjectId.isValid(senderUserId) || !mongoose_2.Types.ObjectId.isValid(conversationId)) {
            throw new common_1.BadRequestException('Invalid IDs.');
        }
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Group conversation not found.');
        }
        const isMember = conversation.memberIds.some(id => String(id) === senderUserId);
        if (!isMember) {
            throw new common_1.ForbiddenException('You are not a member of this group.');
        }
        const sender = await this.userModel.findById(senderUserId);
        const senderProfile = await this.profileModel.findOne({ userId: new mongoose_2.Types.ObjectId(senderUserId) }).lean();
        const message = await this.messageModel.create({
            senderUserId: new mongoose_2.Types.ObjectId(senderUserId),
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            recipientPhoneNumber: '0000000000',
            content: content.trim(),
            recipientType: database_enums_1.MessageRecipientType.GROUP,
            deliveryStatus: database_enums_1.MessageDeliveryStatus.SENT,
            sentAt: new Date(),
        });
        const basePayload = {
            id: String(message._id),
            conversationId,
            senderUserId,
            content: message.content,
            senderDisplayName: senderProfile?.name ?? sender?.username ?? 'User',
            senderAvatarUrl: this.toPublicAssetUrl(senderProfile?.imageUrl ?? this.defaultAvatarPath),
            createdAt: new Date().toISOString(),
            recipientType: database_enums_1.MessageRecipientType.GROUP
        };
        const otherMemberStrings = conversation.memberIds
            .map(id => String(id))
            .filter(id => id !== senderUserId);
        if (otherMemberStrings.length > 0) {
            this.friendsRealtimeService.emitToUsers(otherMemberStrings, 'group-message', { ...basePayload, isOwnMessage: false });
        }
        return {
            message: 'Group message sent successfully.',
            chatMessage: { ...basePayload, isOwnMessage: true }
        };
    }
    validateIds(userId, friendUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(friendUserId)) {
            throw new common_1.BadRequestException('Invalid user id.');
        }
        if (userId === friendUserId) {
            throw new common_1.BadRequestException('You cannot chat with yourself.');
        }
        return [new mongoose_2.Types.ObjectId(userId), new mongoose_2.Types.ObjectId(friendUserId)];
    }
    async ensureFriends(userId, friendUserId) {
        const friendship = await this.friendshipModel.exists({
            userId,
            friendUserId,
        });
        if (!friendship) {
            throw new common_1.ForbiddenException('You can only chat with connected friends.');
        }
    }
    async buildRealtimeMessagePayload(message, currentUserId, friendUserId) {
        const [sender, recipient, senderProfile, recipientProfile] = await Promise.all([
            this.userModel.findById(message.senderUserId).lean(),
            this.userModel.findById(message.recipientUserId).lean(),
            this.profileModel.findOne({ userId: message.senderUserId }).lean(),
            this.profileModel.findOne({ userId: message.recipientUserId }).lean(),
        ]);
        return {
            id: String(message._id),
            senderUserId: String(message.senderUserId),
            recipientUserId: String(message.recipientUserId),
            friendUserId: String(message.senderUserId) === currentUserId ? friendUserId : String(message.senderUserId),
            content: message.content,
            createdAt: (message.createdAt ??
                message.sentAt ??
                new Date()).toISOString(),
            isOwnMessage: String(message.senderUserId) === currentUserId,
            isRead: message.isRead,
            readAt: message.readAt?.toISOString() ?? null,
            senderDisplayName: senderProfile?.name ?? sender?.username ?? 'User',
            senderAvatarUrl: this.toPublicAssetUrl(senderProfile?.imageUrl ?? this.defaultAvatarPath),
            recipientDisplayName: recipientProfile?.name ?? recipient?.username ?? 'User',
            recipientAvatarUrl: this.toPublicAssetUrl(recipientProfile?.imageUrl ?? this.defaultAvatarPath),
        };
    }
    toConversationMessage(message, currentUserId) {
        const senderUserId = String(message.senderUserId);
        return {
            id: String(message._id),
            senderUserId,
            recipientUserId: String(message.recipientUserId),
            content: message.content ?? '',
            createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
            isOwnMessage: senderUserId === currentUserId,
            isRead: message.isRead ?? false,
            readAt: message.readAt?.toISOString() ?? null,
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
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(3, (0, mongoose_1.InjectModel)(friendship_schema_1.Friendship.name)),
    __param(4, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(5, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __param(6, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        friends_realtime_service_1.FriendsRealtimeService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ChatService);
//# sourceMappingURL=chat.service.js.map