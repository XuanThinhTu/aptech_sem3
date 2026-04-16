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
}
