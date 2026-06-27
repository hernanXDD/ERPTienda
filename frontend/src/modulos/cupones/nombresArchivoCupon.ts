import { sanitizarNombreArchivo } from '../../utilidades/nombresArchivo';

export function sanitizarNombreArchivoCupon(nombre: string): string {
  return sanitizarNombreArchivo(nombre, 'cupon');
}

export function nombreBaseArchivoCupon(numeroCupon: string): string {
  return `Cupon_${numeroCupon.replace(/\s+/g, '_')}`;
}
