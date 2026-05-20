/** Origen registrable del cambio en la columna física disponible para ventas. */
export type MotivoMovimientoStock = 'salidaPorVenta' | 'entradaPorCompra' | 'ajustePorConteo';

export interface MovimientoStock {
  id: string;
  fecha: string;
  varianteId: string;
  /** Texto de comprobante; desnormalizado para historial sin join. */
  nombreVariante: string;
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
  varianteId: string;
  nombre: string;
  solicitado: number;
  disponible: number;
}
