import type { ClaveMenuPrincipal, MenusVisiblesUsuario } from '../../tipos/usuarioGestion';
import { elementosMenuPrincipal, type ElementoMenuPrincipal } from './elementosNavegacion';

/** Orden en pantalla «Permisos usuario» y para elegir la primera ruta accesible. */
export const ORDEN_CLAVES_MENU_PRINCIPAL: ClaveMenuPrincipal[] = [
  'clientes',
  'ventas',
  'compras',
  'productos',
  'stock',
  'reportes',
  'usuarios',
  'configuracion',
];

export const ETIQUETA_MENU_PRINCIPAL: Record<ClaveMenuPrincipal, string> = {
  clientes: 'Clientes',
  ventas: 'Ventas',
  compras: 'Compras',
  productos: 'Productos',
  stock: 'Stock',
  reportes: 'Reportes',
  usuarios: 'Usuarios',
  configuracion: 'Configuración',
};

const MAPA_NOMBRE_RUTA_MENU: Partial<Record<string, ClaveMenuPrincipal>> = {
  'clientes-alta': 'clientes',
  'clientes-cuentas-corrientes': 'clientes',
  'ventas-centro': 'ventas',
  'ventas-historial': 'ventas',
  ventas: 'ventas',
  'compras-proveedores': 'compras',
  'compras-registro': 'compras',
  'productos-catalogo': 'productos',
  'productos-categorias': 'productos',
  'stock-actual': 'stock',
  'stock-auditorias': 'stock',
  'reportes-panel': 'reportes',
  'reportes-ventas-periodo': 'reportes',
  'reportes-stock-valorizado': 'reportes',
  'reportes-cuentas-corrientes': 'reportes',
  'reportes-compras-proveedor': 'reportes',
  'usuarios-alta': 'usuarios',
  'usuarios-permisos': 'usuarios',
  configuracion: 'configuracion',
};

/** Devuelve la clave de menú asociada a la ruta, o null si no aplica (ej. Inicio). */
export function claveMenuRequeridaPorRuta(nombreRuta: string | symbol | undefined): ClaveMenuPrincipal | null {
  if (typeof nombreRuta !== 'string') return null;
  return MAPA_NOMBRE_RUTA_MENU[nombreRuta] ?? null;
}

export function elementoMenuVisibleParaPermisos(
  elemento: ElementoMenuPrincipal,
  menus: MenusVisiblesUsuario
): boolean {
  const clave = elemento.claveMenuPrincipal;
  if (!clave) return true;
  return menus[clave] !== false;
}

/** Primera entrada del menú principal que el usuario puede ver (fallback `inicio`). */
export function primeraRutaNombreSegunMenus(menus: MenusVisiblesUsuario): string {
  for (const el of elementosMenuPrincipal) {
    if (elementoMenuVisibleParaPermisos(el, menus)) {
      return el.nombreRuta;
    }
  }
  return 'inicio';
}
