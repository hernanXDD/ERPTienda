import type { IdCondicionIva } from '../tipos/condicionIva';
import type { EstadoFacturacionVenta } from '../tipos/venta';

export const CONDICIONES_IVA: { id: IdCondicionIva; etiqueta: string }[] = [
  { id: 'CONSUMIDOR_FINAL', etiqueta: 'Consumidor final' },
  { id: 'RESPONSABLE_INSCRIPTO', etiqueta: 'Responsable inscripto' },
  { id: 'MONOTRIBUTO', etiqueta: 'Monotributo' },
  { id: 'EXENTO', etiqueta: 'Exento' },
  { id: 'NO_RESPONSABLE', etiqueta: 'No responsable' },
];

export function etiquetaCondicionIva(id: IdCondicionIva | string): string {
  return CONDICIONES_IVA.find((c) => c.id === id)?.etiqueta ?? String(id);
}

export function etiquetaEstadoFacturacion(
  estado: EstadoFacturacionVenta | Pick<EstadoFacturacionVenta, 'codigo' | 'nombre'> | string,
): string {
  if (typeof estado === 'string') {
    if (estado === 'FACTURADA') return 'Facturada';
    if (estado === 'PENDIENTE') return 'Factura pendiente';
    return estado;
  }
  return estado.nombre;
}

/** Moneda operativa del sistema (Argentina). */
export const MONEDA_OPERATIVA = 'ARS';

export const NOMBRE_ESTADO_FACTURACION_FACTURADA = 'Facturada';
