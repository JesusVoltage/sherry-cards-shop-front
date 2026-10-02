import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideTrash2 } from '@lucide/angular';
import { finalize, forkJoin, of } from 'rxjs';
import { apiFieldErrors } from '../../../../core/utils/api-errors';
import { AuthService } from '../../../auth/services/auth.service';
import { AdminUser, AdminUserRequest, UserOptions } from '../../models/admin.model';
import { AdminApiService } from '../../services/admin-api.service';
import { adminErrorMessage } from '../../utils/admin-errors';
import { formatDate } from '../../utils/admin-format';

/** Alta y edición de cuentas con cualquier rol. */
@Component({
  selector: 'scw-user-form-page',
  imports: [ReactiveFormsModule, RouterLink, LucideArrowLeft, LucideTrash2],
  templateUrl: './user-form-page.component.html',
  styleUrls: ['../../styles/panel-page.scss', './user-form-page.component.scss']
})
export class UserFormPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly me = inject(AuthService).user;

  protected readonly user = signal<AdminUser | null>(null);
  protected readonly creating = signal(true);
  protected readonly options = signal<UserOptions | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly confirmDelete = signal(false);
  protected readonly deleting = signal(false);
  /** Nadie puede quitarse el rol de administrador ni bloquearse: la API lo rechazaría igualmente. */
  protected readonly isSelf = computed(() => this.user() !== null && this.user()?.id === this.me()?.id);
  protected readonly date = formatDate;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.maxLength(150)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.minLength(8), Validators.maxLength(128)]],
    role: ['CLIENTE', Validators.required],
    status: ['ACTIVO', Validators.required]
  });

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    const id = param ? Number(param) : null;
    this.creating.set(id === null);
    if (id === null) this.form.controls.password.addValidators(Validators.required);
    const notice = history.state?.notice;
    if (typeof notice === 'string') this.notice.set(notice);

    forkJoin({ options: this.api.userOptions(), user: id === null ? of(null) : this.api.user(id) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ options, user }) => {
          this.options.set(options);
          if (user) this.fill(user);
        },
        error: (error: unknown) => this.loadError.set(error instanceof HttpErrorResponse && error.status === 404
          ? 'Esta cuenta ya no existe.' : adminErrorMessage(error, 'No se pudo cargar la cuenta.'))
      });
  }

  protected submit(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    this.error.set(null);
    this.notice.set(null);
    if (this.form.invalid) {
      this.error.set('Revisa los campos marcados en rojo.');
      return;
    }
    const value = this.form.getRawValue();
    const request: AdminUserRequest = {
      nombre: value.nombre.trim(),
      apellidos: value.apellidos.trim() || null,
      username: value.username.trim(),
      email: value.email.trim(),
      password: value.password || null,
      role: value.role,
      status: value.status
    };
    const current = this.user();
    const save$ = current === null ? this.api.createUser(request) : this.api.updateUser(current.id, request);
    this.saving.set(true);
    save$.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: (user) => {
        if (current === null) {
          void this.router.navigate(['/controlpanel/usuarios', user.id], { replaceUrl: true, state: { notice: 'Cuenta creada.' } });
          return;
        }
        this.fill(user);
        this.notice.set('Cambios guardados.');
      },
      error: (error: unknown) => {
        for (const [field, message] of Object.entries(apiFieldErrors(error))) {
          const control = this.form.get(field);
          control?.setErrors({ ...control.errors, server: message });
          control?.markAsTouched();
        }
        this.error.set(adminErrorMessage(error, 'No se pudo guardar la cuenta.'));
      }
    });
  }

  protected remove(): void {
    const current = this.user();
    if (!current || this.deleting()) return;
    this.deleting.set(true);
    this.error.set(null);
    this.api.deleteUser(current.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.deleting.set(false))).subscribe({
      next: () => void this.router.navigate(['/controlpanel/usuarios']),
      error: (error: unknown) => {
        this.confirmDelete.set(false);
        this.error.set(adminErrorMessage(error, 'No se pudo borrar la cuenta.'));
      }
    });
  }

  protected errorFor(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('required')) return 'Obligatorio';
    if (control.hasError('email')) return 'Correo no válido';
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres`;
    if (control.hasError('pattern')) return 'Usa letras A-Z, números, guion o guion bajo';
    return 'Valor no válido';
  }

  private fill(user: AdminUser): void {
    this.user.set(user);
    this.form.reset({
      nombre: user.nombre, apellidos: user.apellidos ?? '', username: user.username, email: user.email,
      password: '', role: user.role, status: user.status
    });
    if (this.isSelf()) {
      this.form.controls.role.disable();
      this.form.controls.status.disable();
    } else {
      this.form.controls.role.enable();
      this.form.controls.status.enable();
    }
  }
}
