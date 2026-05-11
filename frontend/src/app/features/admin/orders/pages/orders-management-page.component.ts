import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { FriendsRealtimeService } from '../../../friends/services/friends-realtime.service';
import {
  AdminDashboardApiService,
  DashboardOrderItem,
  DashboardOrderStatus,
  DashboardOrdersResponse,
} from '../../dashboard/services/admin-dashboard-api.service';

@Component({
  selector: 'app-orders-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-management-page.component.html',
  styleUrl: './orders-management-page.component.css',
})
export class OrdersManagementPageComponent {
  private readonly dashboardApi = inject(AdminDashboardApiService);
  private readonly authState = inject(AuthStateService);
  private readonly friendsRealtime = inject(FriendsRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  protected readonly currentUser = this.authState.currentUser;
  protected readonly tabs: Array<{ key: DashboardOrderStatus; label: string }> = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];
  protected readonly activeTab = signal<DashboardOrderStatus>('pending');
  protected readonly orders = signal<DashboardOrderItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isUpdatingStatus = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 8;
  protected readonly searchByTab = signal<Record<DashboardOrderStatus, string>>({
    pending: '',
    approved: '',
    completed: '',
    cancelled: '',
  });
  protected readonly orderPreview = signal<DashboardOrderItem | null>(null);
  protected readonly pagination = signal<DashboardOrdersResponse['pagination']>({
    page: 1,
    pageSize: 8,
    totalItems: 0,
    totalPages: 1,
  });
  protected readonly pageNumbers = computed(() => {
    const totalPages = this.pagination().totalPages;
    const currentPage = this.currentPage();
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const pages: number[] = [];

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  });
  protected readonly currentSearchValue = computed(
    () => this.searchByTab()[this.activeTab()] ?? '',
  );

  constructor() {
    this.searchTerms
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadOrders();
      });

    this.friendsRealtime.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        if (message.event === 'dashboard-overview-updated') {
          this.loadOrders();
        }
      });

    this.loadOrders();
  }

  protected switchTab(tab: DashboardOrderStatus) {
    if (tab === this.activeTab()) {
      return;
    }

    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.loadOrders();
  }

  protected onSearchChange(value: string) {
    this.successMessage.set('');
    this.searchByTab.update((current) => ({
      ...current,
      [this.activeTab()]: value,
    }));
    this.searchTerms.next(value);
  }

  protected goToPage(page: number) {
    if (page < 1 || page > this.pagination().totalPages || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
    this.loadOrders();
  }

  protected trackByOrder(_: number, item: DashboardOrderItem) {
    return item.id;
  }

  protected formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected openOrderPreview(order: DashboardOrderItem) {
    this.orderPreview.set(order);
  }

  protected closeOrderPreview() {
    this.orderPreview.set(null);
  }

  protected getPrimaryActionLabel(status: DashboardOrderStatus) {
    if (status === 'pending') {
      return 'Approve';
    }

    if (status === 'approved') {
      return 'Complete';
    }

    return '';
  }

  protected updateStatus(order: DashboardOrderItem) {
    const nextStatus: DashboardOrderStatus =
      order.orderStatus === 'pending' ? 'approved' : 'completed';
    this.submitStatusUpdate(order, nextStatus);
  }

  protected cancelOrder(order: DashboardOrderItem) {
    this.submitStatusUpdate(order, 'cancelled');
  }

  private submitStatusUpdate(order: DashboardOrderItem, nextStatus: DashboardOrderStatus) {
    const currentUser = this.currentUser();
    if (!currentUser || this.isUpdatingStatus()) {
      return;
    }

    this.isUpdatingStatus.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardApi.updateOrderStatus(order.id, currentUser.id, nextStatus).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.isUpdatingStatus.set(false);

        if (this.orderPreview()?.id === order.id) {
          this.orderPreview.update((current) =>
            current ? { ...current, orderStatus: nextStatus } : current,
          );
        }
        this.loadOrders();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Unable to update this order right now.');
        this.isUpdatingStatus.set(false);
      },
    });
  }
  private loadOrders() {
    this.isLoading.set(true);

    this.dashboardApi
      .getOrders({
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.currentSearchValue().trim(),
        status: this.activeTab(),
      })
      .subscribe({
        next: (response) => {
          this.orders.set(response.items);
          this.pagination.set(response.pagination);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load orders right now.');
          this.orders.set([]);
          this.pagination.set({
            page: 1,
            pageSize: this.pageSize,
            totalItems: 0,
            totalPages: 1,
          });
          this.isLoading.set(false);
        },
      });
  }
}
