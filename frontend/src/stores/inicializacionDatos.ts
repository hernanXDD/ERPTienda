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

async function cargarSilencioso(promesa: Promise<unknown>): Promise<void> {
  try {
    await promesa;
  } catch {
    /* Sin permiso de lectura o error puntual: no bloquea el resto del bootstrap. */
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

/**
 * Carga datos maestros desde la API tras el login, solo para módulos visibles del operador.
 */
export async function cargarDatosMaestros(): Promise<void> {
  if (datosMaestrosCargados) return;
  if (promesaCarga) return promesaCarga;

  promesaCarga = (async () => {
    errorCargaDatosMaestros.value = null;

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
      tareas.push(cargarSilencioso(clientes.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['productos', 'ventas', 'compras', 'stock', 'reportes'])) {
      tareas.push(cargarSilencioso(catalogo.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['stock', 'ventas', 'compras', 'reportes'])) {
      tareas.push(cargarSilencioso(stock.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['ventas', 'reportes'])) {
      tareas.push(cargarSilencioso(ventas.cargarVentas()));
    }

    if (requiereAlgunoMenu(menus, ['compras', 'reportes'])) {
      tareas.push(cargarSilencioso(proveedores.cargar()));
      tareas.push(cargarSilencioso(compras.cargar()));
    }

    if (menus.usuarios) {
      tareas.push(cargarSilencioso(usuarios.cargar()));
    }

    if (requiereAlgunoMenu(menus, ['configuracion', 'reportes', 'ventas'])) {
      tareas.push(cargarSilencioso(negocio.cargar()));
    }

    if (menus.configuracion) {
      tareas.push(cargarSilencioso(configuracionSistema.cargar()));
    }

    await Promise.all(tareas);

    if (requiereAlgunoMenu(menus, ['clientes', 'ventas', 'reportes'])) {
      const idsCc = clientes.clientes
        .filter((c) => c.habilitado && c.cuentaCorrienteHabilitada)
        .map((c) => c.id);
      await Promise.all([
        cargarSilencioso(cuentaCorriente.cargarSaldos(idsCc)),
        cargarSilencioso(cuentaCorriente.cargarMovimientosTodos(idsCc)),
      ]);
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
}
