import { useCatalogoStore } from './catalogo';
import { useClientesStore } from './clientes';
import { useCuentaCorrienteStore } from './cuentaCorriente';
import { useGestionUsuariosStore } from './gestionUsuarios';
import { useNegocioStore } from './negocio';
import { useConfiguracionSistemaStore } from './configuracionSistema';
import { useProveedoresStore } from './proveedores';
import { useRegistroComprasStore } from './registroCompras';
import { useStockStore } from './stock';
import { useVentasStore } from './ventas';

let promesaCarga: Promise<void> | null = null;
let datosMaestrosCargados = false;

/**
 * Carga datos maestros desde la API tras el login.
 * Pinia actúa como caché en memoria; la fuente de verdad es la base de datos.
 */
export async function cargarDatosMaestros(): Promise<void> {
  if (datosMaestrosCargados) return;
  if (promesaCarga) return promesaCarga;

  promesaCarga = (async () => {
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

    await Promise.all([
      catalogo.cargar(),
      clientes.cargar(),
      stock.cargar(),
      ventas.cargarVentas(),
      proveedores.cargar(),
      compras.cargar(),
      usuarios.cargar(),
      negocio.cargar().catch(() => undefined),
      configuracionSistema.cargar().catch(() => undefined),
    ]);

    const idsCc = clientes.clientes
      .filter((c) => c.habilitado && c.cuentaCorrienteHabilitada)
      .map((c) => c.id);
    await Promise.all([
      cuentaCorriente.cargarSaldos(idsCc),
      cuentaCorriente.cargarMovimientosTodos(idsCc),
    ]);

    datosMaestrosCargados = true;
  })().finally(() => {
    promesaCarga = null;
  });

  return promesaCarga;
}

export function reiniciarEstadoCargaDatos(): void {
  promesaCarga = null;
  datosMaestrosCargados = false;
}
