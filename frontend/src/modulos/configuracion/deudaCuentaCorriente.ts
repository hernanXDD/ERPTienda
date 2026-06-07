import type { Cliente } from '../../tipos/cliente';
import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';

function diasEntre(fechaIso: string, referencia: Date = new Date()): number {
  const ms = referencia.getTime() - new Date(fechaIso).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

/** Saldo deudor y plazo vencido desde el último cargo en cuenta corriente. */
export function clienteConsideradoEnDeuda(
  saldo: number,
  movimientosCliente: MovimientoCuentaCorriente[],
  diasUmbral: number,
  referencia: Date = new Date(),
): boolean {
  if (saldo <= 0) return false;

  const ultimoCargo = movimientosCliente
    .filter((m) => m.tipoMovimiento === 'cargo')
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

  if (!ultimoCargo) return true;

  return diasEntre(ultimoCargo.fecha, referencia) >= diasUmbral;
}

export function contarClientesEnDeudaPorPlazo(
  clientes: Cliente[],
  diasUmbral: number,
  saldoCliente: (clienteId: string) => number,
  movimientosCliente: (clienteId: string) => MovimientoCuentaCorriente[],
): number {
  return clientes.filter((cliente) => {
    if (!cliente.habilitado || !cliente.cuentaCorrienteHabilitada) return false;
    const saldo = saldoCliente(cliente.id);
    return clienteConsideradoEnDeuda(saldo, movimientosCliente(cliente.id), diasUmbral);
  }).length;
}
