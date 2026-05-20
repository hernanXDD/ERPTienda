import type { Component } from 'vue';
import {
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  UserCog,
  Users,
  Warehouse,
  BarChart3,
} from 'lucide-vue-next';
import type { ClaveMenuPrincipal } from '../../tipos/usuarioGestion';

export interface SubenlaceMenu {
  nombreRuta: string;
  etiqueta: string;
}

export interface ElementoMenuPrincipal {
  /** Si falta, el ítem no depende de permisos (ej. Inicio siempre visible). */
  claveMenuPrincipal?: ClaveMenuPrincipal;
  /** Ruta por defecto (barra inferior, clic en padre si hay submenú) */
  nombreRuta: string;
  etiqueta: string;
  icono: Component;
  /** Si existe, el lateral muestra subenlaces bajo este ítem */
  subelementos?: SubenlaceMenu[];
  /** Rutas hijas que mantienen activo este ítem sin mostrarlas en el menú (ej. formulario). */
  rutasHijas?: string[];
}

export function elementoMenuCoincideRuta(
  nombreRutaActual: string | symbol | undefined,
  elemento: ElementoMenuPrincipal
): boolean {
  const nombre = typeof nombreRutaActual === 'string' ? nombreRutaActual : '';
  if (nombre === elemento.nombreRuta) return true;
  if (elemento.rutasHijas?.includes(nombre)) return true;
  return elemento.subelementos?.some((s) => s.nombreRuta === nombre) ?? false;
}

/**
 * Orden principal: inicio · clientes · ventas · compras · productos · stock · reportes · usuarios · configuración.
 */
export const elementosMenuPrincipal: ElementoMenuPrincipal[] = [
  { nombreRuta: 'inicio', etiqueta: 'Inicio', icono: LayoutDashboard },
  {
    claveMenuPrincipal: 'clientes',
    nombreRuta: 'clientes-alta',
    etiqueta: 'Clientes',
    icono: Users,
    subelementos: [
      { nombreRuta: 'clientes-alta', etiqueta: 'Alta clientes' },
      { nombreRuta: 'clientes-cuentas-corrientes', etiqueta: 'Cuentas corrientes' },
    ],
  },
  {
    claveMenuPrincipal: 'ventas',
    nombreRuta: 'ventas-centro',
    etiqueta: 'Ventas',
    icono: ShoppingCart,
    subelementos: [
      { nombreRuta: 'ventas-centro', etiqueta: 'Centro de ventas' },
      { nombreRuta: 'ventas-historial', etiqueta: 'Historial de ventas' },
    ],
  },
  {
    claveMenuPrincipal: 'compras',
    nombreRuta: 'compras-proveedores',
    etiqueta: 'Compras',
    icono: ShoppingBasket,
    subelementos: [
      { nombreRuta: 'compras-proveedores', etiqueta: 'Proveedores' },
      { nombreRuta: 'compras-registro', etiqueta: 'Registro de compras' },
    ],
  },
  {
    claveMenuPrincipal: 'productos',
    nombreRuta: 'productos-catalogo',
    etiqueta: 'Productos',
    icono: Package,
    subelementos: [
      { nombreRuta: 'productos-catalogo', etiqueta: 'Catálogo' },
      { nombreRuta: 'productos-categorias', etiqueta: 'Categorías' },
    ],
  },
  {
    claveMenuPrincipal: 'stock',
    nombreRuta: 'stock-actual',
    etiqueta: 'Stock',
    icono: Warehouse,
    subelementos: [
      { nombreRuta: 'stock-actual', etiqueta: 'Stock actual' },
      { nombreRuta: 'stock-auditorias', etiqueta: 'Auditorías de stock' },
    ],
  },
  {
    claveMenuPrincipal: 'reportes',
    nombreRuta: 'reportes-panel',
    etiqueta: 'Reportes',
    icono: BarChart3,
    subelementos: [
      { nombreRuta: 'reportes-panel', etiqueta: 'Panel de reportes' },
      { nombreRuta: 'reportes-ventas-periodo', etiqueta: 'Ventas por período' },
      { nombreRuta: 'reportes-stock-valorizado', etiqueta: 'Stock valorizado' },
      { nombreRuta: 'reportes-cuentas-corrientes', etiqueta: 'Cuentas corrientes' },
      { nombreRuta: 'reportes-compras-proveedor', etiqueta: 'Compras por proveedor' },
    ],
  },
  {
    claveMenuPrincipal: 'usuarios',
    nombreRuta: 'usuarios-alta',
    etiqueta: 'Usuarios',
    icono: UserCog,
    subelementos: [
      { nombreRuta: 'usuarios-alta', etiqueta: 'Alta usuarios' },
      { nombreRuta: 'usuarios-permisos', etiqueta: 'Permisos usuario' },
    ],
  },
  {
    claveMenuPrincipal: 'configuracion',
    nombreRuta: 'configuracion',
    etiqueta: 'Configuración',
    icono: Settings,
  },
];
