import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { UserFormPageComponent } from './user-form-page.component';
import { environment } from '../../../../../environments/environment';

describe('UserFormPageComponent', () => {
  const base = `${environment.apiBaseUrl}/api/admin/users`;
  const options = {
    roles: [{ code: 'CLIENTE', name: 'Cliente' }, { code: 'ADMIN', name: 'Administrador' }],
    statuses: [{ code: 'ACTIVO', name: 'Activo' }, { code: 'BLOQUEADO', name: 'Bloqueado' }]
  };
  const jesus = { id: 1, username: 'jesus', email: 'jesus@example.com', nombre: 'Jesús', apellidos: null, role: 'ADMIN',
    status: 'ACTIVO', emailVerifiedAt: null, lastAccessAt: null, createdAt: '2026-10-01T10:00:00', hasPassword: true, googleLinked: false };

  function create(id: string | null) {
    TestBed.configureTestingModule({
      imports: [UserFormPageComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
        { provide: AuthService, useValue: { user: signal(jesus) } }
      ]
    });
    const fixture = TestBed.createComponent(UserFormPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${base}/options`).flush({ success: true, data: options });
    if (id) http.expectOne(`${base}/${id}`).flush({ success: true, data: { ...jesus, id: Number(id) } });
    fixture.detectChanges();
    return { fixture, http, element: fixture.nativeElement as HTMLElement };
  }

  function type(element: HTMLElement, selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  it('creates an account with the chosen role', () => {
    const { fixture, http, element } = create(null);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    type(element, '#u-nombre', 'Brock');
    type(element, '#u-username', 'brock');
    type(element, '#u-email', 'brock@example.com');
    type(element, '#u-password', 'una-frase-larga');
    type(element, '#u-role', 'ADMIN');
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();

    const request = http.expectOne(base);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Brock', apellidos: null, username: 'brock', email: 'brock@example.com',
      password: 'una-frase-larga', role: 'ADMIN', status: 'ACTIVO'
    });
  });

  it('requires a password only for new accounts', () => {
    const { fixture, http, element } = create(null);
    type(element, '#u-nombre', 'Brock');
    type(element, '#u-username', 'brock');
    type(element, '#u-email', 'brock@example.com');
    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    fixture.detectChanges();
    http.expectNone(base);
    expect(element.querySelector('#u-password')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('locks the role and status of your own account', () => {
    const { fixture, http, element } = create('1');
    expect(element.querySelector<HTMLSelectElement>('#u-role')!.disabled).toBeTrue();
    expect(element.querySelector<HTMLSelectElement>('#u-status')!.disabled).toBeTrue();
    expect(element.querySelector('.danger-zone')).toBeNull();

    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    fixture.detectChanges();
    const request = http.expectOne(`${base}/1`);
    expect(request.request.body).toEqual(jasmine.objectContaining({ password: null, role: 'ADMIN', status: 'ACTIVO' }));
  });
});
