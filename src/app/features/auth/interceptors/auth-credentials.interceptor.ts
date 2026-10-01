import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../../../core/config/api.config';

export const authCredentialsInterceptor: HttpInterceptorFn = (request, next) => {
  const authUrl = `${inject(API_BASE_URL)}/api/auth/`;
  if (!request.url.startsWith(authUrl)) return next(request);

  return next(request.clone({ withCredentials: true, transferCache: false }));
};
