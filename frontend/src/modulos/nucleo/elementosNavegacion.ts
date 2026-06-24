import type { Component } from 'vue';
import {
  LayoutDashboard,
  Package,
  Settings,
  Settings2,
  ShoppingBasket,
  ShoppingCart,
  UserCog,
  Users,
  Warehouse,
  BarChart3,
} from 'lucide-vue-next';
import type { ClaveMenuPrincipal } from '../../tipos/usuarioGestion';
import { catalogoReportes } from '../reportes/catalogoReportes';
import { DESCRIPCIONES_PAGINA } from './descripcionesPaginas';

export interface SubenlaceMenu {
  nombreRuta: string;
  etiqueta: string;
  descripcion: string;
}

export interface ElementoMenuPrincipal {
  /** Si falta, el ítem no depende de permisos (ej. Inicio siempre visible). */
  claveMenuPrincipal?: ClaveMenuPrincipal;
  /** Visible únicamente para la cuenta de configuración de app (admin principal). */
  accesoExclusivoConfiguracionApp?: boolean;
  /** Ruta por defecto (barra inferior, clic en padre si hay submenú) */
  nombreRuta: string;
  etiqueta: string;
  descripcion?: string;
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

function subenlace(nombreRuta: string, etiqueta: string): SubenlaceMenu {
  return {
    nombreRuta,
    etiqueta,
    descripcion: DESCRIPCIONES_PAGINA[nombreRuta] ?? '',
  };
}

/**
 * Orden principal: inicio · clientes · ventas · compras · productos · stock · reportes · usuarios · configuración · configuración de la app.
 */
export const elementosMenuPrincipal: ElementoMenuPrincipal[] = [
  {
    nombreRuta: 'inicio',
    etiqueta: 'Inicio',
    descripcion: DESCRIPCIONES_PAGINA.inicio,
    icono: LayoutDashboard,
  },
  {
    claveMenuPrincipal: 'clientes',
    nombreRuta: 'clientes-alta',
    etiqueta: 'Clientes',
    descripcion: DESCRIPCIONES_PAGINA['clientes-alta'],
    icono: Users,
    subelementos: [
      subenlace('clientes-alta', 'Alta clientes'),
      subenlace('clientes-cuentas-corrientes', 'Cuentas corrientes'),
    ],
  },
  {
    claveMenuPrincipal: 'ventas',
    nombreRuta: 'ventas-centro',
    etiqueta: 'Ventas',
    descripcion: DESCRIPCIONES_PAGINA['ventas-centro'],
    icono: ShoppingCart,
    subelementos: [
      subenlace('ventas-centro', 'Centro de ventas'),
      subenlace('ventas-devoluciones', 'Devoluciones'),
      subenlace('ventas-cupones', 'Cupones'),
      subenlace('ventas-historial', 'Historial de ventas'),
    ],
  },
  {
    claveMenuPrincipal: 'compras',
    nombreRuta: 'compras-proveedores',
    etiqueta: 'Compras',
    descripcion: DESCRIPCIONES_PAGINA['compras-proveedores'],
    icono: ShoppingBasket,
    subelementos: [
      subenlace('compras-proveedores', 'Proveedores'),
      subenlace('compras-registro', 'Registro de compras'),
      subenlace('compras-cuentas-corrientes-proveedor', 'Cuentas corrientes'),
    ],
  },
  {
    claveMenuPrincipal: 'productos',
    nombreRuta: 'productos-catalogo',
    etiqueta: 'Productos',
    descripcion: DESCRIPCIONES_PAGINA['productos-catalogo'],
    icono: Package,
    subelementos: [
      subenlace('productos-catalogo', 'Catálogo'),
      subenlace('productos-categorias', 'Categorías'),
    ],
  },
  {
    claveMenuPrincipal: 'stock',
    nombreRuta: 'stock-actual',
    etiqueta: 'Stock',
    descripcion: DESCRIPCIONES_PAGINA['stock-actual'],
    icono: Warehouse,
    subelementos: [
      subenlace('stock-actual', 'Stock actual'),
      subenlace('stock-auditorias', 'Auditorías de stock'),
    ],
  },
  {
    claveMenuPrincipal: 'reportes',
    nombreRuta: 'reportes-panel',
    etiqueta: 'Reportes',
    descripcion: DESCRIPCIONES_PAGINA['reportes-panel'],
    icono: BarChart3,
    rutasHijas: catalogoReportes.filter((r) => r.disponible).map((r) => r.nombreRuta),
  },
  {
    claveMenuPrincipal: 'usuarios',
    nombreRuta: 'usuarios-alta',
    etiqueta: 'Usuarios',
    descripcion: DESCRIPCIONES_PAGINA['usuarios-alta'],
    icono: UserCog,
    subelementos: [
      subenlace('usuarios-alta', 'Alta usuarios'),
      subenlace('usuarios-permisos', 'Permisos usuario'),
    ],
  },
  {
    claveMenuPrincipal: 'configuracion',
    nombreRuta: 'configuracion-negocio',
    etiqueta: 'Configuración',
    descripcion: DESCRIPCIONES_PAGINA['configuracion-negocio'],
    icono: Settings,
    subelementos: [
      subenlace('configuracion-negocio', 'Negocio'),
      subenlace('configuracion-sistema', 'Sistema'),
    ],
  },
  {
    accesoExclusivoConfiguracionApp: true,
    nombreRuta: 'configuracion-app',
    etiqueta: 'Configuración de la app',
    descripcion: DESCRIPCIONES_PAGINA['configuracion-app'],
    icono: Settings2,
  },
];
