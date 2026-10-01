import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const usernamePattern = /^[a-zA-Z0-9_-]+$/;

export const nonBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length === 0 ? { required: true } : null;

export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
};

export function fieldError(control: AbstractControl, label: string): string | null {
  if (!control.touched || !control.errors) return null;
  if (control.hasError('required')) return label === 'La contraseña'
    ? 'La contraseña es obligatoria.' : `${label} es obligatorio.`;
  if (control.hasError('email')) return 'Introduce un correo electrónico válido.';
  if (control.hasError('minlength')) {
    return `${label} debe tener al menos ${control.getError('minlength').requiredLength} caracteres.`;
  }
  if (control.hasError('maxlength')) {
    return `${label} debe tener como máximo ${control.getError('maxlength').requiredLength} caracteres.`;
  }
  if (control.hasError('pattern')) return 'Usa letras de la A a la Z, números, guion o guion bajo, sin espacios.';
  if (control.hasError('duplicate')) return label === 'El nombre de usuario'
    ? 'Este nombre de usuario ya existe. Elige otro.' : 'Este correo electrónico ya está registrado.';
  return 'Revisa este campo.';
}

export function safeReturnUrl(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value) ||
    /^\/(login|registro)(?:[/?#;]|$)/.test(value)) return '/cuenta';
  return value;
}
