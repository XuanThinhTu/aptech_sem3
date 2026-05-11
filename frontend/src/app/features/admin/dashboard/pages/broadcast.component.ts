import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminDashboardApiService,
  DashboardServiceItem,
  BroadcastPayload,
} from '../../dashboard/services/admin-dashboard-api.service';

type BroadcastToastType = 'success' | 'error' | 'warning' | 'info';

interface BroadcastToast {
  type: BroadcastToastType;
  title: string;
  message: string;
}

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broadcast.component.html',
  styleUrls: ['./broadcast.component.css'],
})
export class BroadcastComponent implements OnInit {
  private readonly dashboardApi = inject(AdminDashboardApiService);

  protected readonly services = signal<DashboardServiceItem[]>([]);
  protected readonly broadcastHistory = signal<any[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly toast = signal<BroadcastToast | null>(null);
  protected readonly pendingDeleteId = signal<string | null>(null);
  protected readonly isDeleting = signal(false);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  broadcastData: BroadcastPayload = {
    serviceType: '',
    title: '',
    content: '',
    scheduledTime: '08:00',
  };

  ngOnInit(): void {
    this.loadAvailableServices();
    this.loadHistory();
  }

  private loadAvailableServices() {
    this.isLoading.set(true);

    this.dashboardApi.getServices({ page: 1, pageSize: 50, search: '' }).subscribe({
      next: (response) => {
        const activeServices = response.items.filter((s) => s.isActive);
        this.services.set(activeServices);

        if (activeServices.length > 0 && !this.broadcastData.serviceType) {
          this.broadcastData.serviceType = activeServices[0].id;
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showToast(
          'error',
          'Could not load services',
          'Please refresh the page or try again later.',
        );
      },
    });
  }

  private loadHistory() {
    this.dashboardApi.getBroadcastHistory().subscribe({
      next: (res: any) => {
        this.broadcastHistory.set(res.data || res);
      },
      error: (err) => {
        console.error('Lỗi load history:', err);
        this.showToast(
          'error',
          'Could not load broadcast history',
          'The queue data is temporarily unavailable.',
        );
      },
    });
  }

  getServiceName(id: string): string {
    const service = this.services().find((s) => s.id === id);
    return service ? service.name : 'N/A';
  }

  onSendBroadcast() {
    if (
      !this.broadcastData.serviceType ||
      !this.broadcastData.title?.trim() ||
      !this.broadcastData.content?.trim() ||
      !this.broadcastData.scheduledTime
    ) {
      this.showToast(
        'warning',
        'Missing required fields',
        'Please select a service, add a title, write the message content, and choose a schedule time.',
      );
      return;
    }

    this.isLoading.set(true);

    const payload: any = {
      ...this.broadcastData,
      title: this.broadcastData.title.trim(),
      content: this.broadcastData.content.trim(),
      actorUserId: this.currentUser()?.id || '69e219439a52b345c0c82898',
    };

    this.dashboardApi.sendBroadcast(payload).subscribe({
      next: () => {
        this.showToast(
          'success',
          'Broadcast scheduled',
          'Your broadcast has been saved and added to the automation queue.',
        );

        this.resetForm();
        this.loadHistory();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi Backend:', err);

        this.showToast(
          'error',
          'Broadcast failed',
          err.error?.message || 'The server encountered an internal issue. Please try again.',
        );

        this.isLoading.set(false);
      },
    });
  }

  currentUser(): any {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  onDelete(id: string) {
    this.pendingDeleteId.set(id);
  }

  closeDeleteDialog() {
    if (this.isDeleting()) return;
    this.pendingDeleteId.set(null);
  }

  confirmDeleteBroadcast() {
    const id = this.pendingDeleteId();

    if (!id) {
      return;
    }

    this.isDeleting.set(true);

    this.dashboardApi.deleteBroadcast(id).subscribe({
      next: () => {
        this.showToast(
          'success',
          'Broadcast deleted',
          'The selected broadcast record has been removed from the queue.',
        );

        this.pendingDeleteId.set(null);
        this.isDeleting.set(false);
        this.loadHistory();
      },
      error: (err) => {
        console.error('Xóa thất bại:', err);

        this.showToast(
          'error',
          'Delete failed',
          err.error?.message || 'Could not delete this broadcast record. Please try again.',
        );

        this.isDeleting.set(false);
      },
    });
  }

  dismissToast() {
    this.toast.set(null);

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  private showToast(type: BroadcastToastType, title: string, message: string) {
    this.toast.set({ type, title, message });

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
      this.toastTimer = null;
    }, 4200);
  }

  private resetForm() {
    const currentServices = this.services();

    this.broadcastData = {
      serviceType: currentServices.length > 0 ? currentServices[0].id : '',
      title: '',
      content: '',
      scheduledTime: '08:00',
    };
  }
}
