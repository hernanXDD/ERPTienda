import type { RespuestaApi } from '../tipos/api';
import type {
  ConfiguracionSistemaRegistro,
  DatosConfiguracionSistemaEditable,
} from '../tipos/configuracionSistema';
import { clienteHttp } from './http';

export async function obtenerConfiguracionSistemaApi(): Promise<ConfiguracionSistemaRegistro> {
  const { data } = await clienteHttp.get<RespuestaApi<ConfiguracionSistemaRegistro>>(
    '/configuracion/sistema',
  );
  return data.datos;
}

export async function actualizarConfiguracionSistemaApi(
  datos: DatosConfiguracionSistemaEditable,
): Promise<ConfiguracionSistemaRegistro> {
  const { data } = await clienteHttp.patch<RespuestaApi<ConfiguracionSistemaRegistro>>(
    '/configuracion/sistema',
    datos,
  );
  return data.datos;
}
