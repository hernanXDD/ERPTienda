import type { FormaPago } from '../tipos/formaPago';

/** Código reservado para ventas en cuenta corriente (lógica de crédito). */
export const CODIGO_FORMA_PAGO_CUENTA_CORRIENTE = 'CUENTA_CORRIENTE';

export function esFormaPagoCuentaCorriente(codigo: string): boolean {
  return codigo.trim().toUpperCase() === CODIGO_FORMA_PAGO_CUENTA_CORRIENTE;
}

/** Valores por defecto si la API aún no cargó (misma semilla que la migración). */
export const FORMAS_PAGO_SEMILLA: FormaPago[] = [
  { id: '000001', codigo: 'EFECTIVO', nombre: 'Efectivo', facturar: true, habilitado: true, orden: 1 },
  { id: '000002', codigo: 'DEBITO', nombre: 'Tarjeta débito', facturar: true, habilitado: true, orden: 2 },
  { id: '000003', codigo: 'CREDITO', nombre: 'Tarjeta crédito', facturar: true, habilitado: true, orden: 3 },
  {
    id: '000004',
    codigo: 'TRANSFERENCIA',
    nombre: 'Transferencia',
    facturar: true,
    habilitado: true,
    orden: 4,
  },
  {
    id: '000005',
    codigo: CODIGO_FORMA_PAGO_CUENTA_CORRIENTE,
    nombre: 'Cuenta corriente',
    facturar: false,
    habilitado: true,
    orden: 5,
  },
];

export function etiquetaFormaPago(codigo: string, formas: FormaPago[] = FORMAS_PAGO_SEMILLA): string {
  return formas.find((f) => f.codigo === codigo)?.nombre ?? codigo;
}

export function opcionesFormaPagoSelector(formas: FormaPago[]): { id: string; etiqueta: string }[] {
  return formas
    .filter((f) => f.habilitado)
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
    .map((f) => ({ id: f.codigo, etiqueta: f.nombre }));
}

