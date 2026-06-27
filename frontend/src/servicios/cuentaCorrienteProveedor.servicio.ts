import type { RespuestaApi } from '../tipos/api';
import type { MovimientoCuentaCorrienteProveedor } from '../tipos/cuentaCorrienteProveedor';
import { clienteHttp } from './http';

export interface MovimientoConSaldoProveedorApi extends MovimientoCuentaCorrienteProveedor {
  saldoTrasMovimiento: number;
}

export async function listarMovimientosCuentaCorrienteProveedorApi(
  proveedorId: string,
): Promise<MovimientoConSaldoProveedorApi[]> {
  const { data } = await clienteHttp.get<RespuestaApi<MovimientoConSaldoProveedorApi[]>>(
    `/proveedores/${proveedorId}/cuenta-corriente/movimientos`,
  );
  return data.datos;
}

export async function obtenerSaldoCuentaCorrienteProveedorApi(proveedorId: string): Promise<number> {
  const { data } = await clienteHttp.get<RespuestaApi<{ saldo: number }>>(
    `/proveedores/${proveedorId}/cuenta-corriente/saldo`,
  );
  return data.datos.saldo;
}

export async function registrarPagoCuentaCorrienteProveedorApi(
  proveedorId: string,
  datos: {
    importe: number;
    descripcion?: string;
    formaDePagoEtiqueta: string;
    referenciaDelPagoOpcional?: string | null;
  },
): Promise<MovimientoCuentaCorrienteProveedor> {
  const { data } = await clienteHttp.post<RespuestaApi<MovimientoCuentaCorrienteProveedor>>(
    `/proveedores/${proveedorId}/cuenta-corriente/pago`,
    {
      importe: datos.importe,
      descripcion: datos.descripcion?.trim() || undefined,
      formaDePagoEtiqueta: datos.formaDePagoEtiqueta,
      referenciaDelPagoOpcional: datos.referenciaDelPagoOpcional?.trim() || undefined,
    },
  );
  return data.datos;
}

export async function registrarMovimientoManualCuentaCorrienteProveedorApi(
  proveedorId: string,
  datos: {
    tipoMovimiento: 'cargo' | 'pagoRegistrado';
    importe: number;
    descripcion: string;
  },
): Promise<MovimientoCuentaCorrienteProveedor> {
  const { data } = await clienteHttp.post<RespuestaApi<MovimientoCuentaCorrienteProveedor>>(
    `/proveedores/${proveedorId}/cuenta-corriente/movimiento-manual`,
    datos,
  );
  return data.datos;
}
