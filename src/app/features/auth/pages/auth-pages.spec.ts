import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { safeReturnUrl } from '../utils/auth-validators';
import { AccountPageComponent } from './account-page/account-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterPageComponent } from './register-page/register-page.component';

const base = 'https://sherry-cards-shop-api-production.up.railway.app/api/auth';
const user = { id: 1, username: 'ana_cards', email: 'ana@example.com', nombre: 'Ana', role: 'USER', status: 'ACTIVE' };
const ok = { success: true, message: 'OK', data: null, timestamp: '2026-09-30T10:00:00Z' };

describe('Authentication forms', () => {
  let http: HttpTestingController;
  let element: HTMLElement;
  let fixture: ComponentFixture<unknown>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, RegisterPageComponent, AccountPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });
  afterEach(() => http.verify());

  function render(component: typeof LoginPageComponent | typeof RegisterPageComponent | typeof AccountPageComponent): void {
    fixture = TestBed.createComponent<unknown>(component);
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  function fill(fields: Record<string, string>): void {
    for (const [name, value] of Object.entries(fields)) {
      const input = element.querySelector<HTMLInputElement>(`[formControlName="${name}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
  }

  function submit(): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  function fillRegistration(): void {
    fill({ username: 'ana_cards', email: user.email, nombre: user.nombre, apellidos: '', password: 'password123', confirmPassword: 'password123' });
  }

  it('rejects blank, short, long, spaced and invalid usernames without a request', () => {
    render(RegisterPageComponent);
    fillRegistration();
    for (const username of ['', 'ab', 'a'.repeat(31), 'ana cards', 'ana!']) {
      fill({ username });
      submit();
      expect(element.querySelector('#username-error')).not.toBeNull();
      http.expectNone(`${base}/register`);
    }
  });

  it('validates email, blank names, password length and password confirmation', () => {
    render(RegisterPageComponent);
    fillRegistration();
    fill({ email: 'invalid-email', nombre: '  ', password: 'short', confirmPassword: 'different' });
    submit();
    expect(element.querySelector('#register-email-error')?.textContent).toContain('correo electrónico válido');
    expect(element.querySelector('#name-error')?.textContent).toContain('obligatorio');
    expect(element.querySelector('#register-password-error')?.textContent).toContain('8 caracteres');
    expect(element.querySelector('#confirm-error')?.textContent).toContain('no coinciden');
    http.expectNone(`${base}/register`);
    fill({ email: user.email, nombre: 'Ana', password: 'password123', confirmPassword: '' });
    submit();
    expect(element.querySelector('#confirm-error')?.textContent).toContain('obligatorio');
    http.expectNone(`${base}/register`);
  });

  it('registers with optional surname omitted and blocks duplicate submissions', () => {
    render(RegisterPageComponent);
    fillRegistration();
    submit();
    submit();
    const request = http.expectOne(`${base}/register`);
    expect(Object.keys(request.request.body).sort()).toEqual(['email', 'nombre', 'password', 'username']);
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBeTrue();
    request.flush(ok);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { registered: '1', returnUrl: '/cuenta' } });
    expect(element.querySelector<HTMLInputElement>('#register-password')?.value).toBe('');
  });

  it('displays a duplicate username error and allows correction and retry', () => {
    render(RegisterPageComponent);
    fillRegistration();
    submit();
    http.expectOne(`${base}/register`).flush({ success: false, message: 'El username ya existe' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(element.querySelector('#username-error')?.textContent).toContain('ya existe');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Elige otro');
    expect(element.querySelector<HTMLButtonElement>('button')?.disabled).toBeFalse();
    fill({ username: 'ana-new' });
    submit();
    http.expectOne(`${base}/register`).flush(ok);
    expect(router.navigate).toHaveBeenCalled();
  });

  it('identifies an existing email separately from the username', () => {
    render(RegisterPageComponent);
    fillRegistration();
    submit();
    http.expectOne(`${base}/register`).flush({ success: false, message: 'El email ya está registrado' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(element.querySelector('#register-email-error')?.textContent).toContain('ya está registrado');
    expect(element.querySelector('#username-error')).toBeNull();
  });

  it('does not send an invalid login', () => {
    render(LoginPageComponent);
    submit();
    expect(element.querySelectorAll('.field-error').length).toBe(2);
    fill({ email: 'invalid', password: 'short' });
    submit();
    expect(element.querySelector('#login-email-error')?.textContent).toContain('correo electrónico válido');
    expect(element.querySelector('#login-password-error')?.textContent).toContain('8 caracteres');
    http.expectNone(`${base}/login`);
  });

  it('shows a Spanish credentials error and redirects after a successful retry and /me', () => {
    render(LoginPageComponent);
    fill({ email: user.email, password: 'password123' });
    submit();
    submit();
    http.expectOne(`${base}/login`).flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('no son correctos');
    expect(element.querySelector<HTMLButtonElement>('button')?.disabled).toBeFalse();
    submit();
    http.expectOne(`${base}/login`).flush(ok);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    http.expectOne(`${base}/me`).flush({ ...ok, data: user });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cuenta');
    expect(element.querySelector<HTMLInputElement>('#login-password')?.value).toBe('');
  });

  it('reports unavailable endpoints without pretending to log in', () => {
    render(LoginPageComponent);
    fill({ email: user.email, password: 'password123' });
    submit();
    http.expectOne(`${base}/login`).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('todavía no está disponible');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('logs out from the account page and returns to login', () => {
    TestBed.inject(AuthService).restoreSession().subscribe();
    http.expectOne(`${base}/me`).flush({ ...ok, data: user });
    render(AccountPageComponent);
    expect(element.textContent).toContain(user.username);
    element.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(element.querySelector<HTMLButtonElement>('button')?.disabled).toBeTrue();
    http.expectOne(`${base}/logout`).flush(ok);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(TestBed.inject(AuthService).user()).toBeNull();
  });

  it('accepts internal return paths and rejects external URLs and authentication loops', () => {
    expect(safeReturnUrl('/cuenta?section=perfil')).toBe('/cuenta?section=perfil');
    expect(safeReturnUrl('/#novedades')).toBe('/#novedades');
    for (const path of [null, 'https://example.com', '//example.com', '/\\example.com', '/login', '/registro?returnUrl=/']) {
      expect(safeReturnUrl(path)).toBe('/cuenta');
    }
  });
});
