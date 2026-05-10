import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  AdminDashboardApiService, 
  DashboardServiceItem, 
  BroadcastPayload 
} from '../../dashboard/services/admin-dashboard-api.service';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broadcast.component.html',
})
export class BroadcastComponent implements OnInit {
  private readonly dashboardApi = inject(AdminDashboardApiService);

  protected readonly services = signal<DashboardServiceItem[]>([]);
  protected readonly broadcastHistory = signal<any[]>([]);
  protected readonly isLoading = signal(false);

  broadcastData: BroadcastPayload = {
    serviceType: '', 
    title: '',
    content: '',
    scheduledTime: '08:00'
  };

  ngOnInit(): void {
    this.loadAvailableServices();
    this.loadHistory();
  }

  private loadAvailableServices() {
    this.isLoading.set(true);
    this.dashboardApi.getServices({ page: 1, pageSize: 50, search: '' }).subscribe({
      next: (response) => {
        const activeServices = response.items.filter(s => s.isActive);
        this.services.set(activeServices);
        
        if (activeServices.length > 0 && !this.broadcastData.serviceType) {
          this.broadcastData.serviceType = activeServices[0].id;
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private loadHistory() {
    this.dashboardApi.getBroadcastHistory().subscribe({
      next: (res: any) => {
        this.broadcastHistory.set(res.data || res);
      },
      error: (err) => console.error('Lỗi load history:', err)
    });
  }

  getServiceName(id: string): string {
    const service = this.services().find(s => s.id === id);
    return service ? service.name : 'N/A';
  }

 onSendBroadcast() {
  if (!this.broadcastData.serviceType || !this.broadcastData.title || !this.broadcastData.content) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc.');
    return;
  }

  this.isLoading.set(true);

  // Ép kiểu 'any' để lách qua cái Interface BroadcastPayload
  // Giúp bạn gửi được actorUserId mà không bị TS báo đỏ hoặc Validator chặn ở FE
  const payload: any = {
    ...this.broadcastData,
    actorUserId: '69e219439a52b345c0c82898' // ID Admin của bạn
  };

  this.dashboardApi.sendBroadcast(payload).subscribe({
    next: (res) => {
      alert('Broadcast đã được gửi và lưu lịch sử thành công!');
      this.resetForm();
      this.loadHistory();
      this.isLoading.set(false);
    },
    error: (err) => {
      console.error('Lỗi Backend:', err);
      // Nếu Backend vẫn báo 500, hãy kiểm tra xem nó có nhận được actorUserId chưa
      alert('Lỗi: ' + (err.error?.message || 'Server vẫn gặp vấn đề nội bộ'));
      this.isLoading.set(false);
    }
  });
}
  /**
   * Lấy thông tin user an toàn, tránh lỗi TypeScript 'never'
   */
  currentUser(): any {
    try {
      const userData = localStorage.getItem('user'); // Hoặc 'currentUser' tùy key bro lưu
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (e) {
      return null;
    }
  }

  onDelete(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      this.dashboardApi.deleteBroadcast(id).subscribe({
        next: () => {
          this.loadHistory();
        },
        error: (err) => alert('Xóa thất bại!')
      });
    }
  }

  private resetForm() {
    const currentServices = this.services();
    this.broadcastData = {
      serviceType: currentServices.length > 0 ? currentServices[0].id : '',
      title: '',
      content: '',
      scheduledTime: '08:00'
    };
  }
}