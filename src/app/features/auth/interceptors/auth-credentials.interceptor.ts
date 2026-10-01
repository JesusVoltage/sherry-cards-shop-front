import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { AuthService } from '../services/auth.service';

/** Rutas de la API que dependen de las cookies de sesión. */
const CREDENTIALED_PATHS = ['/api/auth/', '/api/account/'];

export const authCredentialsInterceptor: HttpInterceptorFn = (request, next) => {
  const base = inject(API_BASE_URL);
  if (!CREDENTIALED_PATHS.some((path) => request.url.startsWith(`${base}${path}`))) return next(request);

  return next(request.clone({ withCredentials: true, transferCache: false }));
};

/**
 * El access token dura 15 minutos. Si una petición de cuenta recibe 401 se renueva la sesión
 * una sola vez y se repite la petición; si la renovación también falla, se envía al login.
 */
export const sessionRefreshInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(`${inject(API_BASE_URL)}/api/account/`)) return next(request);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);
      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          if (refreshError instanceof HttpErrorResponse && refreshError.status === 401) {
            void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
          return throwError(() => error);
        }),
        switchMap(() => next(request))
      );
    })
  );
};
