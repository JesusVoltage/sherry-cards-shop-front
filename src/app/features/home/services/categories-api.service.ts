import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, Category } from '../models/category.model';

const CATEGORIES_API_URL = 'https://sherry-cards-shop-api-production.up.railway.app/api/categories';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(CATEGORIES_API_URL).pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('La API devolvió una respuesta de categorías no válida.');
        }

        return [...response.data].sort((first, second) => first.displayOrder - second.displayOrder);
      })
    );
  }
}