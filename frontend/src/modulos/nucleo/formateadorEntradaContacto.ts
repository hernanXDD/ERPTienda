import { soloDigitosEnTexto } from './validadoresContacto';

const MAX_DIGITOS_TELEFONO = 15;

/** Filtra caracteres no permitidos mientras se escribe. */
export function formatearTelefonoClienteAlEscribir(valor: string): string {
  return valor
    .normalize('NFKC')
    .replace(/[^\d+()\s.\-]/g, '')
    .slice(0, 28);
}

/**
 * Agrupa números locales argentinos habituales al salir del campo.
 * Internacional u otros formatos se dejan normalizados sin forzar máscara.
 */
export function formatearTelefonoClienteAlPerderFoco(valor: string): string {
  const limpio = formatearTelefonoClienteAlEscribir(valor).trim();
  if (!limpio) return '';

  const digitos = soloDigitosEnTexto(limpio).slice(0, MAX_DIGITOS_TELEFONO);
  if (!digitos) return limpio.replace(/\s+/g, ' ');

  if (limpio.startsWith('+') || digitos.length > 10) {
    if (digitos.startsWith('549') && digitos.length >= 12) {
      const resto = digitos.slice(3);
      return `+54 9 ${resto.slice(0, 2)} ${resto.slice(2, 6)}-${resto.slice(6, 10)}`.trim();
    }
    return limpio.replace(/\s+/g, ' ').trim();
  }

  if (digitos.length === 10) {
    return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  if (digitos.length === 8) {
    return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
  }

  return limpio.replace(/\s+/g, ' ').trim();
}

/** Sin espacios; útil mientras se escribe el correo. */
export function formatearCorreoClienteAlEscribir(valor: string): string {
  return valor.normalize('NFKC').replace(/\s/g, '').slice(0, 254);
}

export function normalizarCorreoClienteAlPerderFoco(valor: string): string {
  return formatearCorreoClienteAlEscribir(valor).trim().toLowerCase();
}

export function normalizarNombreClienteAlPerderFoco(valor: string): string {
  return valor.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function normalizarDireccionClienteAlPerderFoco(valor: string): string {
  return valor.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function normalizarLimiteCuentaCorriente(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return Math.floor(valor);
}
