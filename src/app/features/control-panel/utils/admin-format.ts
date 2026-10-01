import { ProductStatusCode } from '../models/admin.model';

const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatEur(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : EUR.format(value);
}

export function formatDate(value: string | null | undefined): string {
  return value ? DATE.format(new Date(value)) : '—';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString('es-ES', { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
}

export const STATUS_LABELS: Record<ProductStatusCode, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado'
};
