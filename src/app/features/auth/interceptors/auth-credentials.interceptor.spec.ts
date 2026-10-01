import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authCredentialsInterceptor } from './auth-credentials.interceptor';

describe('authCredentialsInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideHttpClient(withInterceptors([authCredentialsInterceptor])), provideHttpClientTesting()
  ] }));

  it('adds cookies and disables transfer caching only for the configured session API', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const base = 'https://sherry-cards-shop-api-production.up.railway.app';
    const credentialed = [`${base}/api/auth/me`, `${base}/api/account/addresses`];
    const urls = [...credentialed, `${base}/api/categories`, 'https://example.com/api/auth/me'];
    for (const url of urls) {
      http.get(url).subscribe();
      const request = controller.expectOne(url);
      expect(request.request.withCredentials).toBe(credentialed.includes(url));
      if (credentialed.includes(url)) expect(request.request.transferCache).toBeFalse();
      request.flush({});
    }
    controller.verify();
  });
});
