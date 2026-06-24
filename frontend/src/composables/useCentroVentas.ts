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
import {
  calcularAjusteTicketDesdePorcentaje,
  etiquetaAjustePorcentaje,
  type TipoAjusteTicket,
} from '../modulos/ventas/ajusteTicketVentas';
import { usePermisosOperador } from './usePermisosOperador';
import { useEsMovil } from './useEsMovil';
import { useSesionStore } from '../stores/sesion';
import { notificarError } from '../utilidades/notificacion';
import { calcularCreditoDisponible } from '../utilidades/cuentaCorriente';
import { mensajeErrorHttp } from '../servicios/apiUtil';
import { useCuentaCorrienteStore } from '../stores/cuentaCorriente';
import {
  mapearCuponDescuentoApi,
  validarCuponCodigoApi,
} from '../servicios/cuponesDescuento.servicio';
import type { CuponDescuentoRegistrado } from '../tipos/cuponDescuento';
import {
  calcularAjusteCuponEnTicket,
  etiquetaValorDescuentoCupon,
  mensajeCuponAplicado,
} from '../tipos/cuponDescuento';
import {
  clasificarErrorCuponEscaneo,
  type ErrorCuponEscaneo,
  type TipoErrorCuponEscaneo,
} from '../modulos/postventa/mensajesErrorPostventa';

export type { ErrorCuponEscaneo, TipoErrorCuponEscaneo };

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

function clavePreferenciaCentroVentas(usuarioId: string, sufijo: string): string {
  return `erp-centro-ventas-${sufijo}-${usuarioId}`;
}

function leerModoIngresoPreferido(usuarioId: string): ModoIngresoCentroVentas | null {
  try {
    const raw = localStorage.getItem(clavePreferenciaCentroVentas(usuarioId, 'modo-ingreso'));
    if (raw === 'LECTOR' || raw === 'NOMBRE') return raw;
  } catch {
    /* almacenamiento no disponible */
  }
  return null;
}

function guardarModoIngresoPreferido(usuarioId: string, modo: ModoIngresoCentroVentas) {
  try {
    localStorage.setItem(clavePreferenciaCentroVentas(usuarioId, 'modo-ingreso'), modo);
  } catch {
    /* almacenamiento no disponible */
  }
}

function leerOnboardingVisto(usuarioId: string): boolean {
  try {
    return localStorage.getItem(clavePreferenciaCentroVentas(usuarioId, 'onboarding-visto')) === '1';
  } catch {
    return false;
  }
}

function guardarOnboardingVisto(usuarioId: string) {
  try {
    localStorage.setItem(clavePreferenciaCentroVentas(usuarioId, 'onboarding-visto'), '1');
  } catch {
    /* almacenamiento no disponible */
  }
}

export function useCentroVentas() {
  const catalogo = useCatalogoStore();
  const clientesStore = useClientesStore();
  const ventasStore = useVentasStore();
  const stockStore = useStockStore();
  const cuentaCorrienteStore = useCuentaCorrienteStore();
  const sesionStore = useSesionStore();
  const { tienePermiso } = usePermisosOperador();
  const esMovil = useEsMovil();
  const { variantes } = storeToRefs(catalogo);
  const { clientes } = storeToRefs(clientesStore);

  const refInputLector = ref<HTMLInputElement | null>(null);
  const refInputNombre = ref<HTMLInputElement | null>(null);

  const modoProducto = ref<ModoIngresoCentroVentas>('LECTOR');
  const codigoLector = ref('');
  const codigoCuponEscaneo = ref('');
  const cuponAplicado = ref<CuponDescuentoRegistrado | null>(null);
  const validandoCupon = ref(false);
  const modalEscanearCuponAbierto = ref(false);
  const errorEscanearCupon = ref<ErrorCuponEscaneo | null>(null);
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
  const tipoAjusteTicket = ref<TipoAjusteTicket>('NINGUNO');
  const porcentajeAjusteTexto = ref('');
  const observaciones = ref('');
  const mensajeToast = ref('');
  const ventaConfirmada = ref<VentaRegistrada | null>(null);
  const confirmandoVenta = ref(false);
  const mostrarOnboarding = ref(false);
  let idToast: ReturnType<typeof setTimeout> | null = null;

  const usuarioId = computed(() => sesionStore.usuario?.id ?? 'anon');

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

  function varianteTieneStock(varianteId: string): boolean {
    return stockStore.cantidadActual(varianteId) > 0;
  }

  function cantidadEnTicket(varianteId: string): number {
    return lineas.value.find((l) => l.varianteId === varianteId)?.cantidad ?? 0;
  }

  function stockRestanteParaVariante(varianteId: string): number {
    return Math.max(0, stockStore.cantidadActual(varianteId) - cantidadEnTicket(varianteId));
  }

  function avisarStockInsuficiente(varianteId: string) {
    const restante = stockRestanteParaVariante(varianteId);
    const stockTotal = stockStore.cantidadActual(varianteId);
    if (stockTotal <= 0) {
      mostrarToast('No hay stock disponible para este artículo.', 4000);
      return;
    }
    mostrarToast(
      `Stock insuficiente. Podés agregar ${restante} unidad${restante === 1 ? '' : 'es'} más.`,
      4200,
    );
  }

  function puedeIncrementarCantidadEnTicket(varianteId: string, delta: number): boolean {
    if (delta <= 0) return true;
    const linea = lineas.value.find((l) => l.varianteId === varianteId);
    const cantidadNueva = (linea?.cantidad ?? 0) + delta;
    if (cantidadNueva <= stockStore.cantidadActual(varianteId)) return true;
    avisarStockInsuficiente(varianteId);
    return false;
  }

  const resultadosVariante = computed(() => {
    const q = busquedaNombre.value.trim();
    if (!q) return [];
    return [...filasVarianteActivas.value]
      .filter((f) => coincideBusquedaVariante(f, q) && varianteTieneStock(f.variante.id))
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

  const subtotalTicket = computed(() =>
    lineas.value.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0),
  );

  const ajusteTicketCalculado = computed(() =>
    calcularAjusteTicketDesdePorcentaje(
      subtotalTicket.value,
      tipoAjusteTicket.value,
      porcentajeAjusteTexto.value,
    ),
  );

  const ajusteCuponCalculado = computed(() => {
    if (!cuponAplicado.value) return null;
    return calcularAjusteCuponEnTicket(cuponAplicado.value, subtotalTicket.value);
  });

  const ajusteMontoTicket = computed(() => {
    if (ajusteCuponCalculado.value) return ajusteCuponCalculado.value.ajusteMonto;
    return ajusteTicketCalculado.value.ajusteMonto;
  });

  const porcentajeAjusteTicket = computed(() => {
    if (ajusteCuponCalculado.value) return ajusteCuponCalculado.value.ajustePorcentaje;
    return ajusteTicketCalculado.value.porcentaje;
  });

  const totalTicket = computed(() => Math.max(0, subtotalTicket.value + ajusteMontoTicket.value));

  const etiquetaAjusteTicketActivo = computed(() => {
    if (cuponAplicado.value) {
      const valor = etiquetaValorDescuentoCupon(cuponAplicado.value);
      return cuponAplicado.value.tipoDescuento === 'monto_fijo'
        ? `Descuento cupón ${valor}`
        : `Descuento cupón ${valor}`;
    }
    return etiquetaAjustePorcentaje(tipoAjusteTicket.value, porcentajeAjusteTicket.value);
  });

  const montoAjusteTicketAbsoluto = computed(() => Math.abs(ajusteMontoTicket.value));

  const hayAjusteTicketActivo = computed(() => ajusteMontoTicket.value !== 0);

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

  const clienteSeleccionado = computed(() =>
    clienteId.value ? clientesStore.clientePorId(clienteId.value) : null,
  );

  const saldoDeudorClienteSeleccionado = computed(() => {
    if (!clienteId.value) return 0;
    return Math.max(0, cuentaCorrienteStore.saldoClienteCacheado(clienteId.value));
  });

  const creditoDisponibleCliente = computed(() => {
    const c = clienteSeleccionado.value;
    if (!c?.cuentaCorrienteHabilitada) return null;
    const limite = c.limiteCompraCuentaCorriente;
    if (limite <= 0) return null;
    const saldo = cuentaCorrienteStore.saldoClienteCacheado(c.id);
    return calcularCreditoDisponible(limite, saldo);
  });

  const tieneLimiteCuentaCorriente = computed(
    () => creditoDisponibleCliente.value !== null,
  );

  const excedeCreditoCuentaCorriente = computed(() => {
    if (formaPago.value !== 'CUENTA_CORRIENTE') return false;
    if (!tieneLimiteCuentaCorriente.value) return false;
    return totalTicket.value > (creditoDisponibleCliente.value ?? 0) + 0.001;
  });

  const puedeConfirmarVenta = computed(
    () =>
      tienePermiso('puedeRegistrarVentas') &&
      !confirmandoVenta.value &&
      lineas.value.length > 0 &&
      (formaPago.value !== 'CUENTA_CORRIENTE' || puedeCuentaCorriente.value) &&
      !excedeCreditoCuentaCorriente.value,
  );

  const motivoNoConfirmarVenta = computed((): string => {
    if (!tienePermiso('puedeRegistrarVentas')) {
      return 'Necesitás permiso para registrar ventas.';
    }
    if (confirmandoVenta.value) return 'Registrando la venta…';
    if (lineas.value.length === 0) return 'Agregá al menos un producto al ticket.';
    if (formaPago.value === 'CUENTA_CORRIENTE' && !puedeCuentaCorriente.value) {
      return 'Elegí un cliente con cuenta corriente habilitada.';
    }
    if (excedeCreditoCuentaCorriente.value) {
      const disponible = creditoDisponibleCliente.value ?? 0;
      return `El total supera el crédito disponible (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(disponible)}).`;
    }
    return '';
  });

  watch(clienteId, (id) => {
    if (id) {
      const c = clientesStore.clientePorId(id);
      if (c?.cuentaCorrienteHabilitada) {
        void cuentaCorrienteStore.cargarSaldos([id]);
      }
    }
    if (formaPago.value === 'CUENTA_CORRIENTE' && !puedeCuentaCorriente.value) {
      formaPago.value = 'EFECTIVO';
    }
    if (cuponAplicado.value?.clienteId && cuponAplicado.value.clienteId !== (id || null)) {
      quitarCuponAplicado();
      mostrarToast('Se quitó el cupón porque pertenece a otro cliente.', 4000);
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

  function modoProductoPorDefecto(): ModoIngresoCentroVentas {
    return esMovil.value ? 'NOMBRE' : 'LECTOR';
  }

  function modoProductoInicial(): ModoIngresoCentroVentas {
    const preferido = leerModoIngresoPreferido(usuarioId.value);
    if (preferido && !(esMovil.value && preferido === 'LECTOR')) {
      return preferido;
    }
    return modoProductoPorDefecto();
  }

  function cerrarOnboarding(persistir = false) {
    if (persistir) {
      guardarOnboardingVisto(usuarioId.value);
    }
    mostrarOnboarding.value = false;
  }

  function reabrirOnboarding() {
    mostrarOnboarding.value = true;
  }

  function enfocarIngresoProducto() {
    enfocarModoActual();
  }

  watch(esMovil, (movil) => {
    if (movil && modoProducto.value === 'LECTOR') {
      modoProducto.value = 'NOMBRE';
    }
  });

  watch(modoProducto, () => {
    nextTick(() => enfocarModoActual());
  });

  function enfocarModoActual() {
    nextTick(() => {
      if (!esMovil.value && modoProducto.value === 'LECTOR') {
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
    modoProducto.value = modoProductoInicial();
    textoBusquedaCliente.value = '';
    desplegableClienteAbierto.value = false;
    lineas.value = [];
    clienteId.value = '';
    consumidorFinalElegido.value = false;
    consumidorFinalDocumento.value = '';
    consumidorFinalNombreApellido.value = '';
    formaPago.value = 'EFECTIVO';
    tipoAjusteTicket.value = 'NINGUNO';
    porcentajeAjusteTexto.value = '';
    observaciones.value = '';
    codigoCuponEscaneo.value = '';
    cuponAplicado.value = null;
    validandoCupon.value = false;
    modalEscanearCuponAbierto.value = false;
    errorEscanearCupon.value = null;
  }

  function aplicarCuponAlTicket(cupon: CuponDescuentoRegistrado) {
    cuponAplicado.value = cupon;
    if (cupon.tipoDescuento === 'porcentaje' && cupon.porcentajeDescuento != null) {
      tipoAjusteTicket.value = 'DESCUENTO';
      porcentajeAjusteTexto.value = String(cupon.porcentajeDescuento);
    } else {
      tipoAjusteTicket.value = 'DESCUENTO';
      porcentajeAjusteTexto.value = '';
    }
  }

  function quitarCuponAplicado() {
    cuponAplicado.value = null;
    codigoCuponEscaneo.value = '';
    tipoAjusteTicket.value = 'NINGUNO';
    porcentajeAjusteTexto.value = '';
    errorEscanearCupon.value = null;
  }

  function abrirModalEscanearCupon() {
    if (validandoCupon.value) return;
    errorEscanearCupon.value = null;
    codigoCuponEscaneo.value = '';
    modalEscanearCuponAbierto.value = true;
  }

  function cerrarModalEscanearCupon() {
    modalEscanearCuponAbierto.value = false;
    errorEscanearCupon.value = null;
    codigoCuponEscaneo.value = '';
  }

  async function aplicarCodigoCupon() {
    const codigoNorm = codigoCuponEscaneo.value.trim();
    if (!codigoNorm) {
      errorEscanearCupon.value = {
        tipo: 'vacio',
        mensaje: 'Escaneá o ingresá el código del cupón.',
      };
      return;
    }
    if (validandoCupon.value) return;

    validandoCupon.value = true;
    errorEscanearCupon.value = null;
    try {
      const cuponApi = await validarCuponCodigoApi(codigoNorm, clienteId.value || null);
      const cupon = mapearCuponDescuentoApi(cuponApi);
      if (cuponAplicado.value && cuponAplicado.value.id !== cupon.id) {
        quitarCuponAplicado();
      }
      aplicarCuponAlTicket(cupon);
      cerrarModalEscanearCupon();
      mostrarToast(mensajeCuponAplicado(cupon), 3800);
    } catch (error: unknown) {
      errorEscanearCupon.value = clasificarErrorCuponEscaneo(
        error,
        'No se pudo validar el cupón. Revisá el código e intentá de nuevo.',
      );
      codigoCuponEscaneo.value = '';
    } finally {
      validandoCupon.value = false;
    }
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
    if (!puedeIncrementarCantidadEnTicket(variante.id, 1)) return;
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
    if (esMovil.value && m === 'LECTOR') return;
    modoProducto.value = m;
    guardarModoIngresoPreferido(usuarioId.value, m);
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
    if (!puedeIncrementarCantidadEnTicket(varianteId, delta)) return;
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
      if (excedeCreditoCuentaCorriente.value) {
        const disponible = creditoDisponibleCliente.value ?? 0;
        mostrarToast(
          `El total supera el crédito disponible (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(disponible)}).`,
          5200,
        );
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
        ajusteMonto: ajusteMontoTicket.value,
        ajustePorcentaje: porcentajeAjusteTicket.value,
        lineas: lineasRegistro,
        observaciones: observaciones.value,
        cuponDescuentoId: cuponAplicado.value?.id ?? null,
      });

      await stockStore.cargar({ forzar: true });
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
      notificarError(mensaje);
    }
  }

  onMounted(() => {
    mostrarOnboarding.value = !leerOnboardingVisto(usuarioId.value);
    resetBorrador();
    nextTick(() => enfocarModoActual());
  });

  return {
    refInputLector,
    refInputNombre,
    esMovil,
    mostrarOnboarding,
    modoProducto,
    codigoLector,
    codigoCuponEscaneo,
    cuponAplicado,
    validandoCupon,
    modalEscanearCuponAbierto,
    errorEscanearCupon,
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
    tipoAjusteTicket,
    porcentajeAjusteTexto,
    observaciones,
    mensajeToast,
    ventaConfirmada,
    resultadosVariante,
    filaVarianteSeleccionada,
    esConsumidorFinal,
    mostrarOpcionConsumidorFinal,
    clientesSugeridos,
    subtotalTicket,
    ajusteMontoTicket,
    porcentajeAjusteTicket,
    montoAjusteTicketAbsoluto,
    etiquetaAjusteTicketActivo,
    hayAjusteTicketActivo,
    totalTicket,
    cantidadArticulos,
    nombreClienteMostrar,
    puedeCuentaCorriente,
    creditoDisponibleCliente,
    saldoDeudorClienteSeleccionado,
    tieneLimiteCuentaCorriente,
    excedeCreditoCuentaCorriente,
    puedeConfirmarVenta,
    motivoNoConfirmarVenta,
    confirmandoVenta,
    etiquetaClienteSelectorVenta,
    subtotalLinea,
    agregarPorLector,
    seleccionarVarianteNombre,
    agregarVarianteNombreSeleccionada,
    enfocarIngresoProducto,
    setModoProducto,
    cerrarOnboarding,
    reabrirOnboarding,
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
    abrirModalEscanearCupon,
    cerrarModalEscanearCupon,
    aplicarCodigoCupon,
    quitarCuponAplicado,
  };
}

export const CLAVE_CENTRO_VENTAS = Symbol('centroVentas');

export type ContextoCentroVentas = ReturnType<typeof useCentroVentas>;
