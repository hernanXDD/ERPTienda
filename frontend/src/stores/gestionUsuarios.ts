import { defineStore } from 'pinia';
import { ref } from 'vue';
import { menusVisiblesResueltos } from '../modulos/usuarios/permisosUsuario';
import { mensajeErrorHttp } from '../servicios/apiUtil';
import {
  actualizarPermisosUsuarioApi,
  actualizarUsuarioApi,
  blanquearContraseniaUsuarioApi,
  crearUsuarioApi,
  eliminarUsuarioApi,
  establecerHabilitacionUsuarioApi,
  listarUsuariosApi,
} from '../servicios/usuarios.servicio';
import type { RolUsuario } from '../tipos/sesion';
import type { PermisosOperativosUsuario, UsuarioGestion } from '../tipos/usuarioGestion';
import { useSesionStore } from './sesion';
import {
  crearSincronizadorListaRemota,
  type OpcionesCargaLista,
} from '../utilidades/sincronizacionListaRemota';

const sincronizador = crearSincronizadorListaRemota();

export interface DatosAltaUsuarioGestion {
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  contrasenaPlano: string;
  rol: RolUsuario;
  habilitado: boolean;
}

export interface DatosActualizacionUsuarioGestion {
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  contrasenaPlano: string | null;
  rol: RolUsuario;
  habilitado: boolean;
}

function normalizarNombreUsuario(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase();
}

export const useGestionUsuariosStore = defineStore('gestionUsuarios', () => {
  const usuarios = ref<UsuarioGestion[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  async function cargar(opciones?: OpcionesCargaLista): Promise<void> {
    if (sincronizado && !opciones?.forzar) return;

    await sincronizador.serializarCarga(async () => {
      if (sincronizado && !opciones?.forzar) return;

      const generacion = sincronizador.generacionAlIniciarCarga();
      cargando.value = true;
      try {
        const lista = await listarUsuariosApi();
        if (sincronizador.esRespuestaObsoleta(generacion)) return;
        usuarios.value = lista;
        sincronizado = true;
      } finally {
        if (!sincronizador.esRespuestaObsoleta(generacion)) {
          cargando.value = false;
        }
      }
    });
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  function obtenerPorId(id: string): UsuarioGestion | undefined {
    return usuarios.value.find((u) => u.id === id);
  }

  function nombreUsuarioOcupado(nombreUsuario: string, exceptoId?: string): boolean {
    const clave = normalizarNombreUsuario(nombreUsuario);
    return usuarios.value.some((u) => {
      if (exceptoId !== undefined && u.id === exceptoId) return false;
      return normalizarNombreUsuario(u.nombreUsuario) === clave;
    });
  }

  function reemplazarUsuarioEnLista(actualizado: UsuarioGestion): void {
    const idx = usuarios.value.findIndex((u) => u.id === actualizado.id);
    if (idx === -1) {
      usuarios.value = [...usuarios.value.filter((u) => u.id !== actualizado.id), actualizado];
      return;
    }
    const copia = [...usuarios.value];
    copia[idx] = actualizado;
    usuarios.value = copia;
    sincronizado = true;
  }

  async function agregarUsuario(datos: DatosAltaUsuarioGestion): Promise<true | string> {
    try {
      sincronizador.marcarMutacionLocal();
      const creado = await crearUsuarioApi(datos);
      usuarios.value = [...usuarios.value.filter((u) => u.id !== creado.id), creado];
      sincronizado = true;
      return true;
    } catch (error) {
      return mensajeErrorHttp(error, 'No se pudo crear el usuario.');
    }
  }

  async function actualizarUsuario(
    id: string,
    datos: DatosActualizacionUsuarioGestion,
  ): Promise<true | string> {
    try {
      sincronizador.marcarMutacionLocal();
      const payload: Parameters<typeof actualizarUsuarioApi>[1] = {
        nombre: datos.nombre,
        apellido: datos.apellido,
        nombreUsuario: datos.nombreUsuario,
        rol: datos.rol,
        habilitado: datos.habilitado,
      };
      if (datos.contrasenaPlano != null && datos.contrasenaPlano.length > 0) {
        payload.contrasenaPlano = datos.contrasenaPlano;
      }
      const actualizado = await actualizarUsuarioApi(id, payload);
      reemplazarUsuarioEnLista(actualizado);
      return true;
    } catch (error) {
      return mensajeErrorHttp(error, 'No se pudo actualizar el usuario.');
    }
  }

  async function actualizarPermisosUsuario(
    idUsuario: string,
    permisosActualizacion: PermisosOperativosUsuario,
  ): Promise<boolean> {
    try {
      sincronizador.marcarMutacionLocal();
      const permisos = {
        ...permisosActualizacion,
        menusVisibles: menusVisiblesResueltos(permisosActualizacion.menusVisibles),
      };
      const actualizado = await actualizarPermisosUsuarioApi(idUsuario, permisos);
      reemplazarUsuarioEnLista(actualizado);
      return true;
    } catch {
      return false;
    }
  }

  async function establecerHabilitacionUsuario(
    id: string,
    habilitadoValor: boolean,
  ): Promise<true | string> {
    try {
      sincronizador.marcarMutacionLocal();
      const actualizado = await establecerHabilitacionUsuarioApi(id, habilitadoValor);
      reemplazarUsuarioEnLista(actualizado);
      return true;
    } catch (error) {
      return mensajeErrorHttp(error, 'No se pudo cambiar el estado del usuario.');
    }
  }

  async function blanquearContraseniaUsuario(idUsuario: string): Promise<true | string> {
    try {
      sincronizador.marcarMutacionLocal();
      const actualizado = await blanquearContraseniaUsuarioApi(idUsuario);
      reemplazarUsuarioEnLista(actualizado);
      return true;
    } catch (error) {
      return mensajeErrorHttp(error, 'No se pudo blanquear la contraseña.');
    }
  }

  async function eliminarUsuario(id: string): Promise<true | string> {
    try {
      sincronizador.marcarMutacionLocal();
      await eliminarUsuarioApi(id);
      usuarios.value = usuarios.value.filter((u) => u.id !== id);
      sincronizado = true;
      return true;
    } catch (error) {
      return mensajeErrorHttp(error, 'No se pudo eliminar el usuario.');
    }
  }

  function validarOperadorPuedeBlanquearContraseniaObjetivo(idUsuarioObjetivo: string): true | string {
    const sesion = useSesionStore();
    const idOperador = sesion.usuario?.id;
    if (!idOperador) return 'No hay sesión activa.';
    const operador = usuarios.value.find((u) => u.id === idOperador);
    if (!operador) return 'Tu usuario no figura en el directorio de gestión.';
    if (operador.rol === 'ADMIN' || operador.rol === 'DUEÑO') return true;
    if (!operador.permisos.puedeBlanquearContrasenaUsuario) {
      return 'No tenés permiso para blanquear contraseñas.';
    }
    if (idUsuarioObjetivo !== idOperador) {
      return 'Con tu perfil solo podés blanquear la contraseña de tu propia cuenta.';
    }
    return true;
  }

  return {
    usuarios,
    cargando,
    cargar,
    asegurarCargado,
    obtenerPorId,
    nombreUsuarioOcupado,
    agregarUsuario,
    actualizarUsuario,
    actualizarPermisosUsuario,
    establecerHabilitacionUsuario,
    blanquearContraseniaUsuario,
    eliminarUsuario,
    validarOperadorPuedeBlanquearContraseniaObjetivo,
  };
});
