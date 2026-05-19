/** Formato de fecha aplicación: DD/MM/AAAA (Argentina). */
const localeFecha = 'es-AR';

/** Horario 12 h con sufijo AM/PM (locale en-US para salida estable). */
const localeHora = 'en-US';

const opcionesSoloFecha: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const opcionesSoloHora: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

/** Reutilizar instancias (mejor rendimiento en listados). */
export const formateadorFechaSolo = new Intl.DateTimeFormat(localeFecha, opcionesSoloFecha);
export const formateadorHora12 = new Intl.DateTimeFormat(localeHora, opcionesSoloHora);

function normalizarEspaciosHora(texto: string): string {
  return texto.replace(/\u202f/g, ' ');
}

function aObjetoFecha(valor: Date | string | number): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

export function fechaYHoraSonValidos(fechaHora: Date): boolean {
  return Number.isFinite(fechaHora.getTime());
}

/** Salida ejemplo: `09/05/2026`. */
export function formatearFechaDiaMesAnio(valor: Date | string | number): string {
  const fechaHora = aObjetoFecha(valor);
  if (!fechaYHoraSonValidos(fechaHora)) return '—';
  return formateadorFechaSolo.format(fechaHora);
}

/** Salida ejemplo: `03:45 PM` */
export function formatearHoraAmPm(valor: Date | string | number): string {
  const fechaHora = aObjetoFecha(valor);
  if (!fechaYHoraSonValidos(fechaHora)) return '—';
  return normalizarEspaciosHora(formateadorHora12.format(fechaHora));
}

/** Fecha y hora en una línea (` · ` como separador). Ej.: `09/05/2026 · 03:45 PM` */
export function formatearFechaYHora(valor: Date | string | number): string {
  const fechaHora = aObjetoFecha(valor);
  if (!fechaYHoraSonValidos(fechaHora)) return '—';
  return `${formateadorFechaSolo.format(fechaHora)} · ${normalizarEspaciosHora(formateadorHora12.format(fechaHora))}`;
}

/**
 * Día local en formato `YYYY-MM-DD` para comparar con valores de `<input type="date">`.
 * No usar para presentación al usuario.
 */
export function obtenerDiaComparableDesdeValor(valor: Date | string | number): string {
  const fechaHora = aObjetoFecha(valor);
  if (!fechaYHoraSonValidos(fechaHora)) return '';
  const y = fechaHora.getFullYear();
  const mes = String(fechaHora.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaHora.getDate()).padStart(2, '0');
  return `${y}-${mes}-${dia}`;
}
