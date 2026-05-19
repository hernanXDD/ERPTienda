import { crearSemillaUsuariosGestion } from '../../datos/semillaUsuariosGestion';

import type { RolUsuario } from '../../tipos/sesion';



export interface RegistroUsuarioSimulado {

  id: string;

  nombreUsuario: string;

  contrasena: string;

  rol: RolUsuario;

}



/**

 * Lista derivada únicamente de la semilla de gestión.

 * Preferir Pinia (`useGestionUsuariosStore`) y el adaptador Axios simulador.

 */

export const usuariosSimulados: RegistroUsuarioSimulado[] =

  crearSemillaUsuariosGestion().map((u) => ({

    id: u.id,

    nombreUsuario: u.nombreUsuario,

    contrasena: u.contrasenaPlano,

    rol: u.rol,

  }));

