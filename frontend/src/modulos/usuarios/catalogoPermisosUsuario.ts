import type { Component } from 'vue';
import {
  Boxes,
  LayoutGrid,
  UserCog,
} from 'lucide-vue-next';
import { elementosMenuPrincipal } from '../nucleo/elementosNavegacion';
import { ORDEN_CLAVES_MENU_PRINCIPAL } from '../nucleo/menuPrincipal';
import type { ClaveMenuPrincipal } from '../../tipos/usuarioGestion';
import type { ClavePermisoOperativo } from './permisosUsuario';

export interface DefinicionMenuPermiso {
  clave: ClaveMenuPrincipal;
  etiqueta: string;
  resumen: string;
  icono: Component;
}

export interface DefinicionPermisoOperativo {
  clave: ClavePermisoOperativo;
  etiqueta: string;
  descripcion: string;
  sensibilidad: 'normal' | 'elevada' | 'critica';
}

export interface GrupoPermisosOperativos {
  id: string;
  titulo: string;
  descripcion: string;
  icono: Component;
  permisos: DefinicionPermisoOperativo[];
}

const RESUMEN_MENU: Record<ClaveMenuPrincipal, string> = {
  clientes: 'Altas, edición y movimientos de cuenta corriente.',
  ventas: 'Centro de ventas, historial y carga de facturaciones.',
  compras: 'Proveedores y registro de compras.',
  productos: 'Catálogo, variantes y categorías.',
  stock: 'Stock actual, entradas, conteos y auditorías.',
  reportes: 'Ventas, stock, compras y facturación en PDF/Excel.',
  usuarios: 'Altas de personal y asignación de permisos.',
  configuracion: 'Datos fiscales del negocio y preferencias del sistema.',
};

export const DEFINICIONES_MENU_PERMISO: DefinicionMenuPermiso[] = ORDEN_CLAVES_MENU_PRINCIPAL.map(
  (clave) => {
    const elemento = elementosMenuPrincipal.find((el) => el.claveMenuPrincipal === clave);
    return {
      clave,
      etiqueta: elemento?.etiqueta ?? clave,
      resumen: RESUMEN_MENU[clave],
      icono: elemento?.icono ?? LayoutGrid,
    };
  },
);

export const GRUPOS_PERMISOS_OPERATIVOS: GrupoPermisosOperativos[] = [
  {
    id: 'operacion',
    titulo: 'Operación diaria',
    descripcion: 'Acciones sobre inventario, compras y catálogo dentro del ERP.',
    icono: Boxes,
    permisos: [
      {
        clave: 'puedeAjustarStock',
        etiqueta: 'Ajustes de inventario',
        descripcion: 'Entradas de mercadería, conteos físicos y correcciones de stock.',
        sensibilidad: 'normal',
      },
      {
        clave: 'puedeRegistrarCompras',
        etiqueta: 'Registro de compras',
        descripcion: 'Alta de proveedores y carga de compras contra inventario.',
        sensibilidad: 'normal',
      },
      {
        clave: 'puedeGestionarCatalogoProductos',
        etiqueta: 'Catálogo y categorías',
        descripcion: 'Crear, editar y organizar productos, variantes y rubros.',
        sensibilidad: 'normal',
      },
    ],
  },
  {
    id: 'usuarios',
    titulo: 'Administración de usuarios',
    descripcion: 'Control del directorio local de cuentas del personal.',
    icono: UserCog,
    permisos: [
      {
        clave: 'puedeGestionarFichasDeUsuario',
        etiqueta: 'Fichas de usuario',
        descripcion: 'Alta de cuentas y edición de login, rol y contraseña.',
        sensibilidad: 'elevada',
      },
      {
        clave: 'puedeInhabilitarUsuario',
        etiqueta: 'Estado de cuentas',
        descripcion: 'Inhabilitar o rehabilitar el acceso al sistema.',
        sensibilidad: 'elevada',
      },
      {
        clave: 'puedeBlanquearContrasenaUsuario',
        etiqueta: 'Blanqueo de contraseñas',
        descripcion: 'Forzar cambio de clave en el próximo acceso.',
        sensibilidad: 'elevada',
      },
      {
        clave: 'puedeEliminarUsuario',
        etiqueta: 'Eliminación de cuentas',
        descripcion: 'Quitar usuarios del directorio. Acción irreversible.',
        sensibilidad: 'critica',
      },
    ],
  },
];

export const TOTAL_PERMISOS_OPERATIVOS = GRUPOS_PERMISOS_OPERATIVOS.reduce(
  (total, grupo) => total + grupo.permisos.length,
  0,
);

export function contarPermisosOperativosActivos(
  permisos: Record<ClavePermisoOperativo, boolean>,
): number {
  return GRUPOS_PERMISOS_OPERATIVOS.reduce(
    (total, grupo) =>
      total + grupo.permisos.filter((permiso) => permisos[permiso.clave]).length,
    0,
  );
}

export function etiquetaSensibilidadPermiso(sensibilidad: DefinicionPermisoOperativo['sensibilidad']): string {
  if (sensibilidad === 'critica') return 'Crítico';
  if (sensibilidad === 'elevada') return 'Elevado';
  return 'Operativo';
}
