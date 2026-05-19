import type { RolUsuario } from './sesion';

/** Módulos del menú principal (Inicio siempre visible; no se configura aquí). */
export type ClaveMenuPrincipal =
  | 'clientes'
  | 'ventas'
  | 'compras'
  | 'productos'
  | 'stock'
  | 'usuarios'
  | 'configuracion';

export type MenusVisiblesUsuario = Record<ClaveMenuPrincipal, boolean>;

/** Permisos operativos editables desde “Permisos usuario”, independientes del rol en primera aproximación. */
export interface PermisosOperativosUsuario {
  puedeAjustarStock: boolean;
  puedeRegistrarCompras: boolean;
  puedeGestionarCatalogoProductos: boolean;
  /** Alta y edición de nombre, apellido, usuario de login, rol y contraseña (salvo blanqueo explícito). */
  puedeGestionarFichasDeUsuario: boolean;
  puedeInhabilitarUsuario: boolean;
  puedeEliminarUsuario: boolean;
  /** Si es verdadero: puede blanquear solo la propia contraseña salvo rol Administrador o Dueño. */
  puedeBlanquearContrasenaUsuario: boolean;
  /** Si un ítem está en falso, el usuario no verá ese bloque en el menú ni podrá navegar a esas rutas (salvo Inicio). */
  menusVisibles: MenusVisiblesUsuario;
}

export interface UsuarioGestion {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  /** Solo para simulador local; jamás debe persistirse en texto plano en backend real. */
  contrasenaPlano: string;
  /** Si es verdadero no puede iniciar sesión hasta que un administrador asigne nueva contraseña. */
  contrasenaEstaBlanqueada: boolean;
  rol: RolUsuario;
  habilitado: boolean;
  permisos: PermisosOperativosUsuario;
}
