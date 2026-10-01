import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { GOOGLE_CLIENT_ID } from '../../../../core/config/api.config';
import { GoogleSignInButtonComponent } from '../../components/google-sign-in-button/google-sign-in-button.component';
import { AuthService } from '../../services/auth.service';
import { authErrorMessage, registrationConflict } from '../../utils/auth-errors';
import { fieldError, nonBlank, passwordsMatch, safeReturnUrl, usernamePattern } from '../../utils/auth-validators';

@Component({
  selector: 'scw-register-page',
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInButtonComponent],
  templateUrl: './register-page.component.html',
  styleUrl: '../../styles/auth-page.scss'
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly returnUrl = safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorFor = fieldError;
  protected readonly googleEnabled = !!inject(GOOGLE_CLIENT_ID);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(usernamePattern)]],
    email: ['', [Validators.required, Validators.email]],
    nombre: ['', [Validators.required, nonBlank]],
    apellidos: [''],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordsMatch });

  protected submit(): void {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error.set(null);
    this.submitting.set(true);
    const { username, email, nombre, apellidos, password } = this.form.getRawValue();

    this.auth.register({ username, email, nombre, apellidos, password }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: () => {
        this.form.reset();
        void this.router.navigate(['/login'], { queryParams: { registered: '1', returnUrl: this.returnUrl } });
      },
      error: (error: unknown) => {
        this.error.set(authErrorMessage(error, 'register'));
        const field = registrationConflict(error);
        if (field) this.form.controls[field].setErrors({ duplicate: true });
      }
    });
  }

  /** Google crea la cuenta (o la vincula si el correo ya existe) e inicia sesión directamente. */
  protected googleSignUp(credential: string): void {
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
