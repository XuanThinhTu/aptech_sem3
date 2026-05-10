import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/pages/login-page.component';
import { RegisterPageComponent } from './features/auth/pages/register-page.component';
import { HomePageComponent } from './features/home/pages/home-page.component';
import { ProfilePageComponent } from './features/profile/pages/profile-page.component';
import { managementRoleGuard } from './core/guards/management-role.guard';
import { AdminDashboardLayoutComponent } from './features/admin/dashboard/layout/admin-dashboard-layout.component';
import { DashboardOverviewPageComponent } from './features/admin/dashboard/pages/dashboard-overview-page.component';
import { AccountManagementPageComponent } from './features/admin/accounts/pages/account-management-page.component';
import { ServicesManagementPageComponent } from './features/admin/services/pages/services-management-page.component';
import { OrdersManagementPageComponent } from './features/admin/orders/pages/orders-management-page.component';
import { AdminProfilePageComponent } from './features/admin/profile/pages/admin-profile-page.component';
import { BroadcastComponent } from './features/admin/dashboard/pages/broadcast.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'profile', component: ProfilePageComponent },
  {
    path: 'dashboard',
    component: AdminDashboardLayoutComponent,
    canActivate: [managementRoleGuard],
    children: [
      { path: '', component: DashboardOverviewPageComponent },
      { path: 'accounts', component: AccountManagementPageComponent },
      { path: 'services', component: ServicesManagementPageComponent },
      { path: 'orders', component: OrdersManagementPageComponent },
      { path: 'profile', component: AdminProfilePageComponent },
      { path: 'broadcast', component: BroadcastComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
