import type { RespuestaApi } from '../tipos/api';
import type { MovimientoCuentaCorriente } from '../tipos/cuentaCorriente';
import { clienteHttp } from './http';

export interface MovimientoConSaldoApi extends MovimientoCuentaCorriente {
  saldoTrasMovimiento: number;
}

export async function listarMovimientosCuentaCorrienteApi(
  clienteId: string,
): Promise<MovimientoConSaldoApi[]> {
  const { data } = await clienteHttp.get<RespuestaApi<MovimientoConSaldoApi[]>>(
    `/clientes/${clienteId}/cuenta-corriente/movimientos`,
  );
  return data.datos;
}

export async function obtenerSaldoCuentaCorrienteApi(clienteId: string): Promise<number> {
  const { data } = await clienteHttp.get<RespuestaApi<{ saldo: number }>>(
    `/clientes/${clienteId}/cuenta-corriente/saldo`,
  );
  return data.datos.saldo;
}

export async function registrarPagoCuentaCorrienteApi(
  clienteId: string,
  datos: {
    importe: number;
    descripcion?: string;
    formaDePagoEtiqueta: string;
    referenciaDelPagoOpcional?: string | null;
  },
): Promise<MovimientoCuentaCorriente> {
  const { data } = await clienteHttp.post<RespuestaApi<MovimientoCuentaCorriente>>(
    `/clientes/${clienteId}/cuenta-corriente/pago`,
    {
      importe: datos.importe,
      descripcion: datos.descripcion?.trim() || undefined,
      formaDePagoEtiqueta: datos.formaDePagoEtiqueta,
      referenciaDelPagoOpcional: datos.referenciaDelPagoOpcional?.trim() || undefined,
    },
  );
  return data.datos;
}
