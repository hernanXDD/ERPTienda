import type { RegistroOperador } from './registroOperador';

/** Tipo de auditoría agrupada en el historial de stock. */
export type TipoAuditoriaStock = 'venta' | 'compra' | 'conteo' | 'devolucion';

export interface MovimientoStock {
  id: string;
  fecha: string;
  varianteId: string;
  /** Texto de comprobante; desnormalizado para historial sin join. */
  nombreVariante: string;
  /** FK a tabla motivo. */
  motivoId: string;
  /** Etiqueta legible del motivo (desde tabla motivo). */
  nombreMotivo: string;
  /** Variación aplicada (+ entra inventario / − sale inventario respecto del estado anterior). */
  cantidadVariacion: number;
  stockResultante: number;
  idVenta?: string | null;
  numeroVenta?: string | null;
  nota?: string | null;
  registradoPor?: RegistroOperador;
}

export interface FaltaStockLinea {
  varianteId: string;
  nombre: string;
  solicitado: number;
  disponible: number;
}

export interface AuditoriaStockResumen {
  id: string;
  tipo: TipoAuditoriaStock;
  fecha: string;
  titulo: string;
  referencia: string | null;
  nota: string | null;
  cantidadMovimientos: number;
  variacionNeta: number;
  registradoPor: RegistroOperador;
}

export interface AuditoriaStockDetalle extends AuditoriaStockResumen {
  movimientos: MovimientoStock[];
}

export interface FiltrosAuditoriasStock {
  tipo?: TipoAuditoriaStock;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
}
