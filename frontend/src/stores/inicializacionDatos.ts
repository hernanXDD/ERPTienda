import { ref } from 'vue';
import { menusVisiblesPorDefecto } from '../modulos/usuarios/permisosUsuario';
import type { MenusVisiblesUsuario } from '../tipos/usuarioGestion';
import { useCatalogoStore } from './catalogo';
import { useClientesStore } from './clientes';
import { useCuentaCorrienteStore } from './cuentaCorriente';
import { useGestionUsuariosStore } from './gestionUsuarios';
import { useNegocioStore } from './negocio';
import { useConfiguracionSistemaStore } from './configuracionSistema';
import { useProveedoresStore } from './proveedores';
import { useRegistroComprasStore } from './registroCompras';
import { useSesionStore } from './sesion';
import { useStockStore } from './stock';
import { useVentasStore } from './ventas';

let promesaCarga: Promise<void> | null = null;
let datosMaestrosCargados = false;

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
  cuentaCorriente: 'cuentas corrientes',
};

async function cargarConRegistro(clave: keyof typeof ETIQUETAS_CARGA, promesa: Promise<unknown>): Promise<void> {
  try {
    await promesa;
  } catch {
    fallosCargaActual.value.push(ETIQUETAS_CARGA[clave]);
  }
}

const fallosCargaActual = ref<string[]>([]);

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

function armarMensajeErrorCarga(fallos: string[]): string {
  const unicos = [...new Set(fallos)];
  const lista = unicos.join(', ');
  return `No se pudieron cargar algunos datos (${lista}). Revisá la conexión con la API y usá «Reintentar carga».`;
}

/**
 * Carga datos maestros desde la API tras el login, solo para módulos visibles del operador.
 */
export async function cargarDatosMaestros(): Promise<void> {
  if (datosMaestrosCargados) return;
  if (promesaCarga) return promesaCarga;

  promesaCarga = (async () => {
    errorCargaDatosMaestros.value = null;
    fallosCargaActual.value = [];

    const menus = menusDelOperador();
    const catalogo = useCatalogoStore();
    const clientes = useClientesStore();
    const stock = useStockStore();
    const ventas = useVentasStore();
    const proveedores = useProveedoresStore();
    const compras = useRegistroComprasStore();
    const usuarios = useGestionUsuariosStore();
    const cuentaCorriente = useCuentaCorrienteStore();
    const negocio = useNegocioStore();
    const configuracionSistema = useConfiguracionSistemaStore();

    const tareas: Promise<void>[] = [];

    if (requiereAlgunoMenu(menus, ['clientes', 'ventas', 'reportes'])) {
      tareas.push(cargarConRegistro('clientes', clientes.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['productos', 'ventas', 'compras', 'stock', 'reportes'])) {
      tareas.push(cargarConRegistro('catalogo', catalogo.cargar()));
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

    if (menus.configuracion) {
      tareas.push(cargarConRegistro('configuracionSistema', configuracionSistema.cargar()));
    }

    await Promise.all(tareas);

    if (requiereAlgunoMenu(menus, ['clientes', 'ventas', 'reportes'])) {
      const idsCc = clientes.clientes
        .filter((c) => c.habilitado && c.cuentaCorrienteHabilitada)
        .map((c) => c.id);
      await Promise.all([
        cargarConRegistro('cuentaCorriente', cuentaCorriente.cargarSaldos(idsCc)),
        cargarConRegistro('cuentaCorriente', cuentaCorriente.cargarMovimientosTodos(idsCc)),
      ]);
    }

    if (fallosCargaActual.value.length > 0) {
      errorCargaDatosMaestros.value = armarMensajeErrorCarga(fallosCargaActual.value);
      return;
    }

    datosMaestrosCargados = true;
  })().finally(() => {
    promesaCarga = null;
  });

  return promesaCarga;
}

export function reiniciarEstadoCargaDatos(): void {
  promesaCarga = null;
  datosMaestrosCargados = false;
  errorCargaDatosMaestros.value = null;
  fallosCargaActual.value = [];
}

export async function reintentarCargaDatosMaestros(): Promise<void> {
  reiniciarEstadoCargaDatos();
  await cargarDatosMaestros();
}
