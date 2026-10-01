import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL, SITE_CLOSED } from '../../../core/config/api.config';
import { AuthService } from '../services/auth.service';

/** Rutas de la API que dependen de las cookies de sesión. */
const CREDENTIALED_PATHS = ['/api/auth/', '/api/account/'];
/** Con la tienda cerrada el catálogo también es solo para administradores. */
const CLOSED_SITE_PATHS = ['/api/categories', '/api/novedades'];

function matches(url: string, base: string, paths: string[]): boolean {
  return paths.some((path) => url.startsWith(`${base}${path}`));
}

export const authCredentialsInterceptor: HttpInterceptorFn = (request, next) => {
  const base = inject(API_BASE_URL);
  const paths = inject(SITE_CLOSED) ? [...CREDENTIALED_PATHS, ...CLOSED_SITE_PATHS] : CREDENTIALED_PATHS;
  if (!matches(request.url, base, paths)) return next(request);

  return next(request.clone({ withCredentials: true, transferCache: false }));
};

/**
 * El access token dura 15 minutos. Si una petición de cuenta (o del catálogo, con la tienda
 * cerrada) recibe 401 se renueva la sesión una sola vez y se repite la petición; si la
 * renovación también falla, se envía al login.
 */
export const sessionRefreshInterceptor: HttpInterceptorFn = (request, next) => {
  const siteClosed = inject(SITE_CLOSED);
  const paths = siteClosed ? ['/api/account/', ...CLOSED_SITE_PATHS] : ['/api/account/'];
  if (!matches(request.url, inject(API_BASE_URL), paths)) return next(request);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);
      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          if (refreshError instanceof HttpErrorResponse && refreshError.status === 401) {
            void (siteClosed
              ? router.navigate(['/admin'])
              : router.navigate(['/login'], { queryParams: { returnUrl: router.url } }));
          }
          return throwError(() => error);
        }),
        switchMap(() => next(request))
      );
    })
  );
};
