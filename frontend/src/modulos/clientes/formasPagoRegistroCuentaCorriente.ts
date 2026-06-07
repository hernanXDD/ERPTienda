/** Opciones de forma de cobro para el alta de pagos en cuenta corriente (recibo). */
export interface OpcionFormaPagoRegistro {
  /** Valor estable almacenado (etiqueta legible igual al mostrado). */
  etiqueta: string;
}

export const opcionesFormaPagoRegistroCuentaCorriente: OpcionFormaPagoRegistro[] = [
  { etiqueta: 'Efectivo' },
  { etiqueta: 'Transferencia bancaria' },
  { etiqueta: 'Transferencia electrónica (CVU / alias)' },
  { etiqueta: 'Cheque' },
  { etiqueta: 'Tarjeta de débito' },
  { etiqueta: 'Tarjeta de crédito' },
  { etiqueta: 'Mercado Pago / billetera' },
  { etiqueta: 'Otro' },
];
