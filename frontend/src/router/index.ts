import { createRouter, createWebHistory } from 'vue-router';
import { menusVisiblesResueltos } from '../datos/semillaUsuariosGestion';
import {
  claveMenuRequeridaPorRuta,
  primeraRutaNombreSegunMenus,
} from '../modulos/nucleo/menuPrincipal';
import { useGestionUsuariosStore } from '../stores/gestionUsuarios';
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
          redirect: { name: 'ventas' },
          children: [
            {
              path: '',
              name: 'ventas',
              component: () => import('../paginas/ventas/PaginaListaVentas.vue'),
            },
            {
              path: 'nueva',
              redirect: { name: 'ventas' },
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
          name: 'configuracion',
          component: () => import('../paginas/comunes/PaginaEnConstruccion.vue'),
          props: {
            titulo: 'Configuración',
            descripcion:
              'Datos del negocio, parámetros fiscales, medios de pago y preferencias de la cuenta se cargarán aquí.',
          },
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

  const claveMenu = claveMenuRequeridaPorRuta(to.name);
  if (claveMenu) {
    const gestionUsuarios = useGestionUsuariosStore();
    const usuarioGestion = sesion.usuario
      ? gestionUsuarios.obtenerPorId(sesion.usuario.id)
      : undefined;
    const menus = menusVisiblesResueltos(usuarioGestion?.permisos.menusVisibles);
    if (!menus[claveMenu]) {
      const destino = primeraRutaNombreSegunMenus(menus);
      if (destino !== to.name) {
        return { name: destino };
      }
    }
  }

  return true;
});

export default router;
