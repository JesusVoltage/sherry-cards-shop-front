import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Novelty } from '../models/novelty.model';

const NOVELTIES_API_URL = 'https://sherry-cards-shop-api-production.up.railway.app/api/novedades';

@Injectable({ providedIn: 'root' })
export class NoveltiesApiService {
  private readonly http = inject(HttpClient);

  getNovelties(): Observable<Novelty[]> {
    // Refresh prerendered novelties in the browser instead of reusing build-time data.
    return this.http.get<ApiResponse<Novelty[]>>(NOVELTIES_API_URL, { transferCache: false }).pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('La API devolvió una respuesta de novedades no válida.');
        }

        return [...response.data].sort((first, second) => first.displayOrder - second.displayOrder);
      })
    );
  }
}
