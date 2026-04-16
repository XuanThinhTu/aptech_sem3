import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SiteLayoutComponent } from '../../../../layout/site-layout.component';

@Component({
  selector: 'app-admin-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, SiteLayoutComponent],
  templateUrl: './admin-dashboard-layout.component.html',
  styleUrl: './admin-dashboard-layout.component.css',
})
export class AdminDashboardLayoutComponent {
  protected readonly menuItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Account', route: '/dashboard/accounts' },
    { label: 'Services', route: '/dashboard/services' },
    { label: 'Order', route: '/dashboard/orders' },
  ];
}
