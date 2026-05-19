import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CredencialesInicioSesion } from '../tipos/sesion';
import type { RolUsuario } from '../tipos/sesion';
import type { PermisosOperativosUsuario, UsuarioGestion } from '../tipos/usuarioGestion';
import {
  crearSemillaUsuariosGestion,
  menusVisiblesResueltos,
  permisosPorDefectoSegunRol,
} from '../datos/semillaUsuariosGestion';
import { useSesionStore } from './sesion';

function sesionOperadorEsDueño(): boolean {
  return useSesionStore().usuario?.rol === 'DUEÑO';
}

function dueñoIntentaGestionarAdministrador(usuarioObjetivo: UsuarioGestion): boolean {
  return sesionOperadorEsDueño() && usuarioObjetivo.rol === 'ADMIN';
}
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

function esRolConPrivilegiosDeGestionTienda(rol: RolUsuario): boolean {
  return rol === 'ADMIN' || rol === 'DUEÑO';
}

function contarElevadosHabilitadosEnLista(lista: UsuarioGestion[]): number {
  return lista.filter((u) => u.habilitado && esRolConPrivilegiosDeGestionTienda(u.rol)).length;
}

function construirListaConUsuarioReemplazado(
  lista: UsuarioGestion[],
  indice: number,
  siguiente: UsuarioGestion
): UsuarioGestion[] {
  const copia = [...lista];
  copia[indice] = siguiente;
  return copia;
}

/** Tras aplicar cambios debe quedar al menos una cuenta ADMIN o DUEÑO habilitada. */
function validarElevadosHabilitadosEnListaFutura(siguientes: UsuarioGestion[]): string | undefined {
  if (contarElevadosHabilitadosEnLista(siguientes) < 1) {
    return 'Debe quedar al menos un usuario Administrador o Dueño habilitado.';
  }
  return undefined;
}

export const useGestionUsuariosStore = defineStore('gestionUsuarios', () => {
  const usuarios = ref<UsuarioGestion[]>([...crearSemillaUsuariosGestion()]);

  /** Lectura estable para axios simulador (login y token). */
  function registrosParaSimuladorAutenticacion(): Array<{
    id: string;
    nombreUsuario: string;
    contrasena: string;
    rol: RolUsuario;
  }> {
    return usuarios.value
      .filter((u) => u.habilitado && !u.contrasenaEstaBlanqueada)
      .map((u) => ({
        id: u.id,
        nombreUsuario: u.nombreUsuario,
        contrasena: u.contrasenaPlano,
        rol: u.rol,
      }));
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

  function agregarUsuario(datos: DatosAltaUsuarioGestion): true | string {
    if (sesionOperadorEsDueño() && datos.rol === 'ADMIN') {
      return 'Un usuario Dueño no puede crear cuentas con rol Administrador.';
    }
    const nombreTrim = datos.nombre.trim();
    const apellidoTrim = datos.apellido.trim();
    if (!nombreTrim) return 'El nombre es obligatorio.';
    if (!apellidoTrim) return 'El apellido es obligatorio.';
    if (!datos.nombreUsuario.trim()) return 'El nombre de usuario es obligatorio.';
    if (!datos.contrasenaPlano) return 'La contraseña es obligatoria para el alta.';
    if (nombreUsuarioOcupado(datos.nombreUsuario)) return 'Ese nombre de usuario ya existe.';

    const nuevo: UsuarioGestion = {
      id: crypto.randomUUID(),
      nombre: nombreTrim,
      apellido: apellidoTrim,
      nombreUsuario: datos.nombreUsuario.trim(),
      contrasenaPlano: datos.contrasenaPlano,
      contrasenaEstaBlanqueada: false,
      rol: datos.rol,
      habilitado: datos.habilitado,
      permisos: permisosPorDefectoSegunRol(datos.rol),
    };

    const candidatos = [...usuarios.value, nuevo];
    const errorElevados = validarElevadosHabilitadosEnListaFutura(candidatos);
    if (errorElevados) return errorElevados;

    usuarios.value = candidatos;
    return true;
  }

  function actualizarUsuario(id: string, datos: DatosActualizacionUsuarioGestion): true | string {
    const indice = usuarios.value.findIndex((u) => u.id === id);
    if (indice === -1) return 'Usuario no encontrado.';

    const anterior = usuarios.value[indice];
    if (dueñoIntentaGestionarAdministrador(anterior)) {
      return 'No tenés permiso para modificar cuentas administradoras.';
    }

    const nombreTrim = datos.nombre.trim();
    const apellidoTrim = datos.apellido.trim();
    if (!nombreTrim) return 'El nombre es obligatorio.';
    if (!apellidoTrim) return 'El apellido es obligatorio.';
    if (!datos.nombreUsuario.trim()) return 'El nombre de usuario es obligatorio.';
    if (nombreUsuarioOcupado(datos.nombreUsuario, id)) return 'Ese nombre de usuario ya está en uso.';

    if (sesionOperadorEsDueño() && datos.rol === 'ADMIN') {
      return 'Un usuario Dueño no puede asignar el rol Administrador.';
    }

    let valorContraseniaPlano =
      datos.contrasenaPlano != null && datos.contrasenaPlano.length > 0
        ? datos.contrasenaPlano
        : anterior.contrasenaPlano;

    let marcaCredencialBlanqueada =
      anterior.contrasenaEstaBlanqueada &&
      !(datos.contrasenaPlano != null && datos.contrasenaPlano.length > 0);

    if (datos.contrasenaPlano != null && datos.contrasenaPlano.length > 0) {
      marcaCredencialBlanqueada = false;
      valorContraseniaPlano = datos.contrasenaPlano;
    }

    let permisos = anterior.permisos;
    if (anterior.rol !== datos.rol) {
      permisos = permisosPorDefectoSegunRol(datos.rol);
    }

    const siguienteUsuario: UsuarioGestion = {
      ...anterior,
      nombre: nombreTrim,
      apellido: apellidoTrim,
      nombreUsuario: datos.nombreUsuario.trim(),
      contrasenaPlano: valorContraseniaPlano,
      contrasenaEstaBlanqueada: marcaCredencialBlanqueada,
      rol: datos.rol,
      habilitado: datos.habilitado,
      permisos,
    };

    const listaFutura = construirListaConUsuarioReemplazado(
      usuarios.value,
      indice,
      siguienteUsuario
    );

    const errorElevados = validarElevadosHabilitadosEnListaFutura(listaFutura);
    if (errorElevados) return errorElevados;

    usuarios.value = listaFutura;
    return true;
  }

  function actualizarPermisosUsuario(idUsuario: string, permisosActualizacion: PermisosOperativosUsuario): boolean {
    const indice = usuarios.value.findIndex((u) => u.id === idUsuario);
    if (indice === -1) return false;
    if (dueñoIntentaGestionarAdministrador(usuarios.value[indice])) return false;
    const copia = [...usuarios.value];
    copia[indice] = {
      ...copia[indice],
      permisos: {
        ...permisosActualizacion,
        menusVisibles: menusVisiblesResueltos(permisosActualizacion.menusVisibles),
      },
    };
    usuarios.value = copia;
    return true;
  }

  /**
   * Inhabilita o rehabilita cuenta. Mantener al menos un ADMIN o Dueño habilitado.
   */
  function establecerHabilitacionUsuario(id: string, habilitadoValor: boolean): true | string {
    const indice = usuarios.value.findIndex((u) => u.id === id);
    if (indice === -1) return 'Usuario no encontrado.';

    if (dueñoIntentaGestionarAdministrador(usuarios.value[indice])) {
      return 'No tenés permiso para cambiar el estado de cuentas administradoras.';
    }

    const siguienteUsuario: UsuarioGestion = {
      ...usuarios.value[indice],
      habilitado: habilitadoValor,
    };
    const listaFutura = construirListaConUsuarioReemplazado(usuarios.value, indice, siguienteUsuario);

    const errorElevados = validarElevadosHabilitadosEnListaFutura(listaFutura);
    if (errorElevados) return errorElevados;

    usuarios.value = listaFutura;
    return true;
  }

  function validarOperadorPuedeBlanquearContraseniaObjetivo(idUsuarioObjetivo: string): true | string {
    const sesion = useSesionStore();
    const idOperador = sesion.usuario?.id;
    if (!idOperador) return 'No hay sesión activa.';

    const operador = usuarios.value.find((u) => u.id === idOperador);
    if (!operador) return 'Tu usuario no figura en el directorio de gestión.';

    if (esRolConPrivilegiosDeGestionTienda(operador.rol)) {
      return true;
    }

    if (!operador.permisos.puedeBlanquearContrasenaUsuario) {
      return 'No tenés permiso para blanquear contraseñas.';
    }

    if (idUsuarioObjetivo !== idOperador) {
      return 'Con tu perfil solo podés blanquear la contraseña de tu propia cuenta.';
    }

    return true;
  }

  function blanquearContraseniaUsuario(idUsuario: string): true | string {
    const indice = usuarios.value.findIndex((u) => u.id === idUsuario);
    if (indice === -1) return 'Usuario no encontrado.';

    if (dueñoIntentaGestionarAdministrador(usuarios.value[indice])) {
      return 'No tenés permiso para blanquear contraseñas de cuentas administradoras.';
    }

    const validacionBlanqueo = validarOperadorPuedeBlanquearContraseniaObjetivo(idUsuario);
    if (validacionBlanqueo !== true) return validacionBlanqueo;

    const copia = [...usuarios.value];
    copia[indice] = {
      ...copia[indice],
      contrasenaPlano: '',
      contrasenaEstaBlanqueada: true,
    };
    usuarios.value = copia;
    return true;
  }

  /**
   * Eliminación de ficha definitiva para el modo demo.
   */
  function eliminarUsuario(id: string): true | string {
    if (usuarios.value.length <= 1) {
      return 'No podés borrar el único usuario cargado.';
    }
    const indice = usuarios.value.findIndex((u) => u.id === id);
    if (indice === -1) return 'Usuario no encontrado.';

    if (dueñoIntentaGestionarAdministrador(usuarios.value[indice])) {
      return 'No tenés permiso para eliminar cuentas administradoras.';
    }

    const restoAntesElevados = usuarios.value.filter(
      (u) => u.id !== id && u.habilitado && esRolConPrivilegiosDeGestionTienda(u.rol)
    );
    if (restoAntesElevados.length === 0) {
      return 'Eliminar este usuario dejaría al sistema sin cuenta Administradora o Dueña habilitada.';
    }

    const nuevaLista = usuarios.value.filter((u) => u.id !== id);

    const errorElevados = validarElevadosHabilitadosEnListaFutura(nuevaLista);
    if (errorElevados) return errorElevados;

    usuarios.value = nuevaLista;
    return true;
  }

  function validarCredencialesSimulador(creds: CredencialesInicioSesion): UsuarioGestion | null {
    const nombre = creds.nombreUsuario.trim().toLowerCase();
    const encontrado = usuarios.value.find(
      (u) =>
        u.habilitado &&
        !u.contrasenaEstaBlanqueada &&
        u.nombreUsuario.toLowerCase() === nombre &&
        u.contrasenaPlano === creds.contrasena
    );
    return encontrado ?? null;
  }

  function usuarioSimulacionPorIdParaSesion(
    idUsuario: string
  ): { id: string; nombreUsuario: string; rol: RolUsuario } | null {
    const usuarioEncontrado = usuarios.value.find((x) => x.id === idUsuario);
    if (!usuarioEncontrado || !usuarioEncontrado.habilitado || usuarioEncontrado.contrasenaEstaBlanqueada)
      return null;
    return {
      id: usuarioEncontrado.id,
      nombreUsuario: usuarioEncontrado.nombreUsuario,
      rol: usuarioEncontrado.rol,
    };
  }

  return {
    usuarios,
    registrosParaSimuladorAutenticacion,
    obtenerPorId,
    nombreUsuarioOcupado,
    agregarUsuario,
    actualizarUsuario,
    actualizarPermisosUsuario,
    establecerHabilitacionUsuario,
    blanquearContraseniaUsuario,
    eliminarUsuario,
    validarCredencialesSimulador,
    usuarioSimulacionPorIdParaSesion,
  };
});
