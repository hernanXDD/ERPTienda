import { ref } from 'vue';
import { menusVisiblesPorDefecto } from '../modulos/usuarios/permisosUsuario';
import {
  esErrorDemasiadasSolicitudes,
  mensajeUsuarioDemasiadasSolicitudes,
} from '../servicios/apiUtil';
import type { MenusVisiblesUsuario } from '../tipos/usuarioGestion';
import { useCatalogoStore } from './catalogo';
import { useClientesStore } from './clientes';
import { useCuentaCorrienteStore } from './cuentaCorriente';
import { useCuentaCorrienteProveedorStore } from './cuentaCorrienteProveedor';
import { useGestionUsuariosStore } from './gestionUsuarios';
import { useNegocioStore } from './negocio';
import { useConfiguracionSistemaStore } from './configuracionSistema';
import { useFormasPagoStore } from './formasPago';
import { useTallesCatalogoStore } from './tallesCatalogo';
import { useProveedoresStore } from './proveedores';
import { useRegistroComprasStore } from './registroCompras';
import { useSesionStore } from './sesion';
import { useStockStore } from './stock';
import { useVentasStore } from './ventas';

let promesaCarga: Promise<void> | null = null;
let datosMaestrosCargados = false;
let cargaMaestrosIntentada = false;

export const errorCargaDatosMaestros = ref<string | null>(null);

const ETIQUETAS_CARGA: Record<string, string> = {
  clientes: 'clientes',
  catalogo: 'catálogo',
  stock: 'stock',
  ventas: 'ventas',
  proveedores: 'proveedores',
  compras: 'compras',
  usuarios: 'usuarios',
  negocio: 'datos del negocio',
  configuracionSistema: 'configuración del sistema',
  formasPago: 'formas de pago',
  tallesCatalogo: 'talles del catálogo',
  cuentaCorriente: 'cuentas corrientes',
  cuentaCorrienteProveedor: 'cuentas corrientes proveedores',
};

const fallosCargaActual = ref<string[]>([]);
let huboDemasiadasSolicitudesEnCarga = false;

export function armarMensajeErrorCargaMaestros(
  fallos: string[],
  demasiadasSolicitudes: boolean,
): string {
  if (demasiadasSolicitudes) {
    return mensajeUsuarioDemasiadasSolicitudes();
  }
  const unicos = [...new Set(fallos)];
  const lista = unicos.join(', ');
  return `No se pudieron cargar algunos datos (${lista}). Revisá la conexión con la API y usá «Reintentar carga».`;
}

async function cargarConRegistro(clave: keyof typeof ETIQUETAS_CARGA, promesa: Promise<unknown>): Promise<void> {
  try {
    await promesa;
  } catch (error) {
    fallosCargaActual.value.push(ETIQUETAS_CARGA[clave]);
    if (esErrorDemasiadasSolicitudes(error)) {
      huboDemasiadasSolicitudesEnCarga = true;
    }
  }
}

function menusDelOperador(): MenusVisiblesUsuario {
  const sesion = useSesionStore();
  return sesion.usuario?.permisos.menusVisibles ?? menusVisiblesPorDefecto();
}

function requiereAlgunoMenu(
  menus: MenusVisiblesUsuario,
  claves: (keyof MenusVisiblesUsuario)[],
): boolean {
  return claves.some((clave) => menus[clave] === true);
}

export interface OpcionesCargaDatosMaestros {
  /** Reintenta la carga aunque ya se haya intentado una vez (p. ej. botón «Reintentar carga»). */
  forzar?: boolean;
}

/**
 * Carga datos maestros desde la API tras el login, solo para módulos visibles del operador.
 * Los movimientos de cuenta corriente se cargan al entrar a esas pantallas (lazy).
 */
export async function cargarDatosMaestros(opciones?: OpcionesCargaDatosMaestros): Promise<void> {
  if (datosMaestrosCargados) return;
  if (cargaMaestrosIntentada && !opciones?.forzar) return;
  if (promesaCarga) return promesaCarga;

  promesaCarga = (async () => {
    errorCargaDatosMaestros.value = null;
    fallosCargaActual.value = [];
    huboDemasiadasSolicitudesEnCarga = false;

    const menus = menusDelOperador();
    const catalogo = useCatalogoStore();
    const clientes = useClientesStore();
    const stock = useStockStore();
    const ventas = useVentasStore();
    const proveedores = useProveedoresStore();
    const compras = useRegistroComprasStore();
    const usuarios = useGestionUsuariosStore();
    const cuentaCorrienteProveedor = useCuentaCorrienteProveedorStore();
    const negocio = useNegocioStore();
    const configuracionSistema = useConfiguracionSistemaStore();
    const formasPago = useFormasPagoStore();
    const tallesCatalogo = useTallesCatalogoStore();

    const tareas: Promise<void>[] = [];

    if (requiereAlgunoMenu(menus, ['clientes', 'ventas', 'reportes'])) {
      tareas.push(cargarConRegistro('clientes', clientes.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['productos', 'ventas', 'compras', 'stock', 'reportes'])) {
      tareas.push(cargarConRegistro('catalogo', catalogo.cargar()));
      tareas.push(cargarConRegistro('tallesCatalogo', tallesCatalogo.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['stock', 'ventas', 'compras', 'reportes'])) {
      tareas.push(cargarConRegistro('stock', stock.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['ventas', 'reportes'])) {
      tareas.push(cargarConRegistro('ventas', ventas.cargarVentas()));
    }

    if (requiereAlgunoMenu(menus, ['compras', 'reportes'])) {
      tareas.push(cargarConRegistro('proveedores', proveedores.cargar()));
      tareas.push(cargarConRegistro('compras', compras.cargar()));
    }

    if (menus.usuarios) {
      tareas.push(cargarConRegistro('usuarios', usuarios.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['configuracion', 'reportes', 'ventas'])) {
      tareas.push(cargarConRegistro('negocio', negocio.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['ventas', 'reportes', 'configuracion', 'compras', 'clientes'])) {
      tareas.push(cargarConRegistro('formasPago', formasPago.cargar()));
    }

    if (
      requiereAlgunoMenu(menus, [
        'configuracion',
        'ventas',
        'reportes',
        'stock',
        'clientes',
        'usuarios',
      ])
    ) {
      tareas.push(cargarConRegistro('configuracionSistema', configuracionSistema.cargar()));
    }

    await Promise.all(tareas);

    if (requiereAlgunoMenu(menus, ['clientes', 'ventas', 'reportes'])) {
      const idsCc = clientes.clientes
        .filter((c) => c.habilitado && c.cuentaCorrienteHabilitada)
        .map((c) => c.id);
      const cuentaCorriente = useCuentaCorrienteStore();
      await cargarConRegistro('cuentaCorriente', cuentaCorriente.cargarSaldos(idsCc));
    }

    if (requiereAlgunoMenu(menus, ['compras', 'reportes'])) {
      const idsCcProv = proveedores.proveedores
        .filter((p) => p.habilitado && p.comprasCreditoHabilitadas)
        .map((p) => p.id);
      await cargarConRegistro(
        'cuentaCorrienteProveedor',
        cuentaCorrienteProveedor.cargarSaldos(idsCcProv),
      );
    }

    if (fallosCargaActual.value.length > 0) {
      errorCargaDatosMaestros.value = armarMensajeErrorCargaMaestros(
        fallosCargaActual.value,
        huboDemasiadasSolicitudesEnCarga,
      );
      return;
    }

    datosMaestrosCargados = true;
  })().finally(() => {
    cargaMaestrosIntentada = true;
    promesaCarga = null;
  });

  return promesaCarga;
}

export function reiniciarEstadoCargaDatos(): void {
  promesaCarga = null;
  datosMaestrosCargados = false;
  cargaMaestrosIntentada = false;
  errorCargaDatosMaestros.value = null;
  fallosCargaActual.value = [];
  huboDemasiadasSolicitudesEnCarga = false;
}

export async function reintentarCargaDatosMaestros(): Promise<void> {
  reiniciarEstadoCargaDatos();
  await cargarDatosMaestros({ forzar: true });
}
