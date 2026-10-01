import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(AuthService).restoreSession().pipe(
    map((user) => user ? true : router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    }))
  );
};
