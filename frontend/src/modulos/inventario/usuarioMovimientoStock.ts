import type { MovimientoStock } from '../../tipos/stock';

export function etiquetaRegistradoMovimientoStock(movimiento: MovimientoStock): string {
  return movimiento.registradoPor?.etiquetaUsuario?.trim() || '—';
}
