import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor (Angular 17+ style).
 * - Injecte le Bearer token sur tous les appels /api/* sauf /api/auth/**
 * - Sur 401 (token expiré ou invalide) → purge la session + redirige vers /login
 * - Sur 403 sans token → considère comme non authentifié → redirige aussi vers /login
 *   (403 AVEC token = permissions insuffisantes, on ne redirige PAS)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const isAuthEndpoint = req.url.includes('/api/auth/');

  const authReq = token && !isAuthEndpoint
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      const status = err?.status;
      const shouldRedirect =
        !isAuthEndpoint &&
        (status === 401 || (status === 403 && !token));

      if (shouldRedirect) {
        authService.logout();
        const returnUrl = encodeURIComponent(router.url);
        router.navigateByUrl(`/login?returnUrl=${returnUrl}`);
      }
      return throwError(() => err);
    })
  );
};
