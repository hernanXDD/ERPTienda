export type IdFormaPago =
  | 'EFECTIVO'
  | 'DEBITO'
  | 'CREDITO'
  | 'TRANSFERENCIA'
  | 'CUENTA_CORRIENTE';

export interface LineaVentaRegistro {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaRegistrada {
  id: string;
  /** Número visible en comprobantes (ej. V-00001). */
  numero: string;
  fecha: string;
  clienteId: string | null;
  nombreClienteMostrar: string;
  formaPago: IdFormaPago;
  total: number;
  lineas: LineaVentaRegistro[];
  observaciones: string;
}
