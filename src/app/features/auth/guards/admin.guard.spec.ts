import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, UrlSegment } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminGuard } from './admin.guard';
import { environment } from '../../../../environments/environment';

describe('AdminGuard', () => {
  const base = `${environment.apiBaseUrl}/api/auth`;

  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideHttpClient(), provideHttpClientTesting(), provideRouter([])
  ] }));

  function run(): jasmine.Spy {
    const result = jasmine.createSpy('result');
    (TestBed.runInInjectionContext(() => AdminGuard({} as Route, [] as UrlSegment[])) as Observable<boolean>).subscribe(result);
    return result;
  }

  function me(role: string): object {
    return { success: true, data: { id: 1, username: 'u', email: 'u@example.com', nombre: 'U', role, status: 'ACTIVO' } };
  }

  it('only matches for an administrator', () => {
    const admin = run();
    TestBed.inject(HttpTestingController).expectOne(`${base}/me`).flush(me('ADMIN'));
    expect(admin).toHaveBeenCalledWith(true);
  });

  it('hides the panel from customers and guests', () => {
    const customer = run();
    TestBed.inject(HttpTestingController).expectOne(`${base}/me`).flush(me('CLIENTE'));
    expect(customer).toHaveBeenCalledWith(false);
  });
});
