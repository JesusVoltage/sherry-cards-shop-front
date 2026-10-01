import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { map } from 'rxjs';
import { ADMIN_ROLE } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/** Solo un administrador con sesión: a cualquier otro la ruta ni siquiera le existe. */
export const AdminGuard: CanMatchFn = () =>
  inject(AuthService).restoreSession().pipe(map((user) => user?.role === ADMIN_ROLE));
