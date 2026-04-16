import { effect, inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthStateService } from '../../../core/services/auth-state.service';

export interface FriendsRealtimeMessage {
  event:
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
  payload: Record<string, unknown>;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class FriendsRealtimeService {
  private readonly authState = inject(AuthStateService);
  private readonly messagesSubject = new Subject<FriendsRealtimeMessage>();
  private socket: WebSocket | null = null;
  private activeUserId = '';
  private reconnectTimer: number | null = null;

  readonly messages$ = this.messagesSubject.asObservable();

  constructor() {
    effect(() => {
      const user = this.authState.currentUser();
      const userId = user?.id ?? '';

      if (!userId) {
        this.disconnect();
        return;
      }

      if (this.activeUserId === userId && this.socket?.readyState === WebSocket.OPEN) {
        return;
      }

      this.connect(userId);
    });
  }

  private connect(userId: string) {
    this.disconnect(false);

    this.activeUserId = userId;
    this.socket = new WebSocket(
      `ws://127.0.0.1:3000/ws/friends?userId=${encodeURIComponent(userId)}`,
    );

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as FriendsRealtimeMessage;
        this.messagesSubject.next(message);
      } catch {
        // Ignore malformed messages.
      }
    };

    this.socket.onclose = () => {
      if (!this.activeUserId) {
        return;
      }

      this.scheduleReconnect(userId);
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private scheduleReconnect(userId: string) {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.activeUserId === userId) {
        this.connect(userId);
      }
    }, 1500);
  }

  private disconnect(clearUser = true) {
    if (clearUser) {
      this.activeUserId = '';
    }

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }
}
