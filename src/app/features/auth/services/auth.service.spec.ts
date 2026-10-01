import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

const url = 'https://sherry-cards-shop-api-production.up.railway.app/api/auth';
const user: User = {
  id: 7, username: 'coleccionista', email: 'cards@example.com', nombre: 'Ana',
  apellidos: null, role: 'USER', status: 'ACTIVE', emailVerifiedAt: null, lastAccessAt: null
};
const response = (data: unknown = null) => ({ success: true, message: 'OK', data, timestamp: '2026-09-30T10:00:00Z' });

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('only sends allowed registration fields, with cookies and no transfer cache', () => {
    const payload = {
      username: 'collector_1', email: 'cards@example.com', nombre: ' Ana ', apellidos: ' ',
      password: 'password123', confirmPassword: 'password123', role: 'ADMIN', status: 'ACTIVE',
      google_sub: 'forbidden', permissions: ['ADMIN']
    };
    auth.register(payload).subscribe();
    const request = http.expectOne(`${url}/register`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.transferCache).toBeFalse();
    expect(request.request.body).toEqual({
      username: 'collector_1', email: 'cards@example.com', nombre: 'Ana', password: 'password123'
    });
    request.flush(response());
    expect(auth.user()).toBeNull();
    http.expectNone(`${url}/me`);
  });

  it('confirms login with /me and retains only profile fields in memory', () => {
    const received = jasmine.createSpy('user');
    const payload = { email: 'cards@example.com', password: 'password123', role: 'ADMIN' };
    auth.login(payload).subscribe(received);
    const login = http.expectOne(`${url}/login`);
    expect(login.request.body).toEqual({ email: 'cards@example.com', password: 'password123' });
    expect(login.request.withCredentials).toBeTrue();
    login.flush(response({ accessToken: 'never-store-this' }));
    expect(received).not.toHaveBeenCalled();
    const me = http.expectOne(`${url}/me`);
    expect(me.request.withCredentials).toBeTrue();
    expect(me.request.transferCache).toBeFalse();
    me.flush(response({ ...user, refreshToken: 'never-store-this-either' }));
    expect(received).toHaveBeenCalledWith(user);
    expect(auth.user()).toEqual(user);
    expect(auth.isAuthenticated()).toBeTrue();
  });

  it('shares session recovery between the app and guard and reuses the recovered user', () => {
    const first = jasmine.createSpy('first');
    const second = jasmine.createSpy('second');
    auth.restoreSession().subscribe(first);
    auth.restoreSession().subscribe(second);
    expect(auth.status()).toBe('loading');
    http.expectOne(`${url}/me`).flush(response(user));
    expect(first).toHaveBeenCalledWith(user);
    expect(second).toHaveBeenCalledWith(user);
    auth.restoreSession().subscribe();
    http.expectNone(`${url}/me`);
  });

  it('renews an expired session once and shares concurrent refresh requests', () => {
    auth.restoreSession().subscribe();
    http.expectOne(`${url}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    auth.refresh().subscribe();
    const refresh = http.expectOne(`${url}/refresh`);
    expect(refresh.request.withCredentials).toBeTrue();
    expect(refresh.request.body).toEqual({});
    refresh.flush(response());
    http.expectOne(`${url}/me`).flush(response(user));
    expect(auth.user()).toEqual(user);
    expect(auth.status()).toBe('authenticated');
  });

  it('stops recovery when the refresh cookie has expired', () => {
    const result = jasmine.createSpy('result');
    auth.restoreSession().subscribe(result);
    http.expectOne(`${url}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(`${url}/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(result).toHaveBeenCalledWith(null);
    expect(auth.status()).toBe('anonymous');
    expect(auth.sessionError()).toBeNull();
    http.expectNone(`${url}/refresh`);
    http.expectNone(`${url}/me`);
  });

  it('allows recovery to be retried after an unavailable backend without refreshing', () => {
    auth.restoreSession().subscribe();
    http.expectOne(`${url}/me`).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(auth.status()).toBe('error');
    expect(auth.sessionError()).toContain('No se pudo comprobar tu sesión');
    http.expectNone(`${url}/refresh`);
    auth.restoreSession().subscribe();
    http.expectOne(`${url}/me`).flush(response(user));
    expect(auth.sessionError()).toBeNull();
    expect(auth.user()).toEqual(user);
  });

  it('rejects unsuccessful and malformed session responses', () => {
    auth.restoreSession().subscribe();
    http.expectOne(`${url}/me`).flush(response({ id: 7 }));
    expect(auth.isAuthenticated()).toBeFalse();
    expect(auth.status()).toBe('error');
    const error = jasmine.createSpy('error');
    auth.login({ email: user.email, password: 'password123' }).subscribe({ error });
    http.expectOne(`${url}/login`).flush({ ...response(user), success: false });
    expect(error).toHaveBeenCalled();
    http.expectNone(`${url}/me`);
  });

  it('cancels old session recovery before login so it cannot overwrite the new session', () => {
    auth.restoreSession().subscribe();
    const staleRequest = http.expectOne(`${url}/me`);
    auth.login({ email: user.email, password: 'password123' }).subscribe();
    expect(staleRequest.cancelled).toBeTrue();
    http.expectOne(`${url}/login`).flush(response());
    http.expectOne(`${url}/me`).flush(response(user));
    expect(auth.user()).toEqual(user);
  });

  it('preserves the user on logout failure, shares retries and clears only after confirmation', () => {
    auth.restoreSession().subscribe();
    http.expectOne(`${url}/me`).flush(response(user));
    auth.logout().subscribe({ error: () => undefined });
    http.expectOne(`${url}/logout`).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(auth.user()).toEqual(user);
    auth.logout().subscribe();
    auth.logout().subscribe();
    const logout = http.expectOne(`${url}/logout`);
    expect(logout.request.withCredentials).toBeTrue();
    logout.flush(response());
    expect(auth.user()).toBeNull();
    expect(auth.status()).toBe('anonymous');
  });

  it('clears an already expired session on logout', () => {
    auth.restoreSession().subscribe();
    http.expectOne(`${url}/me`).flush(response(user));
    auth.logout().subscribe();
    http.expectOne(`${url}/logout`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBeFalse();
  });
});

describe('AuthService on the server', () => {
  it('does not request or prerender a browser session', () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: PLATFORM_ID, useValue: 'server' }
    ] });
    const auth = TestBed.inject(AuthService);
    const result = jasmine.createSpy('result');
    auth.restoreSession().subscribe(result);
    expect(result).toHaveBeenCalledWith(null);
    expect(auth.status()).toBe('idle');
    TestBed.inject(HttpTestingController).verify();
  });
});
