import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const allowedRoles = (route.data?.['roles'] as readonly UserRole[] | undefined) ?? [];

  if (!authService.isAuthenticated()) {
    globalThis.location.href = `/login?returnUrl=${encodeURIComponent(state.url)}`;
    return false;
  }

  if (allowedRoles.length > 0 && !authService.hasAnyRole(allowedRoles)) {
    globalThis.location.href = '/login?forbidden=1';
    return false;
  }

  return true;
};
