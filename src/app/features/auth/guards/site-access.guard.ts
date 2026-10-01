import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { map } from 'rxjs';
import { SITE_CLOSED } from '../../../core/config/api.config';
import { ADMIN_ROLE } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/** Con la tienda cerrada solo un administrador con sesión entra; el resto cae en "próximamente". */
export const SiteAccessGuard: CanMatchFn = () => {
  if (!inject(SITE_CLOSED)) return true;
  return inject(AuthService).restoreSession().pipe(map((user) => user?.role === ADMIN_ROLE));
};
