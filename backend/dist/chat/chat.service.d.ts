import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { FriendshipDocument } from '../database/schemas/friendship.schema';
import { MessageDocument } from '../database/schemas/message.schema';
import { ProfileDocument } from '../database/schemas/profile.schema';
import { UserDocument } from '../database/schemas/user.schema';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
export declare class ChatService {
    private readonly configService;
    private readonly friendsRealtimeService;
    private readonly messageModel;
    private readonly friendshipModel;
    private readonly userModel;
    private readonly profileModel;
    private readonly backendBaseUrl;
    private readonly defaultAvatarPath;
    constructor(configService: ConfigService, friendsRealtimeService: FriendsRealtimeService, messageModel: Model<MessageDocument>, friendshipModel: Model<FriendshipDocument>, userModel: Model<UserDocument>, profileModel: Model<ProfileDocument>);
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
    private validateIds;
    private ensureFriends;
    private buildRealtimeMessagePayload;
    private toConversationMessage;
    private toPublicAssetUrl;
}
