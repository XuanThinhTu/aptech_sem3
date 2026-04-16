import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import {
  AdminDashboardApiService,
  DashboardServiceItem,
  DashboardServicesResponse,
  ServicePayload,
} from '../../dashboard/services/admin-dashboard-api.service';

@Component({
  selector: 'app-services-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services-management-page.component.html',
  styleUrl: '../../dashboard/styles/dashboard-pages.css',
})
export class ServicesManagementPageComponent {
  private readonly dashboardApi = inject(AdminDashboardApiService);
  private readonly authState = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  protected readonly currentUser = this.authState.currentUser;
  protected readonly services = signal<DashboardServiceItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly searchValue = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 8;
  protected readonly showServiceDialog = signal(false);
  protected readonly isEditingService = signal(false);
  protected readonly isSavingService = signal(false);
  protected readonly selectedImageFile = signal<File | null>(null);
  protected readonly imagePreviewUrl = signal('');
  protected readonly servicePendingDelete = signal<DashboardServiceItem | null>(null);
  protected readonly serviceForm = signal<{
    id: string;
    name: string;
    description: string;
    monthlyPrice: string;
    status: 'active' | 'inactive';
  }>({
    id: '',
    name: '',
    description: '',
    monthlyPrice: '',
    status: 'active',
  });
  protected readonly pagination = signal<DashboardServicesResponse['pagination']>({
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

  constructor() {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadServices();
      });

    this.loadServices();
  }

  protected onSearchChange(value: string) {
    this.successMessage.set('');
    this.searchValue.set(value);
    this.searchTerms.next(value);
  }

  protected goToPage(page: number) {
    if (page < 1 || page > this.pagination().totalPages || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
    this.loadServices();
  }

  protected trackByService(_: number, item: DashboardServiceItem) {
    return item.id;
  }

  protected formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected openCreateServiceDialog() {
    this.isEditingService.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.serviceForm.set({
      id: '',
      name: '',
      description: '',
      monthlyPrice: '',
      status: 'active',
    });
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set('');
    this.showServiceDialog.set(true);
  }

  protected openEditServiceDialog(service: DashboardServiceItem) {
    this.isEditingService.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.serviceForm.set({
      id: service.id,
      name: service.name,
      description: service.description,
      monthlyPrice: `${service.monthlyPrice}`,
      status: service.isActive ? 'active' : 'inactive',
    });
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(service.imageUrl);
    this.showServiceDialog.set(true);
  }

  protected closeServiceDialog() {
    if (this.isSavingService()) {
      return;
    }

    this.showServiceDialog.set(false);
  }

  protected updateServiceField(
    field: 'name' | 'description' | 'monthlyPrice' | 'status',
    value: string,
  ) {
    this.serviceForm.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  protected onServiceImageSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedImageFile.set(file);

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl.set(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  }

  protected submitService() {
    const currentUser = this.currentUser();
    if (!currentUser) {
      this.errorMessage.set('Please sign in again before managing services.');
      return;
    }

    const monthlyPrice = Number(this.serviceForm().monthlyPrice);
    const payload: ServicePayload = {
      actorUserId: currentUser.id,
      name: this.serviceForm().name.trim(),
      description: this.serviceForm().description.trim(),
      monthlyPrice,
      imageFile: this.selectedImageFile(),
      isActive: this.serviceForm().status === 'active',
    };

    if (!payload.name || !payload.description) {
      this.errorMessage.set('Please fill in all service fields.');
      return;
    }

    if (Number.isNaN(monthlyPrice) || monthlyPrice < 0) {
      this.errorMessage.set('Monthly price must be a valid positive number.');
      return;
    }

    this.isSavingService.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request$ = this.isEditingService()
      ? this.dashboardApi.updateService(this.serviceForm().id, payload)
      : this.dashboardApi.createService(payload);

    request$.subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.isSavingService.set(false);
        this.showServiceDialog.set(false);
        this.selectedImageFile.set(null);
        this.imagePreviewUrl.set('');
        this.currentPage.set(1);
        this.loadServices();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'Unable to save this service right now.',
        );
        this.isSavingService.set(false);
      },
    });
  }

  protected openDeleteServiceDialog(service: DashboardServiceItem) {
    this.servicePendingDelete.set(service);
    this.errorMessage.set('');
  }

  protected closeDeleteServiceDialog() {
    this.servicePendingDelete.set(null);
  }

  protected confirmDeleteService() {
    const currentUser = this.currentUser();
    const service = this.servicePendingDelete();
    if (!currentUser || !service) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardApi.deleteService(service.id, currentUser.id).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.servicePendingDelete.set(null);
        this.loadServices();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'Unable to delete this service right now.',
        );
      },
    });
  }

  private loadServices() {
    this.isLoading.set(true);
    if (!this.showServiceDialog()) {
      this.errorMessage.set('');
    }

    this.dashboardApi
      .getServices({
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchValue().trim(),
      })
      .subscribe({
        next: (response) => {
          this.services.set(response.items);
          this.pagination.set(response.pagination);
          this.currentPage.set(response.pagination.page);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Unable to load services right now.',
          );
          this.isLoading.set(false);
        },
      });
  }
}
