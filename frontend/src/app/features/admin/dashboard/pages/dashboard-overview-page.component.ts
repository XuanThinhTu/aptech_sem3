import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { debounceTime, filter, interval } from 'rxjs';
import {
  AdminDashboardApiService,
  DashboardOverviewResponse,
} from '../services/admin-dashboard-api.service';
import { FriendsRealtimeService } from '../../../friends/services/friends-realtime.service';

@Component({
  selector: 'app-dashboard-overview-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-overview-page.component.html',
  styleUrl: '../styles/dashboard-pages.css',
})
export class DashboardOverviewPageComponent {
  private readonly dashboardApi = inject(AdminDashboardApiService);
  private readonly friendsRealtime = inject(FriendsRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly overview = signal<DashboardOverviewResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly maxRevenue = computed(() => {
    const revenueItems = this.overview()?.orders.revenueLast7Days ?? [];
    return Math.max(0, ...revenueItems.map((item) => item.revenue));
  });

  constructor() {
    this.loadOverview(true);

    this.friendsRealtime.messages$
      .pipe(
        filter(
          (message) =>
            message.event === 'presence-updated' ||
            message.event === 'dashboard-overview-updated',
        ),
        debounceTime(200),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadOverview(false);
      });

    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadOverview(false);
      });
  }

  protected formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected revenueHeight(revenue: number) {
    const maxRevenue = this.maxRevenue();
    if (!maxRevenue) {
      return 14;
    }

    return Math.max(14, Math.round((revenue / maxRevenue) * 160));
  }

  private loadOverview(showLoader: boolean) {
    if (showLoader) {
      this.isLoading.set(true);
    }
    this.errorMessage.set('');

    this.dashboardApi.getOverview().subscribe({
      next: (response) => {
        this.overview.set(response);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'Unable to load dashboard overview right now.',
        );
        this.isLoading.set(false);
      },
    });
  }
}
