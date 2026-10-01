import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';

export const USERNAME_PATTERN = '^[a-zA-Z0-9_-]+$';

export function accountErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0: return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
      case 400: return 'Revisa los datos marcados e inténtalo de nuevo.';
      case 401: return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
      case 404: return 'El elemento ya no existe. Actualiza la página.';
      case 429: return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
      case 409: return typeof error.error?.message === 'string' ? `${error.error.message}.` : fallback;
    }
  }
  return fallback;
}

export function accountFieldError(control: AbstractControl): string | null {
  if (!control.touched || !control.errors) return null;
  if (control.hasError('server')) return control.getError('server');
  if (control.hasError('required')) return 'Este campo es obligatorio.';
  if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
  if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
  if (control.hasError('pattern')) return control.getError('pattern').requiredPattern === USERNAME_PATTERN
    ? 'Usa letras de la A a la Z, números, guion o guion bajo, sin espacios.'
    : 'Usa solo números, espacios y los símbolos + ( ) - .';
  if (control.hasError('mismatch')) return 'Las contraseñas no coinciden.';
  return 'Revisa este campo.';
}
