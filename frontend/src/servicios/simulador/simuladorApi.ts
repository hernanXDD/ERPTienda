import { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { getActivePinia } from 'pinia';
import type { RespuestaInicioSesion, RespuestaSesionActual } from '../../tipos/api';
import type { CredencialesInicioSesion } from '../../tipos/sesion';
import { crearSemillaUsuariosGestion } from '../../datos/semillaUsuariosGestion';
import { useGestionUsuariosStore } from '../../stores/gestionUsuarios';

function obtenerRutaSolicitud(config: InternalAxiosRequestConfig): string {
  const base = (config.baseURL ?? '').replace(/\/$/, '');
  const rel = config.url ?? '';
  const parte = rel.startsWith('/') ? rel : `/${rel}`;
  return `${base}${parte}`.replace(/\/{2,}/g, '/') || '/';
}

/**
 * Axios puede pasar al adaptador `data` ya como string JSON (no como objeto).
 * Sin esto, el simulador no lee credenciales y siempre responde 401.
 */
function obtenerCuerpoJson<T>(config: InternalAxiosRequestConfig): T | undefined {
  const crudo = config.data;
  if (crudo == null || crudo === '') return undefined;
  if (typeof crudo === 'string') {
    try {
      return JSON.parse(crudo) as T;
    } catch {
      return undefined;
    }
  }
  return crudo as T;
}

function obtenerCabeceraAutorizacion(config: InternalAxiosRequestConfig): string | undefined {
  const cabeceras = AxiosHeaders.from(config.headers ?? {});
  const valor = cabeceras.get('Authorization');
  return typeof valor === 'string' ? valor : undefined;
}

function crearRespuestaAxios<T>(datos: T, config: InternalAxiosRequestConfig, estado: number = 200): AxiosResponse<T> {
  return {
    data: datos,
    status: estado,
    statusText: estado === 200 ? 'OK' : 'Error',
    headers: new AxiosHeaders(),
    config,
  };
}

function decodificarTokenPayload(token: string): { idUsuario: string } | null {
  try {
    const carga = token.split('.')[1];
    if (!carga) return null;
    const json = globalThis.atob(carga);
    return JSON.parse(json) as { idUsuario: string };
  } catch {
    return null;
  }
}

function emitirTokenSimulado(idUsuario: string): string {
  const cabecera = globalThis.btoa(JSON.stringify({ alg: 'sim', typ: 'JWT' }));
  const carga = globalThis.btoa(JSON.stringify({ idUsuario }));
  const firma = globalThis.btoa('simulador');
  return `${cabecera}.${carga}.${firma}`;
}

function obtenerGestionUsuarioActiva(): ReturnType<typeof useGestionUsuariosStore> | null {
  const pinia = getActivePinia();
  if (!pinia) return null;
  return useGestionUsuariosStore(pinia);
}

function registrosCredencialesRespaldo() {
  return crearSemillaUsuariosGestion()
    .filter((u) => u.habilitado && !u.contrasenaEstaBlanqueada)
    .map((u) => ({
      id: u.id,
      nombreUsuario: u.nombreUsuario,
      contrasena: u.contrasenaPlano,
      rol: u.rol,
      habilitado: u.habilitado,
    }));
}

export function obtenerUsuarioDesdeCabeceraAutorizacion(
  autorizacion: string | undefined
): RespuestaSesionActual['usuario'] | null {
  if (!autorizacion?.startsWith('Bearer ')) return null;
  const token = autorizacion.slice('Bearer '.length).trim();
  const payload = decodificarTokenPayload(token);
  if (!payload) return null;
  const gestion = obtenerGestionUsuarioActiva();
  if (gestion) {
    return gestion.usuarioSimulacionPorIdParaSesion(payload.idUsuario);
  }
  const registro = registrosCredencialesRespaldo().find(
    (u) => u.id === payload.idUsuario && u.habilitado
  );
  if (!registro) return null;
  return {
    id: registro.id,
    nombreUsuario: registro.nombreUsuario,
    rol: registro.rol,
  };
}

export async function manejarPeticionSimulada(
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse> {
  const metodo = (config.method ?? 'get').toLowerCase();
  const ruta = obtenerRutaSolicitud(config);

  if (metodo === 'post' && ruta.endsWith('/autenticacion/inicio-sesion')) {
    const cuerpo = obtenerCuerpoJson<CredencialesInicioSesion>(config);
    const nombre = cuerpo?.nombreUsuario?.trim().toLowerCase() ?? '';
    const contrasena = cuerpo?.contrasena ?? '';
    let registroOk: {
      id: string;
      nombreUsuario: string;
      rol: RespuestaSesionActual['usuario']['rol'];
    } | null = null;

    const gestion = obtenerGestionUsuarioActiva();
    if (gestion) {
      const creds: CredencialesInicioSesion = {
        nombreUsuario: nombre || (cuerpo?.nombreUsuario ?? ''),
        contrasena,
      };
      const u = gestion.validarCredencialesSimulador(creds);
      if (u) {
        registroOk = {
          id: u.id,
          nombreUsuario: u.nombreUsuario,
          rol: u.rol,
        };
      }
    } else {
      const coincidencia = registrosCredencialesRespaldo().find(
        (u) => u.nombreUsuario.toLowerCase() === nombre && u.contrasena === contrasena && u.habilitado
      );
      if (coincidencia) {
        registroOk = {
          id: coincidencia.id,
          nombreUsuario: coincidencia.nombreUsuario,
          rol: coincidencia.rol,
        };
      }
    }

    if (!registroOk) {
      return crearRespuestaAxios(
        { mensaje: 'Usuario o contraseña incorrectos.' },
        config,
        401
      );
    }
    const respuesta: RespuestaInicioSesion = {
      accessToken: emitirTokenSimulado(registroOk.id),
      usuario: {
        id: registroOk.id,
        nombreUsuario: registroOk.nombreUsuario,
        rol: registroOk.rol,
      },
    };
    return crearRespuestaAxios(respuesta, config, 200);
  }

  if (metodo === 'get' && ruta.endsWith('/autenticacion/sesion-actual')) {
    const autorizacion = obtenerCabeceraAutorizacion(config);
    const usuario = obtenerUsuarioDesdeCabeceraAutorizacion(autorizacion);
    if (!usuario) {
      return crearRespuestaAxios({ mensaje: 'No autenticado.' }, config, 401);
    }
    const datos: RespuestaSesionActual = { usuario };
    return crearRespuestaAxios(datos, config, 200);
  }

  if (metodo === 'post' && ruta.endsWith('/autenticacion/cierre-sesion')) {
    return crearRespuestaAxios({ ok: true }, config, 200);
  }

  return crearRespuestaAxios(
    { mensaje: `Ruta simulada no implementada: ${metodo.toUpperCase()} ${ruta}` },
    config,
    404
  );
}
