import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { useCatalogoStore } from '../../stores/catalogo';
import { useClientesStore } from '../../stores/clientes';
import { useCuentaCorrienteStore } from '../../stores/cuentaCorriente';
import { useCuentaCorrienteProveedorStore } from '../../stores/cuentaCorrienteProveedor';
import { useGestionUsuariosStore } from '../../stores/gestionUsuarios';
import { useProveedoresStore } from '../../stores/proveedores';
import { useRegistroComprasStore } from '../../stores/registroCompras';
import { useStockStore } from '../../stores/stock';
import { useVentasStore } from '../../stores/ventas';

/** Recarga en segundo plano los datos del módulo al entrar a una pantalla. */
export function refrescarDatosPorRuta(
  ruta: Pick<RouteLocationNormalizedLoaded, 'name'>,
): void {
  const nombre = typeof ruta.name === 'string' ? ruta.name : '';

  switch (nombre) {
    case 'inicio':
      void useVentasStore().cargarVentas({ forzar: true });
      void useStockStore().cargar({ forzar: true });
      void useClientesStore().cargar({ forzar: true });
      break;
    case 'clientes-alta':
    case 'clientes-cuentas-corrientes':
      void useClientesStore().cargar({ forzar: true });
      if (nombre === 'clientes-cuentas-corrientes') {
        void recargarCuentasCorrientes();
      }
      break;
    case 'ventas-centro':
      void useCatalogoStore().cargar({ forzar: true });
      void useClientesStore().cargar({ forzar: true });
      void useStockStore().cargar({ forzar: true });
      break;
    case 'ventas-historial':
      void useVentasStore().cargarVentas({ forzar: true });
      break;
    case 'compras-proveedores':
    case 'compras-cuentas-corrientes-proveedor':
      void useProveedoresStore().cargar({ forzar: true });
      if (nombre === 'compras-cuentas-corrientes-proveedor') {
        void recargarCuentasCorrientesProveedor();
      }
      break;
    case 'compras-registro':
      void useProveedoresStore().cargar({ forzar: true });
      void useRegistroComprasStore().cargar({ forzar: true });
      break;
    case 'productos-catalogo':
    case 'productos-categorias':
      void useCatalogoStore().cargar({ forzar: true });
      break;
    case 'stock-actual':
    case 'stock-auditorias':
      void useCatalogoStore().cargar({ forzar: true });
      void useStockStore().cargar({ forzar: true });
      if (nombre === 'stock-auditorias') {
        void useStockStore().cargarAuditorias(undefined, { forzar: true });
      }
      break;
    case 'usuarios-alta':
    case 'usuarios-permisos':
      void useGestionUsuariosStore().cargar({ forzar: true });
      break;
    default:
      if (nombre.startsWith('reportes-')) {
        void useVentasStore().cargarVentas({ forzar: true });
        void useCatalogoStore().cargar({ forzar: true });
        void useClientesStore().cargar({ forzar: true });
        void useStockStore().cargar({ forzar: true });
        void useProveedoresStore().cargar({ forzar: true });
        void useRegistroComprasStore().cargar({ forzar: true });
      }
      break;
  }
}

async function recargarCuentasCorrientes(): Promise<void> {
  const clientesStore = useClientesStore();
  await clientesStore.cargar({ forzar: true });
  const idsCc = clientesStore.clientes
    .filter((c) => c.habilitado && c.cuentaCorrienteHabilitada)
    .map((c) => c.id);
  const cuentaCorrienteStore = useCuentaCorrienteStore();
  await Promise.all([
    cuentaCorrienteStore.cargarSaldos(idsCc),
    cuentaCorrienteStore.cargarMovimientosTodos(idsCc),
  ]);
}

async function recargarCuentasCorrientesProveedor(): Promise<void> {
  const proveedoresStore = useProveedoresStore();
  await proveedoresStore.cargar({ forzar: true });
  const idsCc = proveedoresStore.proveedores
    .filter((p) => p.habilitado && p.comprasCreditoHabilitadas)
    .map((p) => p.id);
  const cuentaCorrienteProveedorStore = useCuentaCorrienteProveedorStore();
  await Promise.all([
    cuentaCorrienteProveedorStore.cargarSaldos(idsCc),
    cuentaCorrienteProveedorStore.cargarMovimientosTodos(idsCc),
  ]);
}
