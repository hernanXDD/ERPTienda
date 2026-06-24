import type { CuponDescuentoRegistrado, EstadoCuponDescuento } from '../tipos/cuponDescuento';
import { cuponEstaVencido } from '../tipos/cuponDescuento';

const ETIQUETAS: Record<EstadoCuponDescuento, string> = {
  activo: 'Activo',
  usado: 'Usado',
  anulado: 'Anulado',
};

export function etiquetaEstadoCupon(
  estado: string,
  cupon?: Pick<CuponDescuentoRegistrado, 'fechaVencimiento' | 'estado'>,
): string {
  if (cupon && cuponEstaVencido(cupon)) return 'Vencido';
  return ETIQUETAS[estado as EstadoCuponDescuento] ?? estado;
}

export function claseChipEstadoCupon(
  estado: string,
  cupon?: Pick<CuponDescuentoRegistrado, 'fechaVencimiento' | 'estado'>,
): string {
  if (cupon && cuponEstaVencido(cupon)) return 'cup-chip cup-chip--vencido';
  return `cup-chip cup-chip--${estado.toLowerCase()}`;
}
