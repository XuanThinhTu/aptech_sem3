import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

export const managementRoleGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (!authState.isManagementUser()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
