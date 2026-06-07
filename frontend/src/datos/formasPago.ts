import type { IdFormaPago } from '../tipos/venta';

export const FORMAS_PAGO: { id: IdFormaPago; etiqueta: string }[] = [
  { id: 'EFECTIVO', etiqueta: 'Efectivo' },
  { id: 'DEBITO', etiqueta: 'Tarjeta débito' },
  { id: 'CREDITO', etiqueta: 'Tarjeta crédito' },
  { id: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { id: 'CUENTA_CORRIENTE', etiqueta: 'Cuenta corriente' },
];

export function etiquetaFormaPago(id: IdFormaPago): string {
  return FORMAS_PAGO.find((f) => f.id === id)?.etiqueta ?? id;
}
