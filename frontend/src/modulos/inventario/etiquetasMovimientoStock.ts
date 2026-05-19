import type { MovimientoStock } from '../../tipos/stock';

export function etiquetaMotivoMovimientoStock(motivo: MovimientoStock['motivo']): string {
  switch (motivo) {
    case 'salidaPorVenta':
      return 'Salida por venta';
    case 'entradaPorCompra':
      return 'Entrada por compra';
    default:
      return 'Ajuste por conteo';
  }
}
