import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { GOOGLE_CLIENT_ID } from '../../../../core/config/api.config';
import { GoogleSignInButtonComponent } from '../../components/google-sign-in-button/google-sign-in-button.component';
import { AuthService } from '../../services/auth.service';
import { authErrorMessage } from '../../utils/auth-errors';
import { fieldError, safeReturnUrl } from '../../utils/auth-validators';

@Component({
  selector: 'scw-login-page',
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: '../../styles/auth-page.scss'
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sessionError = this.auth.sessionError;
  protected readonly registered = this.route.snapshot.queryParamMap.get('registered') === '1';
  protected readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  protected readonly errorFor = fieldError;
  protected readonly googleEnabled = !!inject(GOOGLE_CLIENT_ID);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

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
      next: () => {
        this.form.reset();
        void this.router.navigateByUrl(this.returnUrl);
      },
      error: (error: unknown) => this.error.set(authErrorMessage(error, 'login'))
    });
  }

  protected googleLogin(credential: string): void {
    if (this.submitting()) return;
    this.error.set(null);
    this.submitting.set(true);

    this.auth.loginWithGoogle(credential).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl),
      error: (error: unknown) => this.error.set(authErrorMessage(error, 'google'))
    });
  }
}
