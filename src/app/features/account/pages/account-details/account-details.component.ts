import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { applyApiFieldErrors } from '../../../../core/utils/api-errors';
import { AuthService } from '../../../auth/services/auth.service';
import { AccountApiService } from '../../services/account-api.service';
import { accountErrorMessage, accountFieldError, USERNAME_PATTERN } from '../../utils/account-errors';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const confirmation = group.get('confirmPassword')?.value;
  return confirmation && confirmation !== group.get('newPassword')?.value ? { mismatch: true } : null;
}

@Component({
  selector: 'scw-account-details',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './account-details.component.html',
  styleUrls: ['../../styles/account-page.scss', './account-details.component.scss']
})
export class AccountDetailsComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(AccountApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly user = this.auth.user;
  protected readonly errorFor = accountFieldError;

  protected readonly profileSaving = signal(false);
  protected readonly profileError = signal<string | null>(null);
  protected readonly profileSuccess = signal<string | null>(null);
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(USERNAME_PATTERN)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.maxLength(150)]]
  });

  protected readonly passwordSaving = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly passwordSuccess = signal<string | null>(null);
  protected readonly showPasswords = signal(false);
  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: [''],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordsMatch });

  constructor() {
    this.resetProfile();
    this.syncCurrentPasswordRule();
  }

  protected resetProfile(): void {
    const user = this.user();
    this.profileForm.reset({
      username: user?.username ?? '',
      nombre: user?.nombre ?? '',
      apellidos: user?.apellidos ?? ''
    });
  }

  protected saveProfile(): void {
    if (this.profileSaving()) return;
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;
    this.profileSaving.set(true);
    this.profileError.set(null);
    this.profileSuccess.set(null);

    const { username, nombre, apellidos } = this.profileForm.getRawValue();
    this.api.updateProfile({ username, nombre: nombre.trim(), apellidos: apellidos.trim() || undefined }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.profileSaving.set(false))
    ).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.resetProfile();
        this.profileSuccess.set('Tus datos se han guardado.');
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.profileForm.controls.username.setErrors({ server: 'Este nombre de usuario ya está en uso. Elige otro.' });
          this.profileError.set('Ese nombre de usuario ya está en uso.');
          return;
        }
        applyApiFieldErrors(this.profileForm, error);
        this.profileError.set(accountErrorMessage(error, 'No se pudieron guardar tus datos.'));
      }
    });
  }

  protected changePassword(): void {
    if (this.passwordSaving()) return;
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;
    this.passwordSaving.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    const hadPassword = this.user()?.hasPassword ?? true;
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.api.changePassword({ currentPassword: hadPassword ? currentPassword : undefined, newPassword }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.passwordSaving.set(false))
    ).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.passwordForm.reset();
        this.showPasswords.set(false);
        this.syncCurrentPasswordRule();
        this.passwordSuccess.set(hadPassword
          ? 'Contraseña actualizada. Hemos cerrado la sesión en tus otros dispositivos.'
          : 'Contraseña creada. Ya puedes iniciar sesión también con tu correo.');
      },
      error: (error: unknown) => {
        applyApiFieldErrors(this.passwordForm, error);
        this.passwordError.set(accountErrorMessage(error, 'No se pudo actualizar la contraseña.'));
      }
    });
  }

  /** La contraseña actual solo se pide si la cuenta ya tiene una. */
  private syncCurrentPasswordRule(): void {
    const control = this.passwordForm.controls.currentPassword;
    control.setValidators(this.user()?.hasPassword ? [Validators.required] : []);
    control.updateValueAndValidity();
  }
}
