import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

/** Mensaje para el panel: la API ya explica en castellano los errores de negocio (4xx). */
export function adminErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TimeoutError) return 'La solicitud está tardando demasiado. Vuelve a intentarlo.';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
    if (error.status === 401) return 'Tu sesión ha caducado. Vuelve a entrar.';
    if (error.status === 403) return 'Tu cuenta no tiene permisos de administración.';
    const message = error.error?.message;
    if (error.status < 500 && typeof message === 'string' && message) return message;
  }
  return fallback;
}
