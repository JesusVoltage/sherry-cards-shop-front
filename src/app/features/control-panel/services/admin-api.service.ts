import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminCategory, AdminProduct, AdminProductSummary, AdminUser, AdminUserRequest, CatalogOptions, CategoryRequest,
  Dashboard, Page, ProductFilters, ProductRequest, UploadedImage, UserFilters, UserOptions
} from '../models/admin.model';

export type UploadFolder = 'PRODUCTS' | 'CATEGORIES';

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

  uploadImage(file: File, folder: UploadFolder = 'PRODUCTS'): Observable<UploadedImage> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ApiResponse<UploadedImage>>(`${this.url}/media/images`, body, {
      params: new HttpParams().set('folder', folder)
    }).pipe(map(unwrap));
  }

  categories(): Observable<AdminCategory[]> {
    return this.http.get<ApiResponse<AdminCategory[]>>(`${this.url}/categories`).pipe(map(unwrap));
  }

  createCategory(request: CategoryRequest): Observable<AdminCategory> {
    return this.categoryChange(this.http.post<ApiResponse<AdminCategory>>(`${this.url}/categories`, request).pipe(map(unwrap)));
  }

  updateCategory(id: number, request: CategoryRequest): Observable<AdminCategory> {
    return this.categoryChange(this.http.put<ApiResponse<AdminCategory>>(`${this.url}/categories/${id}`, request).pipe(map(unwrap)));
  }

  /** Devuelve el mensaje de la API, que indica cuántos productos han pasado a "Sin categoría". */
  deleteCategory(id: number): Observable<string> {
    return this.categoryChange(this.http.delete<ApiResponse<number>>(`${this.url}/categories/${id}`)
      .pipe(map((response) => response.message)));
  }

  reorderCategories(parentId: number | null, categoryIds: number[]): Observable<AdminCategory[]> {
    return this.categoryChange(this.http.put<ApiResponse<AdminCategory[]>>(`${this.url}/categories/order`, { parentId, categoryIds })
      .pipe(map(unwrap)));
  }

  users(filters: UserFilters, size = 20): Observable<Page<AdminUser>> {
    let params = new HttpParams().set('page', filters.page).set('size', size);
    if (filters.search.trim()) params = params.set('search', filters.search.trim());
    if (filters.role) params = params.set('role', filters.role);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<ApiResponse<Page<AdminUser>>>(`${this.url}/users`, { params }).pipe(map(unwrap));
  }

  user(id: number): Observable<AdminUser> {
    return this.http.get<ApiResponse<AdminUser>>(`${this.url}/users/${id}`).pipe(map(unwrap));
  }

  userOptions(): Observable<UserOptions> {
    return this.http.get<ApiResponse<UserOptions>>(`${this.url}/users/options`).pipe(map(unwrap));
  }

  createUser(request: AdminUserRequest): Observable<AdminUser> {
    return this.http.post<ApiResponse<AdminUser>>(`${this.url}/users`, request).pipe(map(unwrap));
  }

  updateUser(id: number, request: AdminUserRequest): Observable<AdminUser> {
    return this.http.put<ApiResponse<AdminUser>>(`${this.url}/users/${id}`, request).pipe(map(unwrap));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/users/${id}`).pipe(map(() => undefined));
  }

  /** Tras cambiar categorías, el desplegable del formulario de producto tiene que volver a pedirse. */
  private categoryChange<T>(request: Observable<T>): Observable<T> {
    return request.pipe(tap(() => { this.optionsRequest = undefined; }));
  }
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response?.success || response.data === null || response.data === undefined) {
    throw new Error(response?.message || 'La API devolvió una respuesta no válida.');
  }
  return response.data;
}
