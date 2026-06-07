import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCatalogoStore } from '../stores/catalogo';
import { useClientesStore } from '../stores/clientes';
import { useStockStore } from '../stores/stock';
import { useVentasStore } from '../stores/ventas';
import type { Producto, Variante } from '../tipos/catalogo';
import type { Cliente } from '../tipos/cliente';
import type { IdFormaPago, VentaRegistrada } from '../tipos/venta';
import { formatearDocumentoClienteAlEscribir } from '../modulos/clientes/formateadorDocumentoCliente';
import { exportarComprobanteVentaPdf } from '../modulos/ventas/impresionResumenVenta';
import { mensajeErrorHttp } from '../servicios/apiUtil';
import { useCuentaCorrienteStore } from '../stores/cuentaCorriente';

export interface LineaTicketCentroVentas {
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface FilaVarianteListadoCentroVentas {
  variante: Variante;
  producto: Producto;
  nombreLinea: string;
  precioUnitario: number;
}

export type ModoIngresoCentroVentas = 'LECTOR' | 'NOMBRE';

export const ETIQUETA_CONSUMIDOR_FINAL = 'Consumidor final';

export function useCentroVentas() {
  const catalogo = useCatalogoStore();
  const clientesStore = useClientesStore();
  const ventasStore = useVentasStore();
  const stockStore = useStockStore();
  const cuentaCorrienteStore = useCuentaCorrienteStore();
  const { variantes } = storeToRefs(catalogo);
  const { clientes } = storeToRefs(clientesStore);

  const refInputLector = ref<HTMLInputElement | null>(null);
  const refInputNombre = ref<HTMLInputElement | null>(null);

  const modoProducto = ref<ModoIngresoCentroVentas>('LECTOR');
  const codigoLector = ref('');
  const busquedaNombre = ref('');
  const varianteSeleccionadaId = ref<string | null>(null);
  const textoBusquedaCliente = ref('');
  const desplegableClienteAbierto = ref(false);
  const lineas = ref<LineaTicketCentroVentas[]>([]);
  const clienteId = ref('');
  const consumidorFinalElegido = ref(false);
  const consumidorFinalDocumento = ref('');
  const consumidorFinalNombreApellido = ref('');
  const formaPago = ref<IdFormaPago>('EFECTIVO');
  const observaciones = ref('');
  const mensajeToast = ref('');
  const ventaConfirmada = ref<VentaRegistrada | null>(null);
  const confirmandoVenta = ref(false);
  let idToast: ReturnType<typeof setTimeout> | null = null;

  function mostrarToast(texto: string, duracion = 3200) {
    mensajeToast.value = texto;
    if (idToast) clearTimeout(idToast);
    idToast = setTimeout(() => {
      mensajeToast.value = '';
    }, duracion);
  }

  const filasVarianteActivas = computed((): FilaVarianteListadoCentroVentas[] => {
    return variantes.value
      .filter((v) => v.activa)
      .map((variante): FilaVarianteListadoCentroVentas | null => {
        const producto = catalogo.productoPorId(variante.productoId);
        if (!producto) return null;
        return {
          variante,
          producto,
          nombreLinea: catalogo.nombreLineaComercial(variante.id),
          precioUnitario: producto.precioVenta,
        };
      })
      .filter((f): f is FilaVarianteListadoCentroVentas => f !== null);
  });

  function coincideBusquedaVariante(fila: FilaVarianteListadoCentroVentas, texto: string): boolean {
    const q = texto.trim().toLowerCase();
    if (!q) return false;
    const trozos = [
      fila.producto.nombre,
      fila.producto.marca,
      fila.producto.descripcion,
      fila.variante.talle,
      fila.variante.color,
      fila.variante.codigoBarras,
      catalogo.nombreCategoria(fila.producto.categoriaId),
      fila.nombreLinea,
    ].map((x) => x.toLowerCase());
    return trozos.some((t) => t.includes(q));
  }

  const resultadosVariante = computed(() => {
    const q = busquedaNombre.value.trim();
    if (!q) return [];
    return [...filasVarianteActivas.value]
      .filter((f) => coincideBusquedaVariante(f, q))
      .sort((a, b) => a.nombreLinea.localeCompare(b.nombreLinea, 'es', { sensitivity: 'base' }));
  });

  const filaVarianteSeleccionada = computed(
    () =>
      filasVarianteActivas.value.find((f) => f.variante.id === varianteSeleccionadaId.value) ??
      null,
  );

  function clienteCoincideBusqueda(c: Cliente, texto: string): boolean {
    const q = texto.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.documento.toLowerCase().includes(q) ||
      c.correoElectronico.toLowerCase().includes(q) ||
      c.telefonoPrincipal.toLowerCase().includes(q) ||
      c.telefonoAlternativo.toLowerCase().includes(q) ||
      c.direccion.toLowerCase().includes(q)
    );
  }

  const esConsumidorFinal = computed(() => !clienteId.value);

  const mostrarOpcionConsumidorFinal = computed(() => {
    if (consumidorFinalElegido.value && !clienteId.value) return true;
    const q = textoBusquedaCliente.value.trim().toLowerCase();
    if (!q) return false;
    return (
      'consumidor final'.includes(q) ||
      q.includes('consumidor') ||
      q.includes('final') ||
      q === 'cf'
    );
  });

  const clientesSugeridos = computed(() => {
    if (
      consumidorFinalElegido.value &&
      textoBusquedaCliente.value.trim() === ETIQUETA_CONSUMIDOR_FINAL
    ) {
      return [];
    }
    const base = clientes.value.filter((c) => c.habilitado);
    const q = textoBusquedaCliente.value.trim();
    if (q.toLowerCase() === ETIQUETA_CONSUMIDOR_FINAL.toLowerCase()) return [];
    const filtrados = q ? base.filter((c) => clienteCoincideBusqueda(c, q)) : base;
    return [...filtrados]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
      .slice(0, 12);
  });

  const totalTicket = computed(() =>
    lineas.value.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0),
  );

  const cantidadArticulos = computed(() =>
    lineas.value.reduce((acc, l) => acc + l.cantidad, 0),
  );

  const nombreClienteMostrar = computed(() => {
    if (clienteId.value) {
      return clientesStore.clientePorId(clienteId.value)?.nombre ?? 'Cliente registrado';
    }
    const nombre = consumidorFinalNombreApellido.value.trim();
    const documento = consumidorFinalDocumento.value.trim();
    if (nombre && documento) return `${nombre} — ${documento}`;
    if (nombre) return nombre;
    if (documento) return `Consumidor final — ${documento}`;
    return 'Consumidor final';
  });

  const puedeCuentaCorriente = computed(() => {
    if (!clienteId.value) return false;
    const c = clientesStore.clientePorId(clienteId.value);
    if (!c?.habilitado) return false;
    return c.cuentaCorrienteHabilitada === true;
  });

  const puedeConfirmarVenta = computed(
    () =>
      !confirmandoVenta.value &&
      lineas.value.length > 0 &&
      (formaPago.value !== 'CUENTA_CORRIENTE' || puedeCuentaCorriente.value),
  );

  watch(clienteId, () => {
    if (formaPago.value === 'CUENTA_CORRIENTE' && !puedeCuentaCorriente.value) {
      formaPago.value = 'EFECTIVO';
    }
  });

  function abrirDesplegableCliente() {
    desplegableClienteAbierto.value = true;
  }

  function cerrarDesplegableCliente() {
    desplegableClienteAbierto.value = false;
  }

  function alEscribirBusquedaCliente() {
    desplegableClienteAbierto.value = true;

    if (
      consumidorFinalElegido.value &&
      textoBusquedaCliente.value.trim() !== ETIQUETA_CONSUMIDOR_FINAL
    ) {
      consumidorFinalElegido.value = false;
    }

    if (!clienteId.value) return;
    const c = clientesStore.clientePorId(clienteId.value);
    if (!c) {
      clienteId.value = '';
      return;
    }
    const texto = textoBusquedaCliente.value.trim().toLowerCase();
    if (!texto) {
      clienteId.value = '';
      return;
    }
    const coincide =
      texto === etiquetaClienteSelectorVenta(c).toLowerCase() ||
      texto === c.nombre.trim().toLowerCase() ||
      c.documento.toLowerCase().includes(texto) ||
      c.nombre.toLowerCase().includes(texto);
    if (!coincide) {
      clienteId.value = '';
    }
  }

  function seleccionarConsumidorFinal() {
    clienteId.value = '';
    consumidorFinalElegido.value = true;
    textoBusquedaCliente.value = ETIQUETA_CONSUMIDOR_FINAL;
    consumidorFinalDocumento.value = '';
    consumidorFinalNombreApellido.value = '';
    desplegableClienteAbierto.value = false;
  }

  function seleccionarClienteRegistrado(id: string) {
    const c = clientesStore.clientePorId(id);
    if (!c) return;
    clienteId.value = id;
    consumidorFinalElegido.value = false;
    textoBusquedaCliente.value = c.nombre;
    consumidorFinalDocumento.value = '';
    consumidorFinalNombreApellido.value = '';
    desplegableClienteAbierto.value = false;
  }

  function alEscribirDocumentoConsumidorFinal(texto: string) {
    consumidorFinalDocumento.value = formatearDocumentoClienteAlEscribir(texto);
  }

  watch(busquedaNombre, () => {
    varianteSeleccionadaId.value = null;
  });

  watch(modoProducto, () => {
    nextTick(() => enfocarModoActual());
  });

  function enfocarModoActual() {
    nextTick(() => {
      if (modoProducto.value === 'LECTOR') {
        refInputLector.value?.focus();
        refInputLector.value?.select?.();
      } else {
        refInputNombre.value?.focus();
      }
    });
  }

  function etiquetaClienteSelectorVenta(c: Cliente): string {
    const correo = c.correoElectronico.trim();
    return correo
      ? `${c.nombre} — ${c.documento} — ${correo}`
      : `${c.nombre} — ${c.documento}`;
  }

  function subtotalLinea(l: LineaTicketCentroVentas): number {
    return l.cantidad * l.precioUnitario;
  }

  function resetBorrador() {
    codigoLector.value = '';
    busquedaNombre.value = '';
    varianteSeleccionadaId.value = null;
    modoProducto.value = 'LECTOR';
    textoBusquedaCliente.value = '';
    desplegableClienteAbierto.value = false;
    lineas.value = [];
    clienteId.value = '';
    consumidorFinalElegido.value = false;
    consumidorFinalDocumento.value = '';
    consumidorFinalNombreApellido.value = '';
    formaPago.value = 'EFECTIVO';
    observaciones.value = '';
  }

  function agregarAlTicket(variante: Variante) {
    const producto = catalogo.productoPorId(variante.productoId);
    if (!producto) {
      mostrarToast('No se encontró el producto de esta variante.', 4000);
      return;
    }
    if (!Number.isFinite(producto.precioVenta) || producto.precioVenta < 0) {
      mostrarToast('El producto no tiene precio de venta válido.', 4000);
      return;
    }
    const existente = lineas.value.find((l) => l.varianteId === variante.id);
    if (existente) {
      existente.cantidad += 1;
    } else {
      lineas.value = [
        ...lineas.value,
        {
          varianteId: variante.id,
          nombre: catalogo.nombreLineaComercial(variante.id),
          cantidad: 1,
          precioUnitario: producto.precioVenta,
        },
      ];
    }
  }

  function agregarPorLector() {
    const codigoNorm = codigoLector.value.trim();
    if (!codigoNorm) {
      mostrarToast('Ingresá el código del lector o escribilo y presioná Enter.', 3200);
      return;
    }
    const variante = catalogo.variantePorCodigoBarras(codigoNorm);
    if (!variante) {
      mostrarToast('No hay ninguna variante con ese código de barras.', 3800);
      return;
    }
    agregarAlTicket(variante);
    codigoLector.value = '';
    enfocarModoActual();
  }

  function seleccionarVarianteNombre(fila: FilaVarianteListadoCentroVentas) {
    varianteSeleccionadaId.value = fila.variante.id;
  }

  function agregarVarianteNombreSeleccionada() {
    const fila = filaVarianteSeleccionada.value;
    if (!fila) {
      mostrarToast('Seleccioná una variante en la lista.', 3500);
      return;
    }
    agregarAlTicket(fila.variante);
    varianteSeleccionadaId.value = null;
  }

  function setModoProducto(m: ModoIngresoCentroVentas) {
    modoProducto.value = m;
  }

  function elegirFormaPago(id: IdFormaPago) {
    if (id === 'CUENTA_CORRIENTE' && !puedeCuentaCorriente.value) return;
    formaPago.value = id;
  }

  function pedirLimpiar() {
    if (
      lineas.value.length > 0 &&
      !globalThis.confirm('¿Descartar los datos cargados en esta venta?')
    ) {
      return;
    }
    resetBorrador();
    nextTick(() => enfocarModoActual());
  }

  function quitarLinea(varianteId: string) {
    lineas.value = lineas.value.filter((l) => l.varianteId !== varianteId);
  }

  function cambiarCantidad(varianteId: string, delta: number) {
    const l = lineas.value.find((x) => x.varianteId === varianteId);
    if (!l) return;
    const nueva = l.cantidad + delta;
    if (nueva <= 0) {
      quitarLinea(varianteId);
      return;
    }
    l.cantidad = nueva;
  }

  function vaciarLineas() {
    if (lineas.value.length === 0) return;
    if (!globalThis.confirm('¿Quitar todos los productos de la venta?')) return;
    lineas.value = [];
    enfocarModoActual();
  }

  async function confirmarVenta() {
    if (confirmandoVenta.value) return;
    if (lineas.value.length === 0) {
      mostrarToast('Agregá al menos un producto al ticket.', 4000);
      return;
    }
    if (formaPago.value === 'CUENTA_CORRIENTE') {
      if (!clienteId.value) {
        mostrarToast('Para cuenta corriente elegí un cliente con crédito habilitado.', 4000);
        return;
      }
      if (!puedeCuentaCorriente.value) {
        mostrarToast('Ese cliente no tiene cuenta corriente.', 4000);
        formaPago.value = 'EFECTIVO';
        return;
      }
    }

    const lineasRegistro = lineas.value.map((l) => ({
      varianteId: l.varianteId,
      nombre: l.nombre,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      subtotal: l.cantidad * l.precioUnitario,
    }));

    confirmandoVenta.value = true;
    try {
      const registrada = await ventasStore.registrarVenta({
        clienteId: clienteId.value || null,
        nombreClienteMostrar: nombreClienteMostrar.value,
        documentoClienteMostrar: clienteId.value
          ? (clientesStore.clientePorId(clienteId.value)?.documento ?? '')
          : consumidorFinalDocumento.value.trim(),
        formaPago: formaPago.value,
        total: totalTicket.value,
        lineas: lineasRegistro,
        observaciones: observaciones.value,
      });

      await stockStore.cargar();
      if (registrada.formaPago === 'CUENTA_CORRIENTE' && registrada.clienteId) {
        await cuentaCorrienteStore.cargarMovimientosCliente(registrada.clienteId);
      }

      ventaConfirmada.value = registrada;
      resetBorrador();
    } catch (error: unknown) {
      mostrarToast(
        mensajeErrorHttp(error, 'No se pudo registrar la venta. Intentá de nuevo.'),
        5200,
      );
    } finally {
      confirmandoVenta.value = false;
    }
  }

  function cerrarExitoVenta() {
    ventaConfirmada.value = null;
    nextTick(() => enfocarModoActual());
  }

  async function imprimirResumenVentaConfirmada() {
    if (!ventaConfirmada.value) return;
    try {
      await exportarComprobanteVentaPdf(ventaConfirmada.value);
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error ? error.message : 'No se pudo exportar el comprobante de compra.';
      window.alert(mensaje);
    }
  }

  onMounted(() => {
    resetBorrador();
    nextTick(() => enfocarModoActual());
  });

  return {
    refInputLector,
    refInputNombre,
    modoProducto,
    codigoLector,
    busquedaNombre,
    varianteSeleccionadaId,
    textoBusquedaCliente,
    desplegableClienteAbierto,
    lineas,
    clienteId,
    consumidorFinalElegido,
    consumidorFinalDocumento,
    consumidorFinalNombreApellido,
    formaPago,
    observaciones,
    mensajeToast,
    ventaConfirmada,
    resultadosVariante,
    filaVarianteSeleccionada,
    esConsumidorFinal,
    mostrarOpcionConsumidorFinal,
    clientesSugeridos,
    totalTicket,
    cantidadArticulos,
    nombreClienteMostrar,
    puedeCuentaCorriente,
    puedeConfirmarVenta,
    confirmandoVenta,
    etiquetaClienteSelectorVenta,
    subtotalLinea,
    agregarPorLector,
    seleccionarVarianteNombre,
    agregarVarianteNombreSeleccionada,
    setModoProducto,
    elegirFormaPago,
    abrirDesplegableCliente,
    cerrarDesplegableCliente,
    alEscribirBusquedaCliente,
    seleccionarConsumidorFinal,
    seleccionarClienteRegistrado,
    alEscribirDocumentoConsumidorFinal,
    pedirLimpiar,
    quitarLinea,
    cambiarCantidad,
    vaciarLineas,
    confirmarVenta,
    cerrarExitoVenta,
    imprimirResumenVentaConfirmada,
  };
}

export const CLAVE_CENTRO_VENTAS = Symbol('centroVentas');

export type ContextoCentroVentas = ReturnType<typeof useCentroVentas>;
