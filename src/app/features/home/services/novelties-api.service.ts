import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { Novelty } from '../models/novelty.model';

@Injectable({ providedIn: 'root' })
export class NoveltiesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/api/novedades`;

  getNovelties(): Observable<Novelty[]> {
    // Refresh prerendered novelties in the browser instead of reusing build-time data.
    return this.http.get<ApiResponse<Novelty[]>>(this.url, { transferCache: false }).pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('La API devolvió una respuesta de novedades no válida.');
        }

        return [...response.data].sort((first, second) => first.displayOrder - second.displayOrder);
      })
    );
  }
}
