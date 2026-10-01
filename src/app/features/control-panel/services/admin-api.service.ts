import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminProduct, AdminProductSummary, CatalogOptions, Dashboard, Page, ProductFilters, ProductRequest, UploadedImage
} from '../models/admin.model';

/** API del panel de control. Las cookies de sesión las añade authCredentialsInterceptor. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/api/admin`;
  private optionsRequest?: Observable<CatalogOptions>;

  dashboard(): Observable<Dashboard> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.url}/dashboard`).pipe(map(unwrap));
  }

  products(filters: ProductFilters, size = 20): Observable<Page<AdminProductSummary>> {
    let params = new HttpParams().set('page', filters.page).set('size', size);
    if (filters.search.trim()) params = params.set('search', filters.search.trim());
    if (filters.categoryId !== null) params = params.set('categoryId', filters.categoryId);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<ApiResponse<Page<AdminProductSummary>>>(`${this.url}/products`, { params }).pipe(map(unwrap));
  }

  product(id: number): Observable<AdminProduct> {
    return this.http.get<ApiResponse<AdminProduct>>(`${this.url}/products/${id}`).pipe(map(unwrap));
  }

  createProduct(request: ProductRequest): Observable<AdminProduct> {
    return this.http.post<ApiResponse<AdminProduct>>(`${this.url}/products`, request).pipe(map(unwrap));
  }

  updateProduct(id: number, request: ProductRequest): Observable<AdminProduct> {
    return this.http.put<ApiResponse<AdminProduct>>(`${this.url}/products/${id}`, request).pipe(map(unwrap));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/products/${id}`).pipe(map(() => undefined));
  }

  /** Categorías, tipos y estados cambian poco: se piden una vez por sesión del panel. */
  catalogOptions(): Observable<CatalogOptions> {
    this.optionsRequest ??= this.http.get<ApiResponse<CatalogOptions>>(`${this.url}/catalog/options`).pipe(
      map(unwrap),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.optionsRequest;
  }

  uploadImage(file: File): Observable<UploadedImage> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ApiResponse<UploadedImage>>(`${this.url}/media/images`, body).pipe(map(unwrap));
  }
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response?.success || response.data === null || response.data === undefined) {
    throw new Error(response?.message || 'La API devolvió una respuesta no válida.');
  }
  return response.data;
}
