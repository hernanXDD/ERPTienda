/** Crédito disponible para operar (nunca negativo). */
export function calcularCreditoDisponible(limite: number, saldo: number): number {
  return Math.max(0, limite - saldo);
}

/** Saldo a favor del cliente (pagó de más o tiene crédito acumulado). */
export function saldoEsAFavor(saldo: number): boolean {
  return saldo < 0;
}

/** Deuda pendiente del cliente/proveedor. */
export function saldoTieneDeuda(saldo: number): boolean {
  return saldo > 0;
}
