import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { MessageRecipientType } from '../database/enums/database.enums';
import { FriendshipDocument } from '../database/schemas/friendship.schema';
import { MessageDocument } from '../database/schemas/message.schema';
import { ProfileDocument } from '../database/schemas/profile.schema';
import { UserDocument } from '../database/schemas/user.schema';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
export declare class ChatService {
    private readonly configService;
    private readonly friendsRealtimeService;
    private readonly messageModel;
    private readonly friendshipModel;
    private readonly userModel;
    private readonly profileModel;
    private readonly conversationModel;
    private readonly backendBaseUrl;
    private readonly defaultAvatarPath;
    constructor(configService: ConfigService, friendsRealtimeService: FriendsRealtimeService, messageModel: Model<MessageDocument>, friendshipModel: Model<FriendshipDocument>, userModel: Model<UserDocument>, profileModel: Model<ProfileDocument>, conversationModel: Model<ConversationDocument>);
    getConversation(userId: string, friendUserId: string): Promise<{
        messages: {
            id: string;
            senderUserId: string;
            recipientUserId: string;
            content: string;
            createdAt: string;
            isOwnMessage: boolean;
            isRead: boolean;
            readAt: string | null;
        }[];
    }>;
    getUnreadCounts(userId: string): Promise<{
        friendUserId: string;
        unreadCount: number;
    }[]>;
    sendMessage(userId: string, friendUserId: string, rawContent: string): Promise<{
        message: string;
        chatMessage: {
            id: string;
            senderUserId: string;
            recipientUserId: string;
            friendUserId: string;
            content: string;
            createdAt: string;
            isOwnMessage: boolean;
            isRead: boolean;
            readAt: string | null;
            senderDisplayName: string;
            senderAvatarUrl: string;
            recipientDisplayName: string;
            recipientAvatarUrl: string;
        };
    }>;
    markConversationRead(userId: string, friendUserId: string): Promise<{
        message: string;
    }>;
    createGroup(title: string, adminId: string, memberIds: string[]): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Conversation, {}, import("mongoose").DefaultSchemaOptions> & Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Conversation, {}, import("mongoose").DefaultSchemaOptions> & Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    getUserGroups(userId: string): Promise<(import("mongoose").Document<unknown, {}, Conversation, {}, import("mongoose").DefaultSchemaOptions> & Conversation & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    getGroupMessages(conversationId: string, userId: string): Promise<{
        messages: {
            id: string;
            senderUserId: string;
            recipientUserId: string;
            content: string;
            createdAt: string;
            isOwnMessage: boolean;
            isRead: boolean;
            readAt: string | null;
        }[];
    }>;
    sendGroupMessage(senderUserId: string, conversationId: string, content: string): Promise<{
        message: string;
        chatMessage: {
            isOwnMessage: boolean;
            id: string;
            conversationId: string;
            senderUserId: string;
            content: string;
            senderDisplayName: string;
            senderAvatarUrl: string;
            createdAt: string;
            recipientType: MessageRecipientType;
        };
    }>;
    private validateIds;
    private ensureFriends;
    private buildRealtimeMessagePayload;
    private toConversationMessage;
    private toPublicAssetUrl;
}
