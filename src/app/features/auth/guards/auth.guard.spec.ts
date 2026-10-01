import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideHttpClient(), provideHttpClientTesting(), provideRouter([])
  ] }));

  it('waits for recovery before redirecting a guest and preserves the intended destination', () => {
    const result = jasmine.createSpy('result');
    const guard = TestBed.runInInjectionContext(() => AuthGuard(
      {} as ActivatedRouteSnapshot, { url: '/cuenta' } as RouterStateSnapshot
    )) as Observable<unknown>;
    guard.subscribe(result);
    expect(result).not.toHaveBeenCalled();
    const http = TestBed.inject(HttpTestingController);
    const base = 'https://sherry-cards-shop-api-production.up.railway.app/api/auth';
    http.expectOne(`${base}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(`${base}/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });
    const expected = TestBed.inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: '/cuenta' } });
    expect(result).toHaveBeenCalledWith(expected);
    http.verify();
  });

  it('allows a user recovered through /me', () => {
    const result = jasmine.createSpy('result');
    const guard = TestBed.runInInjectionContext(() => AuthGuard(
      {} as ActivatedRouteSnapshot, { url: '/cuenta' } as RouterStateSnapshot
    )) as Observable<unknown>;
    guard.subscribe(result);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('https://sherry-cards-shop-api-production.up.railway.app/api/auth/me').flush({
      success: true, data: { id: 1, username: 'ana', email: 'ana@example.com', nombre: 'Ana', role: 'USER', status: 'ACTIVE' }
    });
    expect(result).toHaveBeenCalledWith(true);
    http.verify();
  });
});
