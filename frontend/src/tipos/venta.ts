import type { RegistroOperador } from './registroOperador';
import type { IdCondicionIva } from './condicionIva';

export interface EstadoFacturacionVenta {
  id: string;
  codigo: string;
  nombre: string;
}

export type IdFormaPago = string;

export interface LineaVentaRegistro {
  id?: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  cantidadDevuelta?: number;
  cantidadDisponibleDevolver?: number;
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
  /** Documento del comprador al momento de la venta (snapshot). */
  documentoClienteMostrar: string;
  /** Condición IVA al momento de la venta (snapshot). */
  condicionIvaCliente: IdCondicionIva;
  formaPago: IdFormaPago;
  subtotal: number;
  ajusteMonto: number;
  ajustePorcentaje: number | null;
  total: number;
  /** Número de comprobante fiscal asociado. */
  facturacion: string;
  estadoFacturacion: EstadoFacturacionVenta;
  lineas: LineaVentaRegistro[];
  observaciones: string;
  registradoPor: RegistroOperador;
}

export interface ItemCargarFacturacion {
  numeroVenta: string;
  facturacion: string;
}

export const CODIGO_ESTADO_FACTURACION_FACTURADA = 'FACTURADA';

export const ESTADO_FACTURACION_PENDIENTE: EstadoFacturacionVenta = {
  id: '000001',
  codigo: 'PENDIENTE',
  nombre: 'Factura pendiente',
};
