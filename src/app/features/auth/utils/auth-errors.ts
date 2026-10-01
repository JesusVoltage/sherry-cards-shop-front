import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export type AuthOperation = 'login' | 'register' | 'session' | 'logout';
export type ConflictField = 'username' | 'email';

export class AuthResponseError extends Error {}

function responseMessage(error: unknown): string {
  const message = error instanceof HttpErrorResponse ? error.error?.message
    : error instanceof AuthResponseError ? error.message : '';
  return typeof message === 'string' ? message : '';
}

export function registrationConflict(error: unknown): ConflictField | null {
  const message = responseMessage(error).toLowerCase();
  const conflict = error instanceof HttpErrorResponse && error.status === 409;
  if (!conflict && !/existe|registrad|duplicad|already|taken|in use/.test(message)) return null;
  if (/username|nombre de usuario|nickname/.test(message)) return 'username';
  if (/email|e-mail|correo/.test(message)) return 'email';
  return null;
}

export function authErrorMessage(error: unknown, operation: AuthOperation): string {
  if (operation === 'register') {
    const field = registrationConflict(error);
    if (field === 'username') return 'Este nombre de usuario ya existe. Elige otro.';
    if (field === 'email') return 'Este correo electrónico ya está registrado. Inicia sesión.';
  }

  if (error instanceof TimeoutError) {
    return 'La solicitud está tardando demasiado. Vuelve a intentarlo.';
  }
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0: return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
      case 400:
      case 422: return 'Revisa los datos introducidos e inténtalo de nuevo.';
      case 401: return operation === 'login'
        ? 'El correo electrónico o la contraseña no son correctos.'
        : 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
      case 403: return 'No se ha autorizado el acceso a esta cuenta. Contacta con la tienda si necesitas ayuda.';
      case 404:
      case 501: return 'El servicio de autenticación todavía no está disponible. Inténtalo más tarde.';
      case 409: return 'El nombre de usuario o el correo electrónico ya están registrados.';
      case 429: return 'Has realizado demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
    }
  }

  switch (operation) {
    case 'register': return 'No se pudo crear tu cuenta. Inténtalo de nuevo más tarde.';
    case 'login': return 'No se pudo iniciar sesión. Inténtalo de nuevo más tarde.';
    case 'logout': return 'No se pudo cerrar la sesión. Vuelve a intentarlo.';
    case 'session': return 'No se pudo comprobar tu sesión. Inténtalo de nuevo más tarde.';
  }
}
