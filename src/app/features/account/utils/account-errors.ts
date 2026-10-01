import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';

export function accountErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0: return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
      case 400: return 'Revisa los datos de la dirección e inténtalo de nuevo.';
      case 401: return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
      case 404: return 'La dirección ya no existe. Actualiza la página.';
      case 409: return typeof error.error?.message === 'string' ? `${error.error.message}.` : fallback;
    }
  }
  return fallback;
}

export function addressFieldError(control: AbstractControl): string | null {
  if (!control.touched || !control.errors) return null;
  if (control.hasError('required')) return 'Este campo es obligatorio.';
  if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
  if (control.hasError('pattern')) return 'Usa solo números, espacios y los símbolos + ( ) - .';
  return 'Revisa este campo.';
}
