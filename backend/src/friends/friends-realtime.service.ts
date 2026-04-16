import { Injectable } from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

type FriendsRealtimeEvent =
  | 'friend-request-created'
  | 'friend-request-cancelled'
  | 'friend-request-responded'
  | 'friends-updated'
  | 'presence-updated'
  | 'dashboard-overview-updated'
  | 'services-updated'
  | 'chat-message'
  | 'unread-counts-updated'
  | 'conversation-read';

@Injectable()
export class FriendsRealtimeService {
  private static webSocketServer: WebSocketServer | null = null;
  private static readonly allConnections = new Set<WebSocket>();
  private static readonly userConnections = new Map<string, Set<WebSocket>>();

  attach(httpServer: HttpServer) {
    if (FriendsRealtimeService.webSocketServer) {
      return;
    }

    FriendsRealtimeService.webSocketServer = new WebSocketServer({
      server: httpServer,
      path: '/ws/friends',
    });

    FriendsRealtimeService.webSocketServer.on('connection', (socket, request) => {
      const url = new URL(request.url ?? '/ws/friends', 'http://127.0.0.1');
      const userId = url.searchParams.get('userId')?.trim();

      if (!userId) {
        socket.close();
        return;
      }

      let sockets = FriendsRealtimeService.userConnections.get(userId);
      if (!sockets) {
        sockets = new Set<WebSocket>();
        FriendsRealtimeService.userConnections.set(userId, sockets);
      }
      sockets.add(socket);
      FriendsRealtimeService.allConnections.add(socket);
      this.emitPresenceChanged();

      socket.on('close', () => {
        FriendsRealtimeService.allConnections.delete(socket);
        const currentSockets = FriendsRealtimeService.userConnections.get(userId);
        if (!currentSockets) {
          return;
        }

        currentSockets.delete(socket);
        if (!currentSockets.size) {
          FriendsRealtimeService.userConnections.delete(userId);
        }
        this.emitPresenceChanged();
      });
    });
  }

  static isUserOnline(userId: string) {
    const sockets = FriendsRealtimeService.userConnections.get(userId);
    if (!sockets?.size) {
      return false;
    }

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        return true;
      }
    }

    return false;
  }

  static getOnlineUserIds() {
    const onlineUserIds: string[] = [];

    for (const [userId, sockets] of FriendsRealtimeService.userConnections.entries()) {
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          onlineUserIds.push(userId);
          break;
        }
      }
    }

    return onlineUserIds;
  }

  static countOnlineUsers() {
    return FriendsRealtimeService.getOnlineUserIds().length;
  }

  emitToUsers(userIds: string[], event: FriendsRealtimeEvent, payload?: Record<string, unknown>) {
    if (!FriendsRealtimeService.allConnections.size) {
      return;
    }

    const message = JSON.stringify({
      event,
      payload: payload ?? {},
      timestamp: new Date().toISOString(),
    });

    for (const socket of FriendsRealtimeService.allConnections) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }

  private emitPresenceChanged() {
    this.emitToUsers([], 'presence-updated');
  }
}
