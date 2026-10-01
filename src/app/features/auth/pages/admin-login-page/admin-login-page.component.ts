import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BrandLogoComponent } from '../../../../ui/components/brand-logo/brand-logo.component';
import { ADMIN_ROLE } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { authErrorMessage } from '../../utils/auth-errors';
import { fieldError } from '../../utils/auth-validators';

const NOT_ADMIN = 'Esta cuenta no tiene acceso de administrador.';

/** Acceso de administración: la única puerta a la tienda mientras está cerrada al público. */
@Component({
  selector: 'scw-admin-login-page',
  imports: [ReactiveFormsModule, BrandLogoComponent],
  templateUrl: './admin-login-page.component.html',
  styleUrl: '../../styles/auth-page.scss'
})
export class AdminLoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorFor = fieldError;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.destroyRef.onDestroy(() => meta.removeTag('name="robots"'));

    // Un administrador que ya tiene sesión pasa directamente a la tienda.
    this.auth.restoreSession().pipe(takeUntilDestroyed()).subscribe((user) => {
      if (user?.role === ADMIN_ROLE) void this.router.navigateByUrl('/');
    });
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error.set(null);
    this.submitting.set(true);

    this.auth.login(this.form.getRawValue()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: (user) => {
        if (user.role !== ADMIN_ROLE) {
          this.auth.logout().subscribe({ error: () => undefined });
          this.error.set(NOT_ADMIN);
          return;
        }
        this.form.reset();
        void this.router.navigateByUrl('/');
      },
      error: (error: unknown) => this.error.set(
        error instanceof HttpErrorResponse && error.status === 403 ? NOT_ADMIN : authErrorMessage(error, 'login')
      )
    });
  }
}
