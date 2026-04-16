import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface FriendSearchResult {
  id: string;
  displayName: string;
  username: string;
  email: string;
  mobileNumber: string;
  avatarUrl: string;
  relationshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends';
}

export interface IncomingFriendRequest {
  requestId: string;
  senderUserId: string;
  displayName: string;
  username: string;
  email: string;
  mobileNumber: string;
  avatarUrl: string;
}

export interface IncomingFriendRequestsResponse {
  count: number;
  requests: IncomingFriendRequest[];
}

@Injectable({ providedIn: 'root' })
export class FriendsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:3000/api/friends';

  searchUsers(userId: string, query: string) {
    return this.http.get<FriendSearchResult[]>(`${this.apiUrl}/search`, {
      params: { userId, query },
    });
  }

  sendFriendRequest(userId: string, friendUserId: string) {
    return this.http.post<{
      message: string;
      relationshipStatus: FriendSearchResult['relationshipStatus'];
    }>(`${this.apiUrl}/request`, {
      userId,
      friendUserId,
    });
  }

  cancelFriendRequest(userId: string, friendUserId: string) {
    return this.http.post<{
      message: string;
      relationshipStatus: FriendSearchResult['relationshipStatus'];
      friendUserId: string;
    }>(`${this.apiUrl}/request/cancel`, {
      userId,
      friendUserId,
    });
  }

  removeFriend(userId: string, friendUserId: string) {
    return this.http.post<{
      message: string;
      relationshipStatus: FriendSearchResult['relationshipStatus'];
      friendUserId: string;
    }>(`${this.apiUrl}/remove`, {
      userId,
      friendUserId,
    });
  }

  getIncomingRequests(userId: string) {
    return this.http.get<IncomingFriendRequestsResponse>(`${this.apiUrl}/requests`, {
      params: { userId },
    });
  }

  respondToRequest(
    userId: string,
    requestId: string,
    action: 'accept' | 'reject',
  ) {
    return this.http.post<{
      message: string;
      relationshipStatus: FriendSearchResult['relationshipStatus'];
      senderUserId: string;
      requestId: string;
    }>(`${this.apiUrl}/requests/respond`, {
      userId,
      requestId,
      action,
    });
  }
}
