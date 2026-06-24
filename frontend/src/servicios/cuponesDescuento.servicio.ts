import type { RespuestaApi } from '../tipos/api';
import type {
  CuponDescuentoCreado,
  CuponDescuentoRegistrado,
  DatosCrearCuponDescuento,
  EstadoCuponDescuento,
} from '../tipos/cuponDescuento';
import { clienteHttp } from './http';

export interface CuponDescuentoListadoApi {
  id: string;
  numero: string;
  tipoDescuento: string;
  porcentajeDescuento: number | null;
  montoDescuento: number | null;
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar: string;
  estado: string;
  devolucionId: string | null;
  numeroDevolucion: string | null;
  ventaOrigenId: string | null;
  numeroVentaOrigen: string | null;
  ventaUsadaId: string | null;
  numeroVentaUsada: string | null;
  observaciones: string;
  fecha: string;
  fechaVencimiento: string;
}

export interface CuponDescuentoCreadoApi extends CuponDescuentoListadoApi {
  codigo: string;
}

export async function listarCuponesDescuentoApi(): Promise<CuponDescuentoListadoApi[]> {
  const { data } = await clienteHttp.get<RespuestaApi<CuponDescuentoListadoApi[]>>('/cupones-descuento');
  return data.datos;
}

export async function crearCuponDescuentoApi(
  datos: DatosCrearCuponDescuento,
): Promise<CuponDescuentoCreadoApi> {
  const { data } = await clienteHttp.post<RespuestaApi<CuponDescuentoCreadoApi>>('/cupones-descuento', {
    tipoDescuento: datos.tipoDescuento,
    porcentajeDescuento: datos.porcentajeDescuento,
    montoDescuento: datos.montoDescuento,
    fechaVencimiento: datos.fechaVencimiento,
    clienteId: datos.clienteId ?? null,
    nombreClienteMostrar: datos.nombreClienteMostrar,
    documentoClienteMostrar: datos.documentoClienteMostrar?.trim() || undefined,
    devolucionId: datos.devolucionId ?? null,
    observaciones: datos.observaciones?.trim() ?? '',
  });
  return data.datos;
}

export async function validarCuponCodigoApi(
  codigo: string,
  clienteId?: string | null,
): Promise<CuponDescuentoListadoApi> {
  const { data } = await clienteHttp.post<RespuestaApi<CuponDescuentoListadoApi>>(
    '/cupones-descuento/validar-codigo',
    {
      codigo: codigo.trim(),
      clienteId: clienteId ?? null,
    },
  );
  return data.datos;
}

export async function obtenerCodigoBarrasCuponApi(id: string): Promise<string> {
  const { data } = await clienteHttp.get<RespuestaApi<{ codigo: string }>>(
    `/cupones-descuento/${id}/codigo-barras`,
  );
  return data.datos.codigo;
}

export async function anularCuponDescuentoApi(
  id: string,
  motivo?: string,
): Promise<CuponDescuentoListadoApi> {
  const { data } = await clienteHttp.patch<RespuestaApi<CuponDescuentoListadoApi>>(
    `/cupones-descuento/${id}/anular`,
    { motivo: motivo?.trim() || undefined },
  );
  return data.datos;
}

function mapearCuponBase(cupon: CuponDescuentoListadoApi): CuponDescuentoRegistrado {
  return {
    ...cupon,
    tipoDescuento: cupon.tipoDescuento as CuponDescuentoRegistrado['tipoDescuento'],
    estado: cupon.estado as EstadoCuponDescuento,
  };
}

export function mapearCuponDescuentoApi(cupon: CuponDescuentoListadoApi): CuponDescuentoRegistrado {
  return mapearCuponBase(cupon);
}

export function mapearCuponDescuentoCreadoApi(cupon: CuponDescuentoCreadoApi): CuponDescuentoCreado {
  return {
    ...mapearCuponBase(cupon),
    codigo: cupon.codigo,
  };
}
