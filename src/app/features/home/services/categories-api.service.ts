import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/api/categories`;

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(this.url).pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('La API devolvió una respuesta de categorías no válida.');
        }

        return [...response.data].sort((first, second) => first.displayOrder - second.displayOrder);
      })
    );
  }
}
