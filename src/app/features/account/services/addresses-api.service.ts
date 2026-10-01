import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Address, AddressRequest } from '../models/address.model';

/** Direcciones del usuario autenticado. Las cookies las añade authCredentialsInterceptor. */
@Injectable({ providedIn: 'root' })
export class AddressesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/api/account/addresses`;

  list(): Observable<Address[]> {
    return this.http.get<ApiResponse<Address[]>>(this.url).pipe(
      map((response) => {
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error('La API devolvió una respuesta de direcciones no válida.');
        }
        return response.data;
      })
    );
  }

  create(request: AddressRequest): Observable<Address> {
    return this.http.post<ApiResponse<Address>>(this.url, request).pipe(map((response) => response.data));
  }

  update(id: number, request: AddressRequest): Observable<Address> {
    return this.http.put<ApiResponse<Address>>(`${this.url}/${id}`, request).pipe(map((response) => response.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
