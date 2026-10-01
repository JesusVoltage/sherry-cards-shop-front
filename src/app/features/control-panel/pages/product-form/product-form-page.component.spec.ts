import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProductFormPageComponent } from './product-form-page.component';
import { environment } from '../../../../../environments/environment';

describe('ProductFormPageComponent', () => {
  const base = `${environment.apiBaseUrl}/api/admin`;
  const options = {
    categories: [{ id: 7, name: 'Pokémon', path: 'Pokémon', active: true }],
    types: [{ code: 'SEALED', name: 'Producto sellado' }],
    statuses: [{ code: 'DRAFT', name: 'Borrador' }, { code: 'ACTIVE', name: 'Activo' }]
  };

  function create() {
    TestBed.configureTestingModule({
      imports: [ProductFormPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const fixture = TestBed.createComponent(ProductFormPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${base}/catalog/options`).flush({ success: true, data: options });
    fixture.detectChanges();
    return { fixture, http, element: fixture.nativeElement as HTMLElement };
  }

  function type(element: HTMLElement, selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  it('creates a product leaving slug and SKU for the API to generate', () => {
    const { fixture, http, element } = create();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    type(element, '#name', '  Caja EB-05  ');
    type(element, '#category', '1: 7');
    type(element, '#v-price-0', '99.95');
    type(element, '#v-stock-0', '3');
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();

    const request = http.expectOne(`${base}/products`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      name: 'Caja EB-05', slug: null, categoryId: 7, type: 'SEALED', status: 'DRAFT', images: []
    }));
    expect(request.request.body.variants).toEqual([jasmine.objectContaining({
      id: null, sku: null, name: 'Estándar', price: 99.95, stockQuantity: 3, vatRate: 21, active: true
    })]);
    request.flush({ success: true, data: { id: 42 } });
    expect(navigate).toHaveBeenCalledWith(['/controlpanel/productos', 42], jasmine.anything());
  });

  it('marks the variant field the API rejects', () => {
    const { fixture, http, element } = create();
    type(element, '#name', 'Copia');
    type(element, '#category', '1: 7');
    type(element, '#v-price-0', '5');
    type(element, '#v-sku-0', 'ORIGINAL-1');
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();

    http.expectOne(`${base}/products`).flush(
      { success: false, message: 'Ese SKU ya existe', data: { 'variants[0].sku': 'Ese SKU ya existe' } },
      { status: 409, statusText: 'Conflict' }
    );
    fixture.detectChanges();
    expect(element.querySelector('.notice--error')?.textContent).toContain('Ese SKU ya existe');
    expect(element.querySelector('#v-sku-0')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('does not submit an incomplete product', () => {
    const { fixture, http, element } = create();
    element.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    fixture.detectChanges();
    http.expectNone(`${base}/products`);
    expect(element.querySelector('.notice--error')?.textContent).toContain('Revisa los campos');
  });
});
