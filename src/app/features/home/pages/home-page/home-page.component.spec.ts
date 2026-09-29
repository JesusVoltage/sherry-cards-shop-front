import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApiResponse } from '../../models/api-response.model';
import { Novelty } from '../../models/novelty.model';
import { HomePageComponent } from './home-page.component';

const NOVELTIES_API_URL = 'https://sherry-cards-shop-api-production.up.railway.app/api/novedades';
const CATEGORIES_API_URL = 'https://sherry-cards-shop-api-production.up.railway.app/api/categories';
const novelty: Novelty = {
  id: 1,
  title: 'EB-05 de One Piece',
  slug: 'eb-05-one-piece',
  description: 'Novedad del set EB-05 de One Piece.',
  imageUrl: null,
  categoryName: 'One Piece',
  categorySlug: 'one-piece',
  displayOrder: 1
};

function response(data: Novelty[]): ApiResponse<Novelty[]> {
  return {
    success: true,
    message: 'Novedades activas obtenidas correctamente',
    data,
    timestamp: '2026-09-29T12:18:12.277544696Z'
  };
}

describe('HomePageComponent novelties', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomePageComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();

    http.expectOne(CATEGORIES_API_URL).flush({
      success: true,
      data: [{
        id: 1,
        name: 'One Piece',
        slug: 'one-piece',
        description: 'Cartas de One Piece',
        imageUrl: null,
        displayOrder: 1
      }]
    });
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads novelties independently of categories', () => {
    expect(element.querySelector('#novedades [aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('.category__name')?.textContent).toContain('One Piece');

    const request = http.expectOne(NOVELTIES_API_URL);
    expect(request.request.method).toBe('GET');
    request.flush(response([novelty]));
    fixture.detectChanges();

    expect(element.querySelector('#novedades [aria-busy="true"]')).toBeNull();
    expect(element.querySelector('.arrival h2')?.textContent).toBe(novelty.title);
  });

  it('renders API content in display order, with an illustration when the image is null', () => {
    const laterNovelty: Novelty = {
      ...novelty,
      id: 2,
      title: '30 aniversario de Pokémon',
      slug: '30-aniversario-pokemon',
      categoryName: 'Pokémon',
      categorySlug: 'pokemon',
      displayOrder: 2,
      imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    };
    http.expectOne(NOVELTIES_API_URL).flush(response([laterNovelty, novelty]));
    fixture.detectChanges();

    const cards = element.querySelectorAll<HTMLElement>('.arrival');
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector('h2')?.textContent).toBe(novelty.title);
    expect(cards[0].querySelector('p')?.textContent).toBe(novelty.description);
    expect(cards[0].querySelector('.arrival__eyebrow')?.textContent).toContain(novelty.categoryName);
    expect(cards[0].querySelector('.arrival-art')).not.toBeNull();
    expect(cards[0].querySelector('img')).toBeNull();
    expect(cards[1].querySelector('h2')?.textContent).toBe(laterNovelty.title);
    expect(cards[1].querySelector('img')?.getAttribute('src')).toBe(laterNovelty.imageUrl);
    expect(cards[1].querySelector('img')?.alt).toBe(laterNovelty.title);
    expect(cards[1].querySelector('.arrival-art')).toBeNull();
  });

  it('shows an empty state when there are no active novelties', () => {
    http.expectOne(NOVELTIES_API_URL).flush(response([]));
    fixture.detectChanges();

    expect(element.querySelector('.novelties-state')?.textContent)
      .toContain('Todavía no hay novedades disponibles.');
    expect(element.querySelector('.arrival')).toBeNull();
  });

  it('allows retrying a failed request without reloading categories', () => {
    http.expectOne(NOVELTIES_API_URL).flush('Unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });
    fixture.detectChanges();

    expect(element.querySelector('#novedades [role="alert"]')?.textContent)
      .toContain('No se pudieron cargar las novedades');
    expect(element.querySelector('.category__name')?.textContent).toContain('One Piece');
    element.querySelector<HTMLButtonElement>('#novedades .retry-button')!.click();
    fixture.detectChanges();

    expect(element.querySelector('#novedades [role="alert"]')).toBeNull();
    expect(element.querySelector('#novedades [aria-busy="true"]')).not.toBeNull();
    http.expectNone(CATEGORIES_API_URL);
    http.expectOne(NOVELTIES_API_URL).flush(response([novelty]));
    fixture.detectChanges();

    expect(element.querySelector('.arrival h2')?.textContent).toBe(novelty.title);
  });

  for (const invalidResponse of [
    { ...response([novelty]), success: false },
    { ...response([]), data: null },
    { ...response([]), data: {} }
  ]) {
    it(`shows an error for an invalid API response: ${JSON.stringify(invalidResponse)}`, () => {
      http.expectOne(NOVELTIES_API_URL).flush(invalidResponse);
      fixture.detectChanges();

      expect(element.querySelector('#novedades [role="alert"]')).not.toBeNull();
      expect(element.querySelector('.arrival')).toBeNull();
    });
  }

  it('cancels a pending novelties request when the page is destroyed', () => {
    const request = http.expectOne(NOVELTIES_API_URL);
    fixture.destroy();

    expect(request.cancelled).toBeTrue();
  });
});
