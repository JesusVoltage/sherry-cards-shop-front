import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl
});

export const GOOGLE_CLIENT_ID = new InjectionToken<string>('GOOGLE_CLIENT_ID', {
  providedIn: 'root',
  factory: () => environment.googleClientId
});
