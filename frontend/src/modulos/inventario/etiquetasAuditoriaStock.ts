import type { TipoAuditoriaStock } from '../../tipos/stock';

export function etiquetaTipoAuditoriaStock(tipo: TipoAuditoriaStock): string {
  switch (tipo) {
    case 'venta':
      return 'Venta';
    case 'compra':
      return 'Compra';
    case 'devolucion':
      return 'Devolución';
    default:
      return 'Conteo';
  }
}
