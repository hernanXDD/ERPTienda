import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePermisosOperador } from './usePermisosOperador';
import { ventaPermiteDevolucion } from '../modulos/ventas/plazoDevolucion';
import { subtotalEfectivoDevolucion } from '../modulos/ventas/reembolsoDevolucionVenta';
import { useCatalogoStore } from '../stores/catalogo';
import { useConfiguracionSistemaStore } from '../stores/configuracionSistema';
import { useDevolucionesStore } from '../stores/devoluciones';
import { useStockStore } from '../stores/stock';
import { useVentasStore } from '../stores/ventas';
import { useCuponesDescuentoStore } from '../stores/cuponesDescuento';
import type { Producto, Variante } from '../tipos/catalogo';
import type { CuponDescuentoCreado } from '../tipos/cuponDescuento';
import type { DevolucionRegistrada } from '../tipos/devolucion';
import type { IdFormaPago, VentaRegistrada } from '../tipos/venta';
import { fechaVencimientoCuponDesdeHoy } from '../utilidades/fechaVencimientoCupon';
import {
  ADVERTENCIA_CUPON_TRAS_DEVOLUCION,
  ADVERTENCIA_VENTA_CAMBIO_TRAS_DEVOLUCION,
} from '../modulos/postventa/mensajesErrorPostventa';

export type SeccionListadoDevolucion = 'ventas' | 'historial';

export type FaseProcesoDevolucion = 'listado' | 'cambio';

export interface CantidadLineaDevolucion {
  ventaLineaId: string;
  nombre: string;
  precioUnitario: number;
  cantidadDisponible: number;
  cantidad: number;
}

export interface LineaDevolucionPendiente {
  ventaLineaId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

export interface LineaNuevaPrenda {
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface FilaVarianteCambio {
  variante: Variante;
  producto: Producto;
  nombreLinea: string;
  precioUnitario: number;
}

export interface ResultadoOperacionDevolucion {
  devolucion: DevolucionRegistrada;
  ventaNueva: VentaRegistrada | null;
  cupon: CuponDescuentoCreado | null;
  advertenciaCupon?: string | null;
  advertenciaVentaNueva?: string | null;
}

export function useProcesoDevolucion() {
  const { tienePermiso } = usePermisosOperador();
  const ventasStore = useVentasStore();
  const devolucionesStore = useDevolucionesStore();
  const stockStore = useStockStore();
  const catalogoStore = useCatalogoStore();
  const configuracionStore = useConfiguracionSistemaStore();
  const cuponesStore = useCuponesDescuentoStore();

  const { ventas, cargandoVentas, errorVentas } = storeToRefs(ventasStore);
  const { variantes } = storeToRefs(catalogoStore);
  const { parametros } = storeToRefs(configuracionStore);
  const { registrando } = storeToRefs(devolucionesStore);
  const { devoluciones: historialDevoluciones, cargando: cargandoHistorial } =
    storeToRefs(devolucionesStore);

  const fase = ref<FaseProcesoDevolucion>('listado');
  const seccionListado = ref<SeccionListadoDevolucion>('ventas');
  const busqueda = ref('');
  const busquedaHistorial = ref('');
  const ventaOrigen = ref<VentaRegistrada | null>(null);
  const cantidadesLinea = ref<CantidadLineaDevolucion[]>([]);
  const lineasDevolucion = ref<LineaDevolucionPendiente[]>([]);
  const lineasNuevas = ref<LineaNuevaPrenda[]>([]);
  const busquedaPrenda = ref('');
  const observaciones = ref('');
  const formaPagoCambio = ref<IdFormaPago>('EFECTIVO');
  const mensajeError = ref('');
  const resultadoOperacion = ref<ResultadoOperacionDevolucion | null>(null);
  const emitirCuponAlConfirmar = ref(true);

  const puedeRegistrar = computed(() => tienePermiso('puedeRegistrarVentas'));

  const plazoDevolucionTexto = computed(() => {
    const dias = parametros.value.diasPlazoDevolucion;
    return dias === 1 ? '1 día' : `${dias} días`;
  });

  const hayFiltrosActivos = computed(() => Boolean(busqueda.value.trim()));
  const hayFiltrosHistorialActivos = computed(() => Boolean(busquedaHistorial.value.trim()));

  const subtotalDialogoDevolucion = computed(() => {
    const lineas = cantidadesLinea.value
      .filter((ln) => ln.cantidad > 0)
      .map((ln) => ({ cantidad: ln.cantidad, precioUnitario: ln.precioUnitario }));
    const venta = ventaOrigen.value;
    if (!venta || lineas.length === 0) {
      return lineas.reduce((acc, ln) => acc + ln.cantidad * ln.precioUnitario, 0);
    }
    return subtotalEfectivoDevolucion(venta, lineas);
  });

  const unidadesSeleccionadasDialogo = computed(() =>
    cantidadesLinea.value.reduce((acc, ln) => acc + ln.cantidad, 0),
  );

  const historialFiltrado = computed(() => {
    const q = busquedaHistorial.value.trim().toLowerCase();
    return historialDevoluciones.value.filter((d) => {
      if (!q) return true;
      const trozos = [d.numero, d.numeroVenta, d.nombreClienteMostrar, d.observaciones].map((t) =>
        t.toLowerCase(),
      );
      return trozos.some((t) => t.includes(q));
    });
  });

  function cantidadDisponibleLinea(ln: VentaRegistrada['lineas'][number]): number {
    return ln.cantidadDisponibleDevolver ?? Math.max(0, ln.cantidad - (ln.cantidadDevuelta ?? 0));
  }

  function ventaTienePendienteDevolucion(v: VentaRegistrada): boolean {
    return v.lineas.some((ln) => cantidadDisponibleLinea(ln) > 0);
  }

  function ventaEsElegible(v: VentaRegistrada): boolean {
    return (
      ventaPermiteDevolucion(v.fecha, parametros.value.diasPlazoDevolucion) &&
      ventaTienePendienteDevolucion(v)
    );
  }

  function unidadesPendientesDevolver(v: VentaRegistrada): number {
    return v.lineas.reduce((acc, ln) => acc + cantidadDisponibleLinea(ln), 0);
  }

  const ventasElegibles = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    return [...ventas.value]
      .filter(ventaEsElegible)
      .filter((v) => {
        if (!q) return true;
        return (
          v.numero.toLowerCase().includes(q) ||
          v.nombreClienteMostrar.toLowerCase().includes(q) ||
          v.documentoClienteMostrar.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  });

  const subtotalDevolucion = computed(() => {
    const venta = ventaOrigen.value;
    if (!venta || lineasDevolucion.value.length === 0) {
      return lineasDevolucion.value.reduce((acc, ln) => acc + ln.cantidad * ln.precioUnitario, 0);
    }
    return subtotalEfectivoDevolucion(venta, lineasDevolucion.value);
  });

  const subtotalNuevasPrendas = computed(() =>
    lineasNuevas.value.reduce((acc, ln) => acc + ln.cantidad * ln.precioUnitario, 0),
  );

  const saldoAPagar = computed(() =>
    Math.max(0, subtotalNuevasPrendas.value - subtotalDevolucion.value),
  );

  const saldoAFavor = computed(() =>
    Math.max(0, subtotalDevolucion.value - subtotalNuevasPrendas.value),
  );

  const haySaldoAPagar = computed(() => saldoAPagar.value > 0);
  const haySaldoAFavor = computed(() => saldoAFavor.value > 0);

  const hayCantidadesSeleccionadas = computed(() =>
    cantidadesLinea.value.some((ln) => ln.cantidad > 0),
  );

  const puedeContinuarACambio = computed(
    () => puedeRegistrar.value && hayCantidadesSeleccionadas.value,
  );

  const puedeFinalizar = computed(() => {
    if (!puedeRegistrar.value || registrando.value) return false;
    if (lineasDevolucion.value.length === 0) return false;
    if (haySaldoAPagar.value && lineasNuevas.value.length === 0) return false;
    return true;
  });

  const filasVarianteActivas = computed((): FilaVarianteCambio[] =>
    variantes.value
      .filter((v) => v.activa)
      .map((variante): FilaVarianteCambio | null => {
        const producto = catalogoStore.productoPorId(variante.productoId);
        if (!producto) return null;
        return {
          variante,
          producto,
          nombreLinea: catalogoStore.nombreLineaComercial(variante.id),
          precioUnitario: producto.precioVenta,
        };
      })
      .filter((f): f is FilaVarianteCambio => f !== null),
  );

  function coincideBusquedaPrenda(fila: FilaVarianteCambio, texto: string): boolean {
    const q = texto.trim().toLowerCase();
    if (!q) return false;
    const trozos = [
      fila.producto.nombre,
      fila.producto.marca,
      fila.variante.talle,
      fila.variante.color,
      fila.variante.codigoBarras,
      fila.nombreLinea,
    ].map((x) => x.toLowerCase());
    return trozos.some((t) => t.includes(q));
  }

  const resultadosPrenda = computed(() => {
    const q = busquedaPrenda.value.trim();
    if (!q) return [];
    return filasVarianteActivas.value
      .filter((f) => coincideBusquedaPrenda(f, q) && stockStore.cantidadActual(f.variante.id) > 0)
      .slice(0, 12);
  });

  function limpiarFiltros(): void {
    busqueda.value = '';
  }

  function limpiarFiltrosHistorial(): void {
    busquedaHistorial.value = '';
  }

  async function cargarHistorialDevoluciones(): Promise<void> {
    await devolucionesStore.cargar({ forzar: true });
  }

  async function crearCuponPorSaldo(
    monto: number,
    venta: VentaRegistrada,
    devolucionId: string,
    devolucionNumero: string,
  ): Promise<CuponDescuentoCreado> {
    return cuponesStore.crear({
      tipoDescuento: 'monto_fijo',
      montoDescuento: monto,
      fechaVencimiento: fechaVencimientoCuponDesdeHoy(parametros.value.diasPlazoDevolucion),
      clienteId: venta.clienteId,
      nombreClienteMostrar: venta.nombreClienteMostrar,
      documentoClienteMostrar: venta.documentoClienteMostrar,
      devolucionId,
      observaciones: `Generado por devolución ${devolucionNumero} · Venta ${venta.numero}`,
    });
  }

  async function intentarEmitirCuponTrasDevolucion(
    monto: number,
    venta: VentaRegistrada,
    devolucion: DevolucionRegistrada,
  ): Promise<{ cupon: CuponDescuentoCreado | null; advertenciaCupon: string | null }> {
    if (!emitirCuponAlConfirmar.value || monto <= 0) {
      return { cupon: null, advertenciaCupon: null };
    }
    try {
      const cupon = await crearCuponPorSaldo(monto, venta, devolucion.id, devolucion.numero);
      return { cupon, advertenciaCupon: null };
    } catch {
      return {
        cupon: null,
        advertenciaCupon:
          cuponesStore.errorCupon ?? ADVERTENCIA_CUPON_TRAS_DEVOLUCION,
      };
    }
  }

  async function confirmarSoloDevolucion(): Promise<ResultadoOperacionDevolucion | null> {
    if (!puedeContinuarACambio.value || !ventaOrigen.value) return null;

    mensajeError.value = '';
    const venta = ventaOrigen.value;
    const lineas = cantidadesLinea.value
      .filter((ln) => ln.cantidad > 0)
      .map((ln) => ({
        ventaLineaId: ln.ventaLineaId,
        nombre: ln.nombre,
        precioUnitario: ln.precioUnitario,
        cantidad: ln.cantidad,
      }));

    try {
      const devolucion = await devolucionesStore.registrar({
        ventaId: venta.id,
        lineas: lineas.map((ln) => ({
          ventaLineaId: ln.ventaLineaId,
          cantidad: ln.cantidad,
        })),
        observaciones: observaciones.value,
      });

      const { cupon, advertenciaCupon } = await intentarEmitirCuponTrasDevolucion(
        devolucion.total,
        venta,
        devolucion,
      );

      await Promise.all([
        ventasStore.cargarVentas({ forzar: true }),
        stockStore.cargar({ forzar: true }),
        devolucionesStore.cargar({ forzar: true }),
      ]);

      const resultado: ResultadoOperacionDevolucion = {
        devolucion,
        ventaNueva: null,
        cupon,
        advertenciaCupon,
      };
      resultadoOperacion.value = resultado;
      ventaOrigen.value = null;
      cantidadesLinea.value = [];
      observaciones.value = '';
      return resultado;
    } catch {
      mensajeError.value =
        devolucionesStore.errorDevolucion ?? 'No se pudo registrar la devolución. Revisá las cantidades e intentá de nuevo.';
      return null;
    }
  }

  function seleccionarVentaParaDialogo(venta: VentaRegistrada): void {
    if (!puedeRegistrar.value) return;
    ventaOrigen.value = venta;
    cantidadesLinea.value = venta.lineas
      .filter((ln) => cantidadDisponibleLinea(ln) > 0)
      .map((ln) => ({
        ventaLineaId: ln.id ?? '',
        nombre: ln.nombre,
        precioUnitario: ln.precioUnitario,
        cantidadDisponible: cantidadDisponibleLinea(ln),
        cantidad: 0,
      }));
    observaciones.value = '';
    mensajeError.value = '';
  }

  function cerrarDialogoSeleccion(): void {
    ventaOrigen.value = null;
    cantidadesLinea.value = [];
    observaciones.value = '';
    mensajeError.value = '';
  }

  function actualizarCantidadLinea(ventaLineaId: string, valor: number): void {
    const linea = cantidadesLinea.value.find((ln) => ln.ventaLineaId === ventaLineaId);
    if (!linea) return;
    linea.cantidad = Math.max(0, Math.min(linea.cantidadDisponible, Math.floor(valor)));
  }

  function devolverTodoEnDialogo(): void {
    for (const linea of cantidadesLinea.value) {
      linea.cantidad = linea.cantidadDisponible;
    }
  }

  function limpiarSeleccionEnDialogo(): void {
    for (const linea of cantidadesLinea.value) {
      linea.cantidad = 0;
    }
  }

  function continuarACambio(): void {
    if (!puedeContinuarACambio.value || !ventaOrigen.value) return;
    lineasDevolucion.value = cantidadesLinea.value
      .filter((ln) => ln.cantidad > 0)
      .map((ln) => ({
        ventaLineaId: ln.ventaLineaId,
        nombre: ln.nombre,
        precioUnitario: ln.precioUnitario,
        cantidad: ln.cantidad,
      }));
    lineasNuevas.value = [];
    busquedaPrenda.value = '';
    formaPagoCambio.value = ventaOrigen.value.formaPago;
    mensajeError.value = '';
    cantidadesLinea.value = [];
    fase.value = 'cambio';
  }

  function volverAListado(): void {
    fase.value = 'listado';
    ventaOrigen.value = null;
    lineasDevolucion.value = [];
    lineasNuevas.value = [];
    busquedaPrenda.value = '';
    observaciones.value = '';
    mensajeError.value = '';
  }

  function agregarPrenda(fila: FilaVarianteCambio): void {
    const existente = lineasNuevas.value.find((ln) => ln.varianteId === fila.variante.id);
    const stock = stockStore.cantidadActual(fila.variante.id);
    if (existente) {
      if (existente.cantidad < stock) existente.cantidad += 1;
    } else if (stock > 0) {
      lineasNuevas.value.push({
        varianteId: fila.variante.id,
        nombre: fila.nombreLinea,
        cantidad: 1,
        precioUnitario: fila.precioUnitario,
      });
    }
    busquedaPrenda.value = '';
  }

  function actualizarCantidadPrenda(varianteId: string, valor: number): void {
    const linea = lineasNuevas.value.find((ln) => ln.varianteId === varianteId);
    if (!linea) return;
    const max = stockStore.cantidadActual(varianteId);
    linea.cantidad = Math.max(1, Math.min(max, Math.floor(valor)));
  }

  function quitarPrenda(varianteId: string): void {
    lineasNuevas.value = lineasNuevas.value.filter((ln) => ln.varianteId !== varianteId);
  }

  async function finalizarOperacion(): Promise<ResultadoOperacionDevolucion | null> {
    if (!puedeFinalizar.value || !ventaOrigen.value) return null;

    mensajeError.value = '';
    const venta = ventaOrigen.value;

    try {
      const devolucion = await devolucionesStore.registrar({
        ventaId: venta.id,
        lineas: lineasDevolucion.value.map((ln) => ({
          ventaLineaId: ln.ventaLineaId,
          cantidad: ln.cantidad,
        })),
        observaciones: observaciones.value,
      });

      let ventaNueva: VentaRegistrada | null = null;
      let advertenciaVentaNueva: string | null = null;
      if (lineasNuevas.value.length > 0) {
        const subtotal = subtotalNuevasPrendas.value;
        const credito = Math.min(subtotalDevolucion.value, subtotal);
        const total = Math.max(0, subtotal - credito);
        const ajusteMonto = total - subtotal;

        try {
          ventaNueva = await ventasStore.registrarVenta({
            clienteId: venta.clienteId,
            nombreClienteMostrar: venta.nombreClienteMostrar,
            documentoClienteMostrar: venta.documentoClienteMostrar,
            formaPago: total > 0 ? formaPagoCambio.value : venta.formaPago,
            lineas: lineasNuevas.value.map((ln) => ({
              varianteId: ln.varianteId,
              nombre: ln.nombre,
              cantidad: ln.cantidad,
              precioUnitario: ln.precioUnitario,
              subtotal: ln.cantidad * ln.precioUnitario,
            })),
            total,
            ajusteMonto,
            observaciones: `Cambio por devolución ${devolucion.numero} · Venta origen ${venta.numero}`,
          });
        } catch {
          advertenciaVentaNueva = ADVERTENCIA_VENTA_CAMBIO_TRAS_DEVOLUCION;
        }
      }

      const { cupon, advertenciaCupon } = await intentarEmitirCuponTrasDevolucion(
        saldoAFavor.value,
        venta,
        devolucion,
      );

      await Promise.all([
        ventasStore.cargarVentas({ forzar: true }),
        stockStore.cargar({ forzar: true }),
        devolucionesStore.cargar({ forzar: true }),
      ]);

      const resultado: ResultadoOperacionDevolucion = {
        devolucion,
        ventaNueva,
        cupon,
        advertenciaCupon,
        advertenciaVentaNueva,
      };
      resultadoOperacion.value = resultado;
      volverAListado();
      return resultado;
    } catch {
      mensajeError.value =
        devolucionesStore.errorDevolucion ?? 'No se pudo completar el cambio. Revisá los datos e intentá de nuevo.';
      return null;
    }
  }

  return {
    fase,
    seccionListado,
    busqueda,
    busquedaHistorial,
    ventaOrigen,
    cantidadesLinea,
    lineasDevolucion,
    lineasNuevas,
    busquedaPrenda,
    observaciones,
    formaPagoCambio,
    mensajeError,
    resultadoOperacion,
    emitirCuponAlConfirmar,
    cargandoVentas,
    errorVentas,
    ventasElegibles,
    historialFiltrado,
    cargandoHistorial,
    registrando,
    puedeRegistrar,
    plazoDevolucionTexto,
    hayFiltrosActivos,
    hayFiltrosHistorialActivos,
    subtotalDialogoDevolucion,
    unidadesSeleccionadasDialogo,
    subtotalDevolucion,
    subtotalNuevasPrendas,
    saldoAPagar,
    saldoAFavor,
    haySaldoAPagar,
    haySaldoAFavor,
    puedeContinuarACambio,
    puedeFinalizar,
    resultadosPrenda,
    limpiarFiltros,
    limpiarFiltrosHistorial,
    cargarHistorialDevoluciones,
    seleccionarVentaParaDialogo,
    cerrarDialogoSeleccion,
    actualizarCantidadLinea,
    devolverTodoEnDialogo,
    limpiarSeleccionEnDialogo,
    continuarACambio,
    confirmarSoloDevolucion,
    volverAListado,
    agregarPrenda,
    actualizarCantidadPrenda,
    quitarPrenda,
    finalizarOperacion,
    unidadesPendientesDevolver,
  };
}

export type ContextoProcesoDevolucion = ReturnType<typeof useProcesoDevolucion>;
