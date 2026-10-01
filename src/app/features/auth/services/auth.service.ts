import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  catchError, finalize, map, Observable, of, shareReplay, Subject, switchMap,
  takeUntil, tap, throwError, timeout
} from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { LoginRequest, RegisterRequest, User } from '../models/user.model';
import { authErrorMessage, AuthResponseError } from '../utils/auth-errors';

type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly url = `${inject(API_BASE_URL)}/api/auth`;
  private readonly userState = signal<User | null>(null);
  private readonly statusState = signal<SessionStatus>('idle');
  private readonly errorState = signal<string | null>(null);
  private readonly cancelRecovery = new Subject<void>();
  private sessionRequest?: Observable<User | null>;
  private refreshRequest?: Observable<User>;
  private logoutRequest?: Observable<void>;

  readonly user = this.userState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly sessionError = this.errorState.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  register(request: RegisterRequest): Observable<void> {
    // Only explicitly allowed fields leave the client, even if extra properties are supplied.
    const body: RegisterRequest = {
      username: request.username,
      email: request.email.trim(),
      nombre: request.nombre.trim(),
      password: request.password
    };
    if (request.apellidos?.trim()) body.apellidos = request.apellidos.trim();
    return this.post('register', body).pipe(map(() => undefined));
  }

  login(request: LoginRequest): Observable<User> {
    this.cancelRecovery.next();
    this.setUser(null);
    const body: LoginRequest = { email: request.email.trim(), password: request.password };
    return this.post('login', body).pipe(
      // /me is the canonical source of the current user, independent of the login response body.
      switchMap(() => this.getMe()),
      tap((user) => this.setUser(user))
    );
  }

  restoreSession(force = false): Observable<User | null> {
    // HttpOnly session cookies belong to the browser; never prerender a user's session.
    if (!this.browser) return of(null);
    if (this.sessionRequest) return this.sessionRequest;
    if (!force && ['authenticated', 'anonymous'].includes(this.status())) return of(this.user());

    this.statusState.set('loading');
    this.errorState.set(null);
    this.sessionRequest = this.getMe().pipe(
      catchError((error: unknown) => this.unauthorized(error) ? this.refresh() : throwError(() => error)),
      tap((user) => this.setUser(user)),
      catchError((error: unknown) => {
        this.setUser(null);
        if (!this.unauthorized(error)) {
          this.statusState.set('error');
          this.errorState.set(authErrorMessage(error, 'session'));
        }
        return of(null);
      }),
      takeUntil(this.cancelRecovery),
      finalize(() => { this.sessionRequest = undefined; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.sessionRequest;
  }

  refresh(): Observable<User> {
    if (this.refreshRequest) return this.refreshRequest;
    this.refreshRequest = this.post('refresh', {}).pipe(
      switchMap(() => this.getMe()),
      tap((user) => this.setUser(user)),
      catchError((error: unknown) => {
        if (this.unauthorized(error)) this.setUser(null);
        return throwError(() => error);
      }),
      takeUntil(this.cancelRecovery),
      finalize(() => { this.refreshRequest = undefined; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.refreshRequest;
  }

  logout(): Observable<void> {
    if (this.logoutRequest) return this.logoutRequest;
    this.cancelRecovery.next();
    this.logoutRequest = this.post('logout', {}).pipe(
      catchError((error: unknown) => this.unauthorized(error) ? of(null) : throwError(() => error)),
      tap(() => this.setUser(null)),
      map(() => undefined),
      finalize(() => { this.logoutRequest = undefined; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.logoutRequest;
  }

  private getMe(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.url}/me`, {
      withCredentials: true, transferCache: false
    }).pipe(
      timeout(15000),
      map((response) => {
        this.requireSuccess(response);
        const user = response.data;
        if (!user || typeof user.id !== 'number' || typeof user.username !== 'string' ||
          typeof user.email !== 'string' || typeof user.nombre !== 'string' ||
          typeof user.role !== 'string' || typeof user.status !== 'string') {
          throw new AuthResponseError('Respuesta de usuario no válida.');
        }
        // Keep only public profile fields in memory, never tokens from a response.
        return {
          id: user.id, username: user.username, email: user.email, nombre: user.nombre,
          apellidos: user.apellidos ?? null, role: user.role, status: user.status,
          emailVerifiedAt: user.emailVerifiedAt ?? null, lastAccessAt: user.lastAccessAt ?? null
        };
      })
    );
  }

  private post(path: string, body: object): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.url}/${path}`, body, {
      withCredentials: true, transferCache: false
    }).pipe(timeout(15000), tap((response) => this.requireSuccess(response)));
  }

  private requireSuccess(response: ApiResponse<unknown>): void {
    if (!response || response.success !== true) {
      throw new AuthResponseError(response?.message || 'Respuesta de autenticación no válida.');
    }
  }

  private unauthorized(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 401;
  }

  private setUser(user: User | null): void {
    this.userState.set(user);
    this.statusState.set(user ? 'authenticated' : 'anonymous');
    this.errorState.set(null);
  }
}
