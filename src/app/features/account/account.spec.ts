import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authCredentialsInterceptor } from '../auth/interceptors/auth-credentials.interceptor';
import { AuthService } from '../auth/services/auth.service';
import { AccountLayoutComponent } from './layout/account-layout.component';
import { AccountAddressesComponent } from './pages/account-addresses/account-addresses.component';
import { AccountDetailsComponent } from './pages/account-details/account-details.component';

const api = 'https://sherry-cards-shop-api-production.up.railway.app/api';
const user = {
  id: 1, username: 'ana_cards', email: 'ana@example.com', nombre: 'Ana', apellidos: 'López',
  role: 'CLIENTE', status: 'ACTIVO', hasPassword: true, googleLinked: false
};
const ok = (data: unknown = null) => ({ success: true, message: 'OK', data, timestamp: '2026-10-01T10:00:00Z' });

describe('Account area', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountLayoutComponent],
      providers: [
        provideHttpClient(withInterceptors([authCredentialsInterceptor])), provideHttpClientTesting(),
        provideRouter([{ path: 'cuenta', component: AccountLayoutComponent, children: [
          { path: 'direcciones', component: AccountAddressesComponent }
        ] }])
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    TestBed.inject(AuthService).restoreSession().subscribe();
    http.expectOne(`${api}/auth/me`).flush(ok(user));
  });
  afterEach(() => http.verify());

  it('logs out from the sidebar and returns to login', () => {
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture: ComponentFixture<AccountLayoutComponent> = TestBed.createComponent(AccountLayoutComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Direcciones');
    const logout = element.querySelector<HTMLButtonElement>('.account__nav button')!;
    logout.click();
    fixture.detectChanges();
    expect(logout.disabled).toBeTrue();
    http.expectOne(`${api}/auth/logout`).flush(ok());
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(TestBed.inject(AuthService).user()).toBeNull();
  });

  it('lists addresses and creates one with trimmed fields and the user name prefilled', async () => {
    const fixture = TestBed.createComponent(AccountLayoutComponent);
    fixture.detectChanges();
    await router.navigateByUrl('/cuenta/direcciones');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    const list = http.expectOne(`${api}/account/addresses`);
    expect(list.request.withCredentials).toBeTrue();
    list.flush(ok([]));
    fixture.detectChanges();
    expect(element.textContent).toContain('Todavía no has guardado ninguna dirección');

    element.querySelector<HTMLButtonElement>('.empty .btn')!.click();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#address-name')!.value).toBe('Ana');
    expect(element.querySelector<HTMLInputElement>('#address-surname')!.value).toBe('López');
    for (const [id, value] of [['address-street', ' Calle Mayor '], ['address-number', '1'],
      ['address-zip', '28013'], ['address-city', 'Madrid'], ['address-province', 'Madrid']]) {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const create = http.expectOne({ method: 'POST', url: `${api}/account/addresses` });
    expect(create.request.body).toEqual(jasmine.objectContaining({
      nombreDestinatario: 'Ana', apellidosDestinatario: 'López', calle: 'Calle Mayor', pais: 'España',
      usoEnvio: true, usoFacturacion: false, predeterminadaEnvio: true, predeterminadaFacturacion: false
    }));
    expect(create.request.body.alias).toBeUndefined();
    create.flush(ok({ id: 5 }));
    http.expectOne(`${api}/account/addresses`).flush(ok([]));
  });

  function fillInputs(element: HTMLElement, values: Record<string, string>): void {
    for (const [id, value] of Object.entries(values)) {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  it('updates the profile and refreshes the user in memory', () => {
    const fixture = TestBed.createComponent(AccountDetailsComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector<HTMLInputElement>('#profile-email')!.readOnly).toBeTrue();
    fillInputs(element, { 'profile-name': ' Ana María ' });
    fixture.detectChanges();
    element.querySelectorAll('form')[0].dispatchEvent(new Event('submit'));

    const request = http.expectOne({ method: 'PUT', url: `${api}/account/profile` });
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.body).toEqual({ username: 'ana_cards', nombre: 'Ana María', apellidos: 'López' });
    request.flush(ok({ ...user, nombre: 'Ana María' }));
    fixture.detectChanges();
    expect(TestBed.inject(AuthService).user()?.nombre).toBe('Ana María');
    expect(element.textContent).toContain('Tus datos se han guardado');
  });

  it('shows the API reason when the new password is rejected', () => {
    const fixture = TestBed.createComponent(AccountDetailsComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    fillInputs(element, { 'password-current': 'actual-123', 'password-new': 'qwertyuiop123', 'password-confirm': 'qwertyuiop123' });
    fixture.detectChanges();
    element.querySelectorAll('form')[1].dispatchEvent(new Event('submit'));

    const request = http.expectOne({ method: 'PUT', url: `${api}/account/password` });
    expect(request.request.body).toEqual({ currentPassword: 'actual-123', newPassword: 'qwertyuiop123' });
    const reason = 'Esta contraseña aparece en filtraciones de datos conocidas. Elige otra distinta';
    request.flush({ success: false, message: reason, data: { newPassword: reason } }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(element.textContent).toContain(reason);
  });
});
