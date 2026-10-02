import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoriesPageComponent } from './categories-page.component';
import { environment } from '../../../../../environments/environment';

describe('CategoriesPageComponent', () => {
  const base = `${environment.apiBaseUrl}/api/admin/categories`;
  const category = (id: number, name: string, parentId: number | null, displayOrder: number, extra = {}) => ({
    id, name, slug: name.toLowerCase(), description: null, imageUrl: null, parentId, active: true, displayOrder,
    productCount: 0, childCount: 0, system: false, ...extra
  });
  const categories = [
    category(1, 'Pokémon', null, 0, { childCount: 2 }),
    category(2, 'Expansiones', 1, 0),
    category(3, 'Promos', 1, 1, { productCount: 4 }),
    category(9, 'Sin categoría', null, 999, { system: true })
  ];

  function create() {
    TestBed.configureTestingModule({ imports: [CategoriesPageComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(CategoriesPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(base).flush({ success: true, data: categories });
    fixture.detectChanges();
    return { fixture, http, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the tree indented with Sin categoría protected', () => {
    const { element } = create();
    const rows = Array.from(element.querySelectorAll<HTMLElement>('.row'));
    expect(rows.map((row) => row.querySelector('strong')?.textContent?.trim())).toEqual(['Pokémon', 'Expansiones', 'Promos', 'Sin categoría']);
    expect(rows[1].style.getPropertyValue('--depth')).toBe('1');
    expect(rows[3].querySelector<HTMLButtonElement>('[aria-label="Borrar Sin categoría"]')!.disabled).toBeTrue();
    expect(rows[0].querySelector<HTMLButtonElement>('[aria-label="Borrar Pokémon"]')!.disabled).toBeTrue();
  });

  it('moves a category within its level', () => {
    const { http, element } = create();
    element.querySelector<HTMLButtonElement>('[aria-label="Subir Promos"]')!.click();
    const request = http.expectOne(`${base}/order`);
    expect(request.request.body).toEqual({ parentId: 1, categoryIds: [3, 2] });
  });

  it('creates a subcategory under the chosen parent', () => {
    const { fixture, http, element } = create();
    element.querySelector<HTMLButtonElement>('[aria-label="Añadir subcategoría a Pokémon"]')!.click();
    fixture.detectChanges();
    const name = element.querySelector<HTMLInputElement>('#cat-name')!;
    name.value = 'Accesorios Pokémon';
    name.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('.editor button[type=submit]')!.click();

    const request = http.expectOne(base);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(jasmine.objectContaining({ name: 'Accesorios Pokémon', parentId: 1, active: true }));
  });
});
