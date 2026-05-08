import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'; // Dùng RxJS chuẩn

export interface ChatMessage {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  friendUserId: string;
  content: string;
  createdAt: string;
  isOwnMessage: boolean;
  isRead: boolean;
  readAt: string | null;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
  recipientDisplayName?: string;
  recipientAvatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:3000/api/chat';

  getConversation(userId: string, friendUserId: string) {
    return this.http.get<{ messages: ChatMessage[] }>(`${this.apiUrl}/conversation`, {
      params: { userId, friendUserId },
    });
  }

  sendMessage(userId: string, friendUserId: string, content: string) {
    return this.http.post<{ message: string; chatMessage: ChatMessage }>(
      `${this.apiUrl}/send`,
      { userId, friendUserId, content }
    );
  }

  markConversationRead(userId: string, friendUserId: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/read`, {
      userId,
      friendUserId,
    });
  }

  getUserGroups(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groups/${userId}`);
  }

  getGroupMessages(conversationId: string, userId: string) {
    return this.http.get<{ messages: ChatMessage[] }>(
      `${this.apiUrl}/group/messages`,
      { params: { conversationId, userId } }
    );
  }

  sendGroupMessage(senderUserId: string, conversationId: string, content: string) {
    return this.http.post<{ chatMessage: ChatMessage }>(
      `${this.apiUrl}/group/send`,
      { senderUserId, conversationId, content }
    );
  }

  createGroup(title: string, adminId: string, memberIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/group/create`, {
      title,
      adminId,
      memberIds
    });
  }

  /** 
   */
  kickGroupMember(conversationId: string, targetUserId: string, adminId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/group/kick`, {
      conversationId,
      targetUserId,
      adminId
    });
  }

  disbandGroup(conversationId: string, adminId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/group/disband`, {
      body: { adminId, conversationId }
    });
  }
}