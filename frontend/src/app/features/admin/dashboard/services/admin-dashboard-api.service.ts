import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DashboardOverviewResponse {
  accounts: {
    total: number;
    online: number;
    offline: number;
    onlineRate: number;
  };
  services: {
    active: number;
    inactive: number;
    total: number;
    activeRate: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionActiveRate: number;
  };
  orders: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    failed: number;
    totalRevenue: number;
    revenueLast7Days: Array<{
      dateKey: string;
      label: string;
      revenue: number;
      orderCount: number;
    }>;
  };
}

export interface DashboardAccountItem {
  id: string;
  avatarUrl: string;
  name: string;
  username: string;
  email: string;
  gender: string;
  mobileNumber: string;
  role: string;
  createdAt: string;
}

export interface DashboardAccountsResponse {
  items: DashboardAccountItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
    role: string;
  };
}

export interface DashboardServiceItem {
  id: string;
  key: string;
  name: string;
  description: string;
  imageUrl: string;
  monthlyPrice: number;
  isActive: boolean;
  createdAt: string;
}
export interface BroadcastHistoryItem {
  _id: string;
  serviceType: string;
  title: string;
  content: string;
  scheduledTime: string;
  isSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardServicesResponse {
  items: DashboardServiceItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
  };
}

export type DashboardOrderStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export interface DashboardOrderItem {
txnRef: string;
  id: string;
  orderCode: string;
  serviceName: string;
  accountName: string;
  mobileNumber: string;
  totalAmount: number;
  registeredAt: string;
  paidAt: string;
  orderStatus: DashboardOrderStatus;
  paymentStatus: string;
}

export interface DashboardOrdersResponse {
  items: DashboardOrderItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
    status: DashboardOrderStatus;
  };
}

export interface CreateAdminAccountPayload {
  actorUserId: string;
  username: string;
  email: string;
  mobileNumber: string;
}

export interface ServicePayload {
  actorUserId: string;
  name: string;
  description: string;
  monthlyPrice: number;
  imageFile: File | null;
  isActive: boolean;
}
  export interface BroadcastPayload {
    serviceType: string;
    title: string;
    content: string;
    scheduledTime: string;
  }

@Injectable({ providedIn: 'root' })
export class AdminDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:3000/api/dashboard';

  getOverview() {
    return this.http.get<DashboardOverviewResponse>(`${this.apiUrl}/overview`);
  }

  getAccounts(params: { page: number; pageSize: number; search: string; role: string }) {
    return this.http.get<DashboardAccountsResponse>(`${this.apiUrl}/accounts`, {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        role: params.role,
      },
    });
  }
  getBroadcastHistory() {
    return this.http.get<{ data: BroadcastHistoryItem[] }>(`${this.apiUrl}/services/broadcast-history`);
  }
  deleteBroadcast(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/services/broadcast/${id}`);
  }

  createAdminAccount(payload: CreateAdminAccountPayload) {
    return this.http.post<{
      message: string;
      account: DashboardAccountItem;
    }>(`${this.apiUrl}/accounts/admin`, payload);
  }

  getServices(params: { page: number; pageSize: number; search: string }) {
    return this.http.get<DashboardServicesResponse>(`${this.apiUrl}/services`, {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
      },
    });
  }

  createService(payload: ServicePayload) {
    const formData = this.toServiceFormData(payload);
    return this.http.post<{
      message: string;
      service: DashboardServiceItem;
    }>(`${this.apiUrl}/services`, formData);
  }

  updateService(serviceId: string, payload: ServicePayload) {
    const formData = this.toServiceFormData(payload);
    return this.http.put<{
      message: string;
      service: DashboardServiceItem;
    }>(`${this.apiUrl}/services/${serviceId}`, formData);
  }

  deleteService(serviceId: string, actorUserId: string) {
    return this.http.delete<{
      message: string;
    }>(`${this.apiUrl}/services/${serviceId}`, {
      params: { actorUserId },
    });
  }
 sendBroadcast(payload: BroadcastPayload) {
  return this.http.post(`${this.apiUrl}/services/broadcast`, payload);
}

  getOrders(params: {
    page: number;
    pageSize: number;
    search: string;
    status: DashboardOrderStatus;
  }) {
    return this.http.get<DashboardOrdersResponse>(`${this.apiUrl}/orders`, {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        status: params.status,
      },
    });
  }

  updateOrderStatus(orderId: string, actorUserId: string, status: DashboardOrderStatus) {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/orders/${orderId}/status`, {
      actorUserId,
      status,
    });
  }

  private toServiceFormData(payload: ServicePayload) {
    const formData = new FormData();
    formData.append('actorUserId', payload.actorUserId);
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('monthlyPrice', `${payload.monthlyPrice}`);
    formData.append('isActive', `${payload.isActive}`);

    if (payload.imageFile) {
      formData.append('image', payload.imageFile);
    }

    return formData;
  }
}
