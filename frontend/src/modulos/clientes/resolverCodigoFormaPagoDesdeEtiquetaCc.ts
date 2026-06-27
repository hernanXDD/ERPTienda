import type { FormaPago } from '../../tipos/formaPago';

/** Sinónimos de etiquetas del recibo CC hacia códigos de forma de pago del sistema. */
const ALIASES_ETIQUETA_CC: Readonly<Record<string, string>> = {
  'transferencia bancaria': 'TRANSFERENCIA',
  'transferencia electrónica (cvu / alias)': 'TRANSFERENCIA',
  'tarjeta de débito': 'DEBITO',
  'tarjeta de crédito': 'CREDITO',
  'mercado pago / billetera': 'TRANSFERENCIA',
};

function normalizarEtiqueta(etiqueta: string): string {
  return etiqueta.trim().toLowerCase();
}

/** Resuelve la etiqueta del recibo de CC al código de forma de pago configurada. */
export function resolverCodigoFormaPagoDesdeEtiquetaCc(
  etiqueta: string,
  formas: FormaPago[],
): string | null {
  const normalizada = normalizarEtiqueta(etiqueta);
  if (!normalizada) return null;

  const porNombre = formas.find((f) => normalizarEtiqueta(f.nombre) === normalizada);
  if (porNombre) return porNombre.codigo;

  const alias = ALIASES_ETIQUETA_CC[normalizada];
  if (alias) return alias;

  if (normalizada === 'efectivo') return 'EFECTIVO';
  if (normalizada === 'cheque') return 'EFECTIVO';

  return null;
}
