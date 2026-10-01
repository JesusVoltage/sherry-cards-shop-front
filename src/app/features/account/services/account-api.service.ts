import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { User } from '../../auth/models/user.model';

export interface ProfileRequest {
  username: string;
  nombre: string;
  apellidos?: string;
}

export interface PasswordChangeRequest {
  currentPassword?: string;
  newPassword: string;
}

/** Datos personales y contraseña. Las cookies las añade authCredentialsInterceptor. */
@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/api/account`;

  updateProfile(request: ProfileRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.url}/profile`, request).pipe(map((response) => response.data));
  }

  /** La API cierra las demás sesiones y renueva las cookies de esta. */
  changePassword(request: PasswordChangeRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.url}/password`, request).pipe(map((response) => response.data));
  }
}
