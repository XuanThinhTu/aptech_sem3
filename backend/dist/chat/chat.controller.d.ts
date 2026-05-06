import { ChatService } from './chat.service';
import { GetConversationDto } from './dto/get-conversation.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getConversation(dto: GetConversationDto): Promise<{
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
    sendMessage(dto: SendMessageDto): Promise<{
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
    markConversationRead(dto: MarkReadDto): Promise<{
        message: string;
    }>;
    createGroup(body: {
        title: string;
        adminId: string;
        memberIds: string[];
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../database/schemas/conversation.schema").Conversation, {}, import("mongoose").DefaultSchemaOptions> & import("../database/schemas/conversation.schema").Conversation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../database/schemas/conversation.schema").Conversation, {}, import("mongoose").DefaultSchemaOptions> & import("../database/schemas/conversation.schema").Conversation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    getUserGroups(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("../database/schemas/conversation.schema").Conversation, {}, import("mongoose").DefaultSchemaOptions> & import("../database/schemas/conversation.schema").Conversation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
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
    sendGroupMessage(body: {
        senderUserId: string;
        conversationId: string;
        content: string;
    }): Promise<{
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
            recipientType: import("../database/enums/database.enums").MessageRecipientType;
        };
    }>;
}
