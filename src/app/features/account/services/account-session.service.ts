import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { authErrorMessage } from '../../auth/utils/auth-errors';

/** Cierre de sesión compartido por el menú lateral y las páginas de la cuenta. */
@Injectable()
export class AccountSessionService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly user = this.auth.user;
  readonly loggingOut = signal(false);
  readonly logoutError = signal<string | null>(null);

  logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.logoutError.set(null);
    this.auth.logout().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loggingOut.set(false))
    ).subscribe({
      next: () => { void this.router.navigate(['/login']); },
      error: (error: unknown) => this.logoutError.set(authErrorMessage(error, 'logout'))
    });
  }
}
