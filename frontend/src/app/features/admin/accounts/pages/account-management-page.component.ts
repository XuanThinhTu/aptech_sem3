import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import {
  AdminDashboardApiService,
  CreateAdminAccountPayload,
  DashboardAccountItem,
  DashboardAccountsResponse,
} from '../../dashboard/services/admin-dashboard-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-account-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-management-page.component.html',
  styleUrls: [
    '../../dashboard/styles/dashboard-pages.css',
    './account-management-page.component.css',
  ],
})
export class AccountManagementPageComponent {
  private readonly dashboardApi = inject(AdminDashboardApiService);
  private readonly authState = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  protected readonly currentUser = this.authState.currentUser;
  protected readonly canCreateAdmin = computed(() => this.currentUser()?.role === 'superadmin');
  protected readonly accounts = signal<DashboardAccountItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly searchValue = signal('');
  protected readonly selectedRole = signal('all');
  protected readonly currentPage = signal(1);
  protected readonly showAddAdminDialog = signal(false);
  protected readonly isCreatingAdmin = signal(false);
  protected readonly addAdminForm = signal<CreateAdminAccountPayload>({
    actorUserId: '',
    username: '',
    email: '',
    mobileNumber: '',
  });
  protected readonly pageSize = 10;
  protected readonly pagination = signal<DashboardAccountsResponse['pagination']>({
    page: 1,
    pageSize: 10,
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
  protected readonly roleOptions = [
    { value: 'all', label: 'All roles' },
    { value: 'superadmin', label: 'Superadmin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
  ];

  constructor() {
    this.searchTerms
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadAccounts();
      });

    this.loadAccounts();
  }

  protected onSearchChange(value: string) {
    this.successMessage.set('');
    this.searchValue.set(value);
    this.searchTerms.next(value);
  }

  protected onRoleChange(value: string) {
    this.successMessage.set('');
    this.selectedRole.set(value);
    this.currentPage.set(1);
    this.loadAccounts();
  }

  protected goToPage(page: number) {
    if (page < 1 || page > this.pagination().totalPages || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
    this.loadAccounts();
  }

  protected trackByAccount(_: number, item: DashboardAccountItem) {
    return item.id;
  }

  protected formatRole(role: string) {
    if (role === 'superadmin') {
      return 'Superadmin';
    }
    if (role === 'admin') {
      return 'Admin';
    }
    return 'User';
  }

  protected openAddAdminDialog() {
    const currentUser = this.currentUser();
    if (!currentUser || currentUser.role !== 'superadmin') {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.addAdminForm.set({
      actorUserId: currentUser.id,
      username: '',
      email: '',
      mobileNumber: '',
    });
    this.showAddAdminDialog.set(true);
  }

  protected closeAddAdminDialog() {
    this.showAddAdminDialog.set(false);
    this.isCreatingAdmin.set(false);
  }

  protected updateAddAdminField(field: 'username' | 'email' | 'mobileNumber', value: string) {
    this.addAdminForm.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  protected submitAddAdmin() {
    const currentUser = this.currentUser();
    if (!currentUser || currentUser.role !== 'superadmin') {
      return;
    }

    const payload = {
      ...this.addAdminForm(),
      actorUserId: currentUser.id,
      username: this.addAdminForm().username.trim(),
      email: this.addAdminForm().email.trim(),
      mobileNumber: this.addAdminForm().mobileNumber.trim(),
    };

    if (!payload.username || !payload.email || !payload.mobileNumber) {
      this.errorMessage.set('Please enter username, email, and phone number.');
      return;
    }

    this.isCreatingAdmin.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardApi.createAdminAccount(payload).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.closeAddAdminDialog();
        this.currentPage.set(1);
        if (this.selectedRole() === 'superadmin') {
          this.selectedRole.set('all');
        }
        this.loadAccounts();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Unable to create admin account right now.');
        this.isCreatingAdmin.set(false);
      },
    });
  }

  private loadAccounts() {
    this.isLoading.set(true);
    if (!this.showAddAdminDialog()) {
      this.errorMessage.set('');
    }

    this.dashboardApi
      .getAccounts({
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchValue().trim(),
        role: this.selectedRole(),
      })
      .subscribe({
        next: (response) => {
          this.accounts.set(response.items);
          this.pagination.set(response.pagination);
          this.currentPage.set(response.pagination.page);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load accounts right now.');
          this.isLoading.set(false);
        },
      });
  }
}
