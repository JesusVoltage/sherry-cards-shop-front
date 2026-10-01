import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, UrlSegment } from '@angular/router';
import { Observable } from 'rxjs';
import { SITE_CLOSED } from '../../../core/config/api.config';
import { SiteAccessGuard } from './site-access.guard';
import { environment } from '../../../../environments/environment';

describe('SiteAccessGuard', () => {
  const me = `${environment.apiBaseUrl}/api/auth/me`;

  function setUp(siteClosed: boolean): void {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: SITE_CLOSED, useValue: siteClosed }
    ] });
  }

  function run(): jasmine.Spy {
    const result = jasmine.createSpy('result');
    const guard = TestBed.runInInjectionContext(() => SiteAccessGuard({} as Route, [] as UrlSegment[]));
    if (typeof guard === 'boolean') result(guard);
    else (guard as Observable<boolean>).subscribe(result);
    return result;
  }

  function flushUser(role: string): void {
    TestBed.inject(HttpTestingController).expectOne(me).flush({
      success: true, data: { id: 1, username: 'jesus', email: 'jesus@example.com', nombre: 'Jesús', role, status: 'ACTIVO' }
    });
  }

  it('lets everyone in while the shop is open, without asking for the session', () => {
    setUp(false);
    expect(run()).toHaveBeenCalledWith(true);
    TestBed.inject(HttpTestingController).verify();
  });

  it('lets an administrator in while the shop is closed', () => {
    setUp(true);
    const result = run();
    flushUser('ADMIN');
    expect(result).toHaveBeenCalledWith(true);
  });

  it('keeps customers and guests out while the shop is closed', () => {
    setUp(true);
    const customer = run();
    flushUser('CLIENTE');
    expect(customer).toHaveBeenCalledWith(false);
  });
});
