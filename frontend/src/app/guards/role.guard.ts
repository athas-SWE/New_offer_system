import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';
import { homePathForRole } from '../utils/user-role';

export const roleGuard = (...roles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated) {
      return router.createUrlTree(['/login']);
    }
    if (auth.hasRole(...roles)) {
      return true;
    }
    // Send admin/shop users to their own dashboard instead of the public home
    return router.createUrlTree([auth.homePath() || homePathForRole(auth.currentUser?.role)]);
  };
};
