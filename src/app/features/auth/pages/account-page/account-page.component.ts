import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { authErrorMessage } from '../../utils/auth-errors';

@Component({
  selector: 'scw-account-page',
  imports: [RouterLink],
  templateUrl: './account-page.component.html',
  styleUrl: '../../styles/auth-page.scss'
})
export class AccountPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly user = this.auth.user;
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected logout(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.auth.logout().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: () => { void this.router.navigate(['/login']); },
      error: (error: unknown) => this.error.set(authErrorMessage(error, 'logout'))
    });
  }
}
