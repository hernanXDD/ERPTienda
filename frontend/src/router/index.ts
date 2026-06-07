import { createRouter, createWebHistory } from 'vue-router';
import { esUsuarioConfiguracionApp } from '../datos/usuarioConfiguracionApp';
import { menusVisiblesResueltos } from '../modulos/usuarios/permisosUsuario';
import {
  claveMenuRequeridaPorRuta,
  primeraRutaNombreSegunMenus,
  rutaRequiereConfiguracionApp,
} from '../modulos/nucleo/menuPrincipal';
import { useGestionUsuariosStore } from '../stores/gestionUsuarios';
import { cargarDatosMaestros } from '../stores/inicializacionDatos';
import { useSesionStore } from '../stores/sesion';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/autenticacion/inicio-sesion',
      name: 'inicio-sesion',
      component: () => import('../paginas/autenticacion/PaginaInicioSesion.vue'),
      meta: { publico: true },
    },
    {
      path: '/',
      component: () => import('../layouts/LayoutPrincipal.vue'),
      children: [
        {
          path: '',
          redirect: { name: 'inicio' },
        },
        {
          path: 'inicio',
          name: 'inicio',
          component: () => import('../paginas/inicio/PaginaInicio.vue'),
        },
        {
          path: 'clientes',
          component: () => import('../layouts/LayoutClientes.vue'),
          redirect: { name: 'clientes-alta' },
          children: [
            {
              path: 'alta',
              name: 'clientes-alta',
              component: () => import('../paginas/clientes/PaginaAltaClientes.vue'),
            },
            {
              path: 'cuentas-corrientes',
              name: 'clientes-cuentas-corrientes',
              component: () => import('../paginas/clientes/PaginaCuentasCorrientes.vue'),
            },
          ],
        },
        {
          path: 'ventas',
          component: () => import('../layouts/LayoutVentas.vue'),
          redirect: { name: 'ventas-centro' },
          children: [
            {
              path: 'centro',
              name: 'ventas-centro',
              component: () => import('../paginas/ventas/PaginaCentroVentas.vue'),
            },
            {
              path: 'historial',
              name: 'ventas-historial',
              component: () => import('../paginas/ventas/PaginaHistorialVentas.vue'),
            },
            {
              path: '',
              redirect: { name: 'ventas-centro' },
            },
            {
              path: 'nueva',
              redirect: { name: 'ventas-centro' },
            },
          ],
        },
        {
          path: 'compras',
          component: () => import('../layouts/LayoutCompras.vue'),
          redirect: { name: 'compras-proveedores' },
          children: [
            {
              path: 'proveedores',
              name: 'compras-proveedores',
              component: () => import('../paginas/compras/PaginaAltaProveedores.vue'),
            },
            {
              path: 'registro',
              name: 'compras-registro',
              component: () => import('../paginas/compras/PaginaRegistroCompras.vue'),
            },
          ],
        },
        {
          path: 'productos',
          component: () => import('../layouts/LayoutProductos.vue'),
          redirect: { name: 'productos-catalogo' },
          children: [
            {
              path: 'catalogo',
              name: 'productos-catalogo',
              component: () => import('../paginas/productos/PaginaCatalogoProductos.vue'),
            },
            {
              path: 'categorias',
              name: 'productos-categorias',
              component: () => import('../paginas/productos/PaginaCategorias.vue'),
            },
          ],
        },
        {
          path: 'stock',
          component: () => import('../layouts/LayoutStock.vue'),
          redirect: { name: 'stock-actual' },
          children: [
            {
              path: 'actual',
              name: 'stock-actual',
              component: () => import('../paginas/stock/PaginaStockActual.vue'),
            },
            {
              path: 'auditorias',
              name: 'stock-auditorias',
              component: () => import('../paginas/stock/PaginaAuditoriasStock.vue'),
            },
          ],
        },
        {
          path: 'reportes',
          component: () => import('../layouts/LayoutReportes.vue'),
          redirect: { name: 'reportes-panel' },
          children: [
            {
              path: 'panel',
              name: 'reportes-panel',
              component: () => import('../paginas/reportes/PaginaPanelReportes.vue'),
            },
            {
              path: 'ventas-periodo',
              name: 'reportes-ventas-periodo',
              component: () => import('../paginas/reportes/PaginaReporteVentasPeriodo.vue'),
            },
            {
              path: 'stock-critico',
              name: 'reportes-stock-critico',
              component: () => import('../paginas/reportes/PaginaReporteStockCritico.vue'),
            },
            {
              path: 'stock-valorizado',
              name: 'reportes-stock-valorizado',
              component: () => import('../paginas/reportes/PaginaReporteStockValorizado.vue'),
            },
            {
              path: 'movimientos-stock',
              name: 'reportes-movimientos-stock',
              component: () => import('../paginas/reportes/PaginaReporteMovimientosStock.vue'),
            },
            {
              path: 'cuentas-corrientes',
              name: 'reportes-cuentas-corrientes',
              component: () => import('../paginas/reportes/PaginaReporteCuentasCorrientes.vue'),
            },
            {
              path: 'compras-proveedor',
              name: 'reportes-compras-proveedor',
              component: () => import('../paginas/reportes/PaginaReporteComprasProveedor.vue'),
            },
            {
              path: 'productos-mas-vendidos',
              name: 'reportes-productos-mas-vendidos',
              component: () => import('../paginas/reportes/PaginaReporteProductosMasVendidos.vue'),
            },
            {
              path: 'ventas-por-categoria',
              name: 'reportes-ventas-por-categoria',
              component: () => import('../paginas/reportes/PaginaReporteVentasPorCategoria.vue'),
            },
            {
              path: 'ventas-facturacion',
              name: 'reportes-ventas-facturacion',
              component: () => import('../paginas/reportes/PaginaReporteVentasFacturacion.vue'),
            },
          ],
        },
        {
          path: 'usuarios',
          component: () => import('../layouts/LayoutUsuarios.vue'),
          redirect: { name: 'usuarios-alta' },
          children: [
            {
              path: 'alta',
              name: 'usuarios-alta',
              component: () => import('../paginas/usuarios/PaginaAltaUsuarios.vue'),
            },
            {
              path: 'permisos',
              name: 'usuarios-permisos',
              component: () => import('../paginas/usuarios/PaginaPermisosUsuario.vue'),
            },
          ],
        },
        {
          path: 'configuracion',
          component: () => import('../layouts/LayoutConfiguracion.vue'),
          redirect: { name: 'configuracion-negocio' },
          children: [
            {
              path: 'negocio',
              name: 'configuracion-negocio',
              component: () => import('../paginas/configuracion/PaginaConfiguracionNegocio.vue'),
            },
            {
              path: 'sistema',
              name: 'configuracion-sistema',
              component: () => import('../paginas/configuracion/PaginaConfiguracionSistema.vue'),
            },
          ],
        },
        {
          path: 'configuracion-app',
          name: 'configuracion-app',
          component: () => import('../paginas/configuracion/PaginaConfiguracionApp.vue'),
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const sesion = useSesionStore();
  if (!sesion.inicializado) {
    await sesion.restaurarSesion();
  }

  const esLogin = to.name === 'inicio-sesion';
  if (esLogin) {
    if (sesion.estaAutenticado) {
      return { name: 'inicio' };
    }
    return true;
  }

  if (!sesion.estaAutenticado) {
    const siguiente = to.fullPath && to.fullPath !== '/' ? to.fullPath : '/inicio';
    return { name: 'inicio-sesion', query: { siguiente } };
  }

  await cargarDatosMaestros().catch(() => {
    /* Si falla la carga inicial, igual se permite navegar (p. ej. pantalla en blanco evitada). */
  });

  if (rutaRequiereConfiguracionApp(to.name)) {
    if (!esUsuarioConfiguracionApp(sesion.usuario)) {
      return { name: 'inicio' };
    }
    return true;
  }

  const claveMenu = claveMenuRequeridaPorRuta(to.name);
  if (claveMenu) {
    const gestionUsuarios = useGestionUsuariosStore();
    const usuarioGestion = sesion.usuario
      ? gestionUsuarios.obtenerPorId(sesion.usuario.id)
      : undefined;
    const menus = menusVisiblesResueltos(usuarioGestion?.permisos.menusVisibles);
    if (!menus[claveMenu]) {
      const destino = primeraRutaNombreSegunMenus(menus, sesion.usuario);
      if (destino !== to.name) {
        return { name: destino };
      }
    }
  }

  return true;
});

export default router;
