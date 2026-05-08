import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface HomeServiceCard {
  id: string;
  key: string;
  title: string;
  description: string;
  imageUrl: string;
  monthlyPrice: number;
}

export interface HomeFriend {
  id: string;
  username: string;
  email: string;
  mobileNumber: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  unreadCount: number;
}
export interface HomeGroup {
  id: string;
  title: string;
  avatarUrl?: string;
  adminId: string;   
  memberIds: string[];
  lastMessage?: string;
  updatedAt: string;
}

export interface SubscriptionCheckoutPayload {
  userId: string;
  serviceIds: string[];
  provider: 'VNPAY' | 'PAYPAL'; 
}

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:3000/api/home';

  getServices() {
    return this.http.get<HomeServiceCard[]>(`${this.apiUrl}/services`);
  }

  getFriends(userId: string) {
    return this.http.get<HomeFriend[]>(`${this.apiUrl}/friends`, {
      params: { userId },
    });
  }

  /**
   * Lấy danh sách các nhóm mà người dùng tham gia
   * @param userId ID của người dùng hiện tại
   */
  getGroups(userId: string) {
    return this.http.get<HomeGroup[]>(`${this.apiUrl}/groups`, {
      params: { userId },
    });
  }

  createSubscriptionCheckout(payload: SubscriptionCheckoutPayload) {
    return this.http.post<{ paymentUrl: string; txnRef: string }>(
      `${this.apiUrl}/subscriptions/checkout`,
      payload,
    );
  }

  /**
   * (Tùy chọn) Tạo nhóm mới
   */
  createGroup(userId: string, groupData: { title: string, memberIds: string[] }) {
    return this.http.post<HomeGroup>(`${this.apiUrl}/groups`, {
      ownerId: userId,
      ...groupData
    });
  }
}
