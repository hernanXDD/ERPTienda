/** Condición frente al IVA del cliente (Argentina). */
export type IdCondicionIva =
  | 'CONSUMIDOR_FINAL'
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'EXENTO'
  | 'NO_RESPONSABLE';

export const CONDICION_IVA_POR_DEFECTO: IdCondicionIva = 'CONSUMIDOR_FINAL';
