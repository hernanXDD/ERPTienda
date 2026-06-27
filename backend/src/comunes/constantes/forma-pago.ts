/** Código de forma de pago con cuenta corriente (lógica de crédito en ventas). */
export const CODIGO_FORMA_PAGO_CUENTA_CORRIENTE = 'CUENTA_CORRIENTE';

export function esFormaPagoCuentaCorriente(codigo: string): boolean {
  return codigo.trim().toUpperCase() === CODIGO_FORMA_PAGO_CUENTA_CORRIENTE;
}

/** Genera un código interno estable a partir del nombre (ej. «Mercado Pago» → MERCADO_PAGO). */
export function normalizarCodigoFormaPagoDesdeNombre(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

  return base.length >= 2 ? base : 'FORMA_PAGO';
}
