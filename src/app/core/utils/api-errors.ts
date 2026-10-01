import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';

/** Errores por campo que la API devuelve en `data` (validación y reglas de negocio). */
export function apiFieldErrors(error: unknown): Record<string, string> {
  const data = error instanceof HttpErrorResponse ? error.error?.data : null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return Object.fromEntries(Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

/** Marca en el formulario los errores de campo de la API. Devuelve true si alguno coincide. */
export function applyApiFieldErrors(form: FormGroup, error: unknown): boolean {
  let applied = false;
  for (const [field, message] of Object.entries(apiFieldErrors(error))) {
    const control: AbstractControl | null = form.get(field);
    if (!control) continue;
    control.setErrors({ ...control.errors, server: message });
    control.markAsTouched();
    applied = true;
  }
  return applied;
}
