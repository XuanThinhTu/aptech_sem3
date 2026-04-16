"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FriendsRealtimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendsRealtimeService = void 0;
const common_1 = require("@nestjs/common");
const ws_1 = require("ws");
let FriendsRealtimeService = class FriendsRealtimeService {
    static { FriendsRealtimeService_1 = this; }
    static webSocketServer = null;
    static allConnections = new Set();
    static userConnections = new Map();
    attach(httpServer) {
        if (FriendsRealtimeService_1.webSocketServer) {
            return;
        }
        FriendsRealtimeService_1.webSocketServer = new ws_1.WebSocketServer({
            server: httpServer,
            path: '/ws/friends',
        });
        FriendsRealtimeService_1.webSocketServer.on('connection', (socket, request) => {
            const url = new URL(request.url ?? '/ws/friends', 'http://127.0.0.1');
            const userId = url.searchParams.get('userId')?.trim();
            if (!userId) {
                socket.close();
                return;
            }
            let sockets = FriendsRealtimeService_1.userConnections.get(userId);
            if (!sockets) {
                sockets = new Set();
                FriendsRealtimeService_1.userConnections.set(userId, sockets);
            }
            sockets.add(socket);
            FriendsRealtimeService_1.allConnections.add(socket);
            this.emitPresenceChanged();
            socket.on('close', () => {
                FriendsRealtimeService_1.allConnections.delete(socket);
                const currentSockets = FriendsRealtimeService_1.userConnections.get(userId);
                if (!currentSockets) {
                    return;
                }
                currentSockets.delete(socket);
                if (!currentSockets.size) {
                    FriendsRealtimeService_1.userConnections.delete(userId);
                }
                this.emitPresenceChanged();
            });
        });
    }
    static isUserOnline(userId) {
        const sockets = FriendsRealtimeService_1.userConnections.get(userId);
        if (!sockets?.size) {
            return false;
        }
        for (const socket of sockets) {
            if (socket.readyState === ws_1.WebSocket.OPEN) {
                return true;
            }
        }
        return false;
    }
    static getOnlineUserIds() {
        const onlineUserIds = [];
        for (const [userId, sockets] of FriendsRealtimeService_1.userConnections.entries()) {
            for (const socket of sockets) {
                if (socket.readyState === ws_1.WebSocket.OPEN) {
                    onlineUserIds.push(userId);
                    break;
                }
            }
        }
        return onlineUserIds;
    }
    static countOnlineUsers() {
        return FriendsRealtimeService_1.getOnlineUserIds().length;
    }
    emitToUsers(userIds, event, payload) {
        if (!FriendsRealtimeService_1.allConnections.size) {
            return;
        }
        const message = JSON.stringify({
            event,
            payload: payload ?? {},
            timestamp: new Date().toISOString(),
        });
        for (const socket of FriendsRealtimeService_1.allConnections) {
            if (socket.readyState === ws_1.WebSocket.OPEN) {
                socket.send(message);
            }
        }
    }
    emitPresenceChanged() {
        this.emitToUsers([], 'presence-updated');
    }
};
exports.FriendsRealtimeService = FriendsRealtimeService;
exports.FriendsRealtimeService = FriendsRealtimeService = FriendsRealtimeService_1 = __decorate([
    (0, common_1.Injectable)()
], FriendsRealtimeService);
//# sourceMappingURL=friends-realtime.service.js.map