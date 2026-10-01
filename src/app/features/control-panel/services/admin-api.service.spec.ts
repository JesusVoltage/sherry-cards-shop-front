import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminApiService } from './admin-api.service';
import { environment } from '../../../../environments/environment';

describe('AdminApiService', () => {
  const base = `${environment.apiBaseUrl}/api/admin`;
  let api: AdminApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AdminApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends only the filters that are set', () => {
    api.products({ search: '  eb-05 ', categoryId: 3, status: null, page: 2 }).subscribe();
    const request = http.expectOne((req) => req.url === `${base}/products`);
    expect(request.request.params.get('search')).toBe('eb-05');
    expect(request.request.params.get('categoryId')).toBe('3');
    expect(request.request.params.has('status')).toBeFalse();
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ success: true, data: { items: [], page: 2, size: 20, totalItems: 0, totalPages: 0 } });
  });

  it('uploads images as multipart form data', () => {
    const result = jasmine.createSpy('result');
    api.uploadImage(new File(['x'], 'foto.png', { type: 'image/png' })).subscribe(result);
    const request = http.expectOne(`${base}/media/images`);
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('file')).toBeTruthy();
    request.flush({ success: true, data: { id: 1, url: 'https://cdn.test/a.png', contentType: 'image/png', sizeBytes: 1 } });
    expect(result).toHaveBeenCalledWith(jasmine.objectContaining({ url: 'https://cdn.test/a.png' }));
  });

  it('asks for the form options only once', () => {
    api.catalogOptions().subscribe();
    api.catalogOptions().subscribe();
    http.expectOne(`${base}/catalog/options`).flush({ success: true, data: { categories: [], types: [], statuses: [] } });
  });
});
