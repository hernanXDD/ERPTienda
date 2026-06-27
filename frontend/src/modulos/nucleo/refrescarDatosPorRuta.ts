import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { useCatalogoStore } from '../../stores/catalogo';
import { useClientesStore } from '../../stores/clientes';
import { useCuentaCorrienteStore } from '../../stores/cuentaCorriente';
import { useCuentaCorrienteProveedorStore } from '../../stores/cuentaCorrienteProveedor';
import { useGestionUsuariosStore } from '../../stores/gestionUsuarios';
import { useFormasPagoStore } from '../../stores/formasPago';
import { useTallesCatalogoStore } from '../../stores/tallesCatalogo';
import { useProveedoresStore } from '../../stores/proveedores';
import { useRegistroComprasStore } from '../../stores/registroCompras';
import { useStockStore } from '../../stores/stock';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useCuponesDescuentoStore } from '../../stores/cuponesDescuento';
import { useDevolucionesStore } from '../../stores/devoluciones';
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
      void useCatalogoStore().cargar({ forzar: true });
      void useTallesCatalogoStore().cargar();
      void useConfiguracionSistemaStore().cargar();
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
      void useTallesCatalogoStore().cargar();
      void useClientesStore().cargar({ forzar: true });
      void useStockStore().cargar({ forzar: true });
      break;
    case 'ventas-devoluciones':
      void useVentasStore().cargarVentas({ forzar: true });
      void useCatalogoStore().cargar({ forzar: true });
      void useStockStore().cargar({ forzar: true });
      void useConfiguracionSistemaStore().cargar();
      void useDevolucionesStore().cargar({ forzar: true });
      void useCuponesDescuentoStore().cargar({ forzar: true });
      break;
    case 'ventas-cupones':
      void useCuponesDescuentoStore().cargar({ forzar: true });
      break;
    case 'ventas-historial':
      void useVentasStore().cargarVentas({ forzar: true });
      void useFormasPagoStore().cargar();
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
      void useTallesCatalogoStore().cargar();
      break;
    case 'productos-catalogo':
    case 'productos-categorias':
      void useCatalogoStore().cargar({ forzar: true });
      void useTallesCatalogoStore().cargar();
      break;
    case 'stock-actual':
    case 'stock-auditorias':
      void useCatalogoStore().cargar({ forzar: true });
      void useStockStore().cargar({ forzar: true });
      void useConfiguracionSistemaStore().cargar();
      if (nombre === 'stock-auditorias') {
        void useStockStore().cargarAuditorias(undefined, { forzar: true });
      }
      break;
    case 'usuarios-alta':
    case 'usuarios-permisos':
      void useGestionUsuariosStore().cargar({ forzar: true });
      break;
    case 'configuracion-sistema':
      void useConfiguracionSistemaStore().cargar();
      void useFormasPagoStore().cargar();
      void useTallesCatalogoStore().cargar();
      break;
    default:
      if (nombre.startsWith('reportes-')) {
        void useVentasStore().cargarVentas({ forzar: true });
        void useCatalogoStore().cargar({ forzar: true });
        void useClientesStore().cargar({ forzar: true });
        void useStockStore().cargar({ forzar: true });
        void useProveedoresStore().cargar({ forzar: true });
        void useRegistroComprasStore().cargar({ forzar: true });
        void useFormasPagoStore().cargar();
        void useConfiguracionSistemaStore().cargar();
        if (
          nombre === 'reportes-cuentas-corrientes' ||
          nombre === 'reportes-ventas-facturacion'
        ) {
          void recargarCuentasCorrientes();
        }
        if (nombre === 'reportes-cuentas-corrientes-proveedor') {
          void recargarCuentasCorrientesProveedor();
        }
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
