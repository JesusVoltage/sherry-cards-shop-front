import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SITE_CLOSED } from '../../../core/config/api.config';
import { authCredentialsInterceptor } from './auth-credentials.interceptor';
import { environment } from '../../../../environments/environment';

describe('authCredentialsInterceptor', () => {
  const base = `${environment.apiBaseUrl}`;

  function setUp(siteClosed: boolean): void {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authCredentialsInterceptor])), provideHttpClientTesting(),
      { provide: SITE_CLOSED, useValue: siteClosed }
    ] });
  }

  function expectCredentials(urls: string[], credentialed: string[]): void {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    for (const url of urls) {
      http.get(url).subscribe();
      const request = controller.expectOne(url);
      expect(request.request.withCredentials).withContext(url).toBe(credentialed.includes(url));
      if (credentialed.includes(url)) expect(request.request.transferCache).toBeFalse();
      request.flush({});
    }
    controller.verify();
  }

  it('adds cookies and disables transfer caching only for the configured session API', () => {
    setUp(false);
    const credentialed = [`${base}/api/auth/me`, `${base}/api/account/addresses`, `${base}/api/admin/products`];
    expectCredentials([...credentialed, `${base}/api/categories`, 'https://example.com/api/auth/me'], credentialed);
  });

  it('also sends cookies to the catalog while the shop is closed', () => {
    setUp(true);
    const credentialed = [`${base}/api/auth/me`, `${base}/api/categories/tree`, `${base}/api/novedades`];
    expectCredentials([...credentialed, 'https://example.com/api/categories'], credentialed);
  });
});
