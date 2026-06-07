import type { MovimientoStock } from '../../tipos/stock';

export function etiquetaMotivoMovimientoStock(
  movimiento: Pick<MovimientoStock, 'motivoId' | 'nombreMotivo'>,
): string {
  return movimiento.nombreMotivo?.trim() || movimiento.motivoId || '—';
}
