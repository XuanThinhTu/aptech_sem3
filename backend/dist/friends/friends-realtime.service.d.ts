import type { Server as HttpServer } from 'http';
type FriendsRealtimeEvent = 'friend-request-created' | 'friend-request-cancelled' | 'friend-request-responded' | 'friends-updated' | 'presence-updated' | 'dashboard-overview-updated' | 'services-updated' | 'chat-message' | 'unread-counts-updated' | 'conversation-read';
export declare class FriendsRealtimeService {
    private static webSocketServer;
    private static readonly allConnections;
    private static readonly userConnections;
    attach(httpServer: HttpServer): void;
    static isUserOnline(userId: string): boolean;
    static getOnlineUserIds(): string[];
    static countOnlineUsers(): number;
    emitToUsers(userIds: string[], event: FriendsRealtimeEvent, payload?: Record<string, unknown>): void;
    private emitPresenceChanged;
}
export {};
