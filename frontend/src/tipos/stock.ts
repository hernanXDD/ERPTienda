/** Origen registrable del cambio en la columna física disponible para ventas. */
export type MotivoMovimientoStock = 'salidaPorVenta' | 'entradaPorCompra' | 'ajustePorConteo';

export interface MovimientoStock {
  id: string;
  fecha: string;
  productoId: string;
  nombreProducto: string;
  motivo: MotivoMovimientoStock;
  /** Variación aplicada (+ entra inventario / − sale inventario respecto del estado anterior). */
  cantidadVariacion: number;
  stockResultante: number;
  idVenta?: string | null;
  numeroVenta?: string | null;
  nota?: string | null;
  ejecutadoPorUsuario?: string | null;
}

export interface FaltaStockLinea {
  productoId: string;
  nombre: string;
  solicitado: number;
  disponible: number;
}
