/** IDs fijos de la tabla motivo (catálogo de movimientos de stock). */
export const ID_MOTIVO_SALIDA_VENTA = '000001';
export const ID_MOTIVO_ENTRADA_COMPRA = '000002';
export const ID_MOTIVO_AJUSTE_CONTEO = '000003';
export const ID_MOTIVO_ENTRADA_DEVOLUCION = '000004';

export type IdMotivoStock =
  | typeof ID_MOTIVO_SALIDA_VENTA
  | typeof ID_MOTIVO_ENTRADA_COMPRA
  | typeof ID_MOTIVO_AJUSTE_CONTEO
  | typeof ID_MOTIVO_ENTRADA_DEVOLUCION;

export const IDS_MOTIVO_STOCK: readonly IdMotivoStock[] = [
  ID_MOTIVO_SALIDA_VENTA,
  ID_MOTIVO_ENTRADA_COMPRA,
  ID_MOTIVO_AJUSTE_CONTEO,
  ID_MOTIVO_ENTRADA_DEVOLUCION,
];

export function esIdMotivoStock(valor: string): valor is IdMotivoStock {
  return (IDS_MOTIVO_STOCK as readonly string[]).includes(valor);
}
