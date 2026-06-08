import type { ClaveMenuPrincipal } from '../tipos/permisos-usuario';

/** Lectura de clientes / CC: ventas y reportes también consumen clientes. */
export const MENUS_LECTURA_CLIENTES: ClaveMenuPrincipal[] = ['clientes', 'ventas', 'reportes'];

/** Catálogo compartido por ventas, compras, stock y reportes. */
export const MENUS_LECTURA_CATALOGO: ClaveMenuPrincipal[] = [
  'productos',
  'ventas',
  'compras',
  'stock',
  'reportes',
];

export const MENUS_LECTURA_CATEGORIAS: ClaveMenuPrincipal[] = [
  'productos',
  'ventas',
  'compras',
  'reportes',
];

/** Stock operativo y consultas cruzadas. */
export const MENUS_LECTURA_STOCK: ClaveMenuPrincipal[] = ['stock', 'ventas', 'compras', 'reportes'];

export const MENUS_LECTURA_VENTAS: ClaveMenuPrincipal[] = ['ventas', 'reportes'];

export const MENUS_LECTURA_COMPRAS: ClaveMenuPrincipal[] = ['compras', 'reportes'];

export const MENUS_LECTURA_PROVEEDORES: ClaveMenuPrincipal[] = ['compras', 'reportes'];

export const MENUS_LECTURA_NEGOCIO: ClaveMenuPrincipal[] = ['configuracion', 'reportes', 'ventas'];
