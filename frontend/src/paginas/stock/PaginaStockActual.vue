<script setup lang="ts">
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  Info,
  PackagePlus,
  RefreshCw,
  ScanBarcode,
  Upload,
  Warehouse,
} from 'lucide-vue-next';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import {
  descargarPlantillaConteoFisico,
  parsearArchivoConteoFisico,
  type CambioConteoPrevisto,
} from '../../modulos/inventario/plantillaConteoFisico';
import {
  exportarReporteCambioConteoPdf,
  type MetadatosReporteCambioConteo,
} from '../../modulos/inventario/reporteCambioConteo';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import {
  parsearCantidadFisica,
  requiereObservacionConteo,
  useConteoEnPantalla,
} from '../../composables/useConteoEnPantalla';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useCatalogoStore } from '../../stores/catalogo';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useSesionStore } from '../../stores/sesion';
import { useStockStore } from '../../stores/stock';
import { etiquetaTalleColor } from '../../modulos/catalogo/catalogoPresentacion';
import type { Producto, Variante } from '../../tipos/catalogo';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('stock-actual');

interface FilaStock {
  variante: Variante;
  producto: Producto;
  existencia: number;
}

interface GrupoStockProducto {
  producto: Producto;
  filas: FilaStock[];
}

const catalogoStore = useCatalogoStore();
const stockStore = useStockStore();
const configuracionSistemaStore = useConfiguracionSistemaStore();
const sesionStore = useSesionStore();
const { tienePermiso } = usePermisosOperador();
const { categorias, variantes } = storeToRefs(catalogoStore);
const { parametros: parametrosSistema } = storeToRefs(configuracionSistemaStore);

const conteoEnPantalla = useConteoEnPantalla(catalogoStore, stockStore);

const umbralStockBajo = computed(() => parametrosSistema.value.stockMinimoAlerta);

const movimientoManualHabilitadoEnSistema = computed(
  () => parametrosSistema.value.movimientoManualStockHabilitado,
);

const puedeAjustarConteo = computed(() => tienePermiso('puedeAjustarStock'));
const puedeEntradaManual = computed(
  () =>
    movimientoManualHabilitadoEnSistema.value && tienePermiso('puedeMoverStockManualmente'),
);

const textoBannerRestricciones = computed(() => {
  if (puedeAjustarConteo.value && puedeEntradaManual.value) return '';

  const partes: string[] = [];

  if (!puedeAjustarConteo.value) {
    partes.push('Los conteos físicos requieren el permiso de conteos de inventario.');
  }
  if (!tienePermiso('puedeMoverStockManualmente')) {
    partes.push('Las entradas manuales requieren el permiso «Movimiento manual de stock».');
  } else if (!movimientoManualHabilitadoEnSistema.value) {
    partes.push('Las entradas manuales están deshabilitadas en Configuración → Sistema.');
  }

  if (partes.length === 0) return '';

  return `Podés consultar existencias y filtros. ${partes.join(' ')} El stock también se actualiza al registrar compras.`;
});

const columnasTablaStock = 6;
const busqueda = ref('');
const categoriaSeleccionada = ref<string>('');
const soloStockCritico = ref(false);
const soloStockBajo = ref(false);
const productosConVariantesVisibles = ref<Set<string>>(new Set());
const mensajeToast = ref('');
const tipoMensajeToast = ref<'error' | 'ok'>('ok');
let idToast: ReturnType<typeof setTimeout> | null = null;

const refModalEntrada = useTemplateRef('refModalEntrada');
const refModalConfirmarConteo = useTemplateRef('refModalConfirmarConteo');
const refModalExitoConteo = useTemplateRef('refModalExitoConteo');
const refModalConteoUnitario = useTemplateRef('refModalConteoUnitario');
const refModalDescartarConteo = useTemplateRef('refModalDescartarConteo');
const refInputImportarConteo = useTemplateRef('refInputImportarConteo');

const origenConteoConfirmacion = ref<'excel' | 'pantalla'>('excel');
const inputsConteoFila = ref<Record<string, string>>({});
const filaConteoEscaneada = ref<FilaStock | null>(null);
const cantidadEscaneoTexto = ref('');

const filaConteoUnitario = ref<FilaStock | null>(null);
const cantidadConteoUnitarioTexto = ref('');
const observacionConteoUnitario = ref('');
const mensajeConteoUnitario = ref('');
const aplicandoConteoUnitario = ref(false);

const cambiosConteoPendientes = ref<CambioConteoPrevisto[]>([]);
const erroresParseoConteo = ref<string[]>([]);
const advertenciasParseoConteo = ref<string[]>([]);
const resumenParseoConteo = ref({ filasIgnoradasVacias: 0, filasSinCambio: 0 });
const nombreArchivoConteo = ref('');
const observacionImportacionConteo = ref('');
const mensajeModalConfirmarConteo = ref('');
const importandoConteo = ref(false);

const cambiosConteoAplicados = ref<CambioConteoPrevisto[]>([]);
const metadatosExitoConteo = ref<MetadatosReporteCambioConteo>({
  nombreArchivoOrigen: '',
  observacion: '',
  operador: '',
});
const cantidadAjustesAplicados = ref(0);
const exportandoReporteConteo = ref(false);
const mensajeModalExitoConteo = ref('');

const varianteEntradaSeleccionada = ref<Variante | null>(null);
const productoEntradaSeleccionado = ref<Producto | null>(null);
const unidadesEntradaTexto = ref('');
const observacionEntradaTexto = ref('');
const mensajeModalEntrada = ref('');

const filasFiltradas = computed((): FilaStock[] => {
  const textoBusqueda = busqueda.value.trim().toLowerCase();
  const idCategoriaFiltro = categoriaSeleccionada.value.trim();

  return variantes.value
    .filter((v) => v.activa)
    .map((variante): FilaStock | null => {
      const producto = catalogoStore.productoPorId(variante.productoId);
      if (!producto) return null;
      return {
        variante,
        producto,
        existencia: stockStore.cantidadActual(variante.id),
      };
    })
    .filter((fila): fila is FilaStock => fila !== null)
    .filter(({ producto }) => !idCategoriaFiltro || producto.categoriaId === idCategoriaFiltro)
    .filter(({ existencia }) => {
      if (soloStockCritico.value) return existencia === 0;
      if (soloStockBajo.value) return existencia > 0 && existencia <= umbralStockBajo.value;
      return true;
    })
    .filter(({ variante, producto }) => {
      if (!textoBusqueda) return true;
      const agregado =
        `${producto.nombre} ${producto.marca} ${producto.descripcion} ${variante.talle} ${variante.color} ${variante.codigoBarras} ${catalogoStore.nombreCategoria(producto.categoriaId)}`
          .toLowerCase()
          .trim();
      return agregado.includes(textoBusqueda);
    })
    .sort((a, b) => {
      const porNombre = a.producto.nombre.localeCompare(b.producto.nombre, 'es', {
        sensitivity: 'base',
      });
      if (porNombre !== 0) return porNombre;
      return etiquetaTalleColor(a.variante.talle, a.variante.color).localeCompare(
        etiquetaTalleColor(b.variante.talle, b.variante.color),
        'es',
        { sensitivity: 'base' }
      );
    });
});

const gruposFiltrados = computed((): GrupoStockProducto[] => {
  const mapa = new Map<string, GrupoStockProducto>();
  for (const fila of filasFiltradas.value) {
    const existente = mapa.get(fila.producto.id);
    if (existente) {
      existente.filas.push(fila);
      continue;
    }
    mapa.set(fila.producto.id, { producto: fila.producto, filas: [fila] });
  }
  return [...mapa.values()].sort((a, b) =>
    a.producto.nombre.localeCompare(b.producto.nombre, 'es', { sensitivity: 'base' }),
  );
});

const filasParaConteoFisico = computed((): FilaStock[] => {
  return variantes.value
    .filter((v) => v.activa)
    .map((variante): FilaStock | null => {
      const producto = catalogoStore.productoPorId(variante.productoId);
      if (!producto) return null;
      return {
        variante,
        producto,
        existencia: stockStore.cantidadActual(variante.id),
      };
    })
    .filter((fila): fila is FilaStock => fila !== null)
    .sort((a, b) => {
      const porNombre = a.producto.nombre.localeCompare(b.producto.nombre, 'es', {
        sensitivity: 'base',
      });
      if (porNombre !== 0) return porNombre;
      return etiquetaTalleColor(a.variante.talle, a.variante.color).localeCompare(
        etiquetaTalleColor(b.variante.talle, b.variante.color),
        'es',
        { sensitivity: 'base' },
      );
    });
});

function limpiarFiltros(): void {
  busqueda.value = '';
  categoriaSeleccionada.value = '';
  soloStockCritico.value = false;
  soloStockBajo.value = false;
}

watch(soloStockCritico, (marca) => {
  if (marca) soloStockBajo.value = false;
});

watch(soloStockBajo, (marca) => {
  if (marca) soloStockCritico.value = false;
});

watch([busqueda, categoriaSeleccionada, soloStockCritico, soloStockBajo], () => {
  productosConVariantesVisibles.value = new Set();
});

function estaProductoExpandido(productoId: string): boolean {
  return productosConVariantesVisibles.value.has(productoId);
}

function alternarVariantesProducto(productoId: string): void {
  const siguiente = new Set(productosConVariantesVisibles.value);
  if (siguiente.has(productoId)) siguiente.delete(productoId);
  else siguiente.add(productoId);
  productosConVariantesVisibles.value = siguiente;
}

function existenciaTotalGrupo(grupo: GrupoStockProducto): number {
  return grupo.filas.reduce((suma, fila) => suma + fila.existencia, 0);
}

function claseEstadoGrupo(grupo: GrupoStockProducto): string {
  if (grupo.filas.some((fila) => fila.existencia === 0)) return claseEstadoCantidad(0);
  const minimo = Math.min(...grupo.filas.map((fila) => fila.existencia));
  return claseEstadoCantidad(minimo);
}

function textoEstadoGrupo(grupo: GrupoStockProducto): string {
  if (grupo.filas.some((fila) => fila.existencia === 0)) return 'Con faltantes';
  const minimo = Math.min(...grupo.filas.map((fila) => fila.existencia));
  if (minimo <= umbralStockBajo.value) return 'Stock bajo';
  return 'En rango normal';
}

const opcionesCategoriaParaFiltro = computed(() =>
  categorias.value.map((c) => ({ etiqueta: c.nombre, valor: c.id }))
);

const hayFiltrosActivos = computed(
  () =>
    Boolean(busqueda.value.trim()) ||
    Boolean(categoriaSeleccionada.value) ||
    soloStockCritico.value ||
    soloStockBajo.value,
);

function claseEstadoCantidad(unidades: number): string {
  if (unidades === 0) return 'stk-chip stk-chip--agotado';
  if (unidades <= umbralStockBajo.value) return 'stk-chip stk-chip--bajo';
  return 'stk-chip stk-chip--normal';
}

function textoEstadoCantidad(unidades: number): string {
  if (unidades === 0) return 'Sin stock';
  if (unidades <= umbralStockBajo.value) return 'Stock bajo';
  return 'En rango normal';
}

function mostrarToast(texto: string, tipo: 'error' | 'ok'): void {
  mensajeToast.value = texto;
  tipoMensajeToast.value = tipo;
  if (idToast) clearTimeout(idToast);
  idToast = setTimeout(() => {
    mensajeToast.value = '';
  }, 4000);
}

function generarPlantillaConteoFisico(): void {
  try {
    descargarPlantillaConteoFisico(
      filasParaConteoFisico.value.map((fila) => ({
        variante: fila.variante,
        producto: fila.producto,
        cantidadActual: fila.existencia,
      })),
    );
    mostrarToast(
      `Plantilla descargada con ${filasParaConteoFisico.value.length} artículos. Completá la columna «Stock físico» y volvé a importarla.`,
      'ok',
    );
  } catch (error) {
    const texto = error instanceof Error ? error.message : 'No se pudo generar la plantilla.';
    mostrarToast(texto, 'error');
  }
}

const totalUnidadesAjusteConteo = computed(() =>
  cambiosConteoPendientes.value.reduce((suma, fila) => suma + Math.abs(fila.delta), 0),
);

const observacionConteoObligatoria = computed(() =>
  requiereObservacionConteo(cambiosConteoPendientes.value),
);

const puedeConfirmarConteo = computed(
  () =>
    !importandoConteo.value &&
    erroresParseoConteo.value.length === 0 &&
    cambiosConteoPendientes.value.length > 0 &&
    (!observacionConteoObligatoria.value || Boolean(observacionImportacionConteo.value.trim())),
);

function abrirSelectorImportarConteo(): void {
  refInputImportarConteo.value?.click();
}

function limpiarEstadoConfirmacionConteo(): void {
  cambiosConteoPendientes.value = [];
  erroresParseoConteo.value = [];
  advertenciasParseoConteo.value = [];
  resumenParseoConteo.value = { filasIgnoradasVacias: 0, filasSinCambio: 0 };
  nombreArchivoConteo.value = '';
  observacionImportacionConteo.value = '';
  mensajeModalConfirmarConteo.value = '';
  importandoConteo.value = false;
  origenConteoConfirmacion.value = 'excel';
}

function limpiarEstadoExitoConteo(): void {
  cambiosConteoAplicados.value = [];
  metadatosExitoConteo.value = {
    nombreArchivoOrigen: '',
    observacion: '',
    operador: '',
  };
  cantidadAjustesAplicados.value = 0;
  exportandoReporteConteo.value = false;
  mensajeModalExitoConteo.value = '';
}

function cerrarModalExitoConteo(): void {
  refModalExitoConteo.value?.close();
}

function alCerrarModalExitoConteo(): void {
  limpiarEstadoExitoConteo();
}

function volverAlMenuStock(): void {
  cerrarModalExitoConteo();
  limpiarFiltros();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cerrarModalConfirmarConteo(): void {
  refModalConfirmarConteo.value?.close();
}

function alCerrarModalConfirmarConteo(): void {
  limpiarEstadoConfirmacionConteo();
}

function claseDeltaConteo(delta: number): string {
  if (delta > 0) return 'stk-delta stk-delta--sube';
  if (delta < 0) return 'stk-delta stk-delta--baja';
  return 'stk-delta';
}

function textoDeltaConteo(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

async function alSeleccionarArchivoConteo(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;

  limpiarEstadoConfirmacionConteo();
  origenConteoConfirmacion.value = 'excel';
  nombreArchivoConteo.value = archivo.name;

  try {
    const resultado = await parsearArchivoConteoFisico(
      archivo,
      variantes.value.filter((v) => v.activa),
      (id) => catalogoStore.productoPorId(id),
      (varianteId) => stockStore.cantidadActual(varianteId),
    );

    cambiosConteoPendientes.value = resultado.cambios;
    erroresParseoConteo.value = resultado.errores;
    advertenciasParseoConteo.value = resultado.advertencias;
    resumenParseoConteo.value = {
      filasIgnoradasVacias: resultado.filasIgnoradasVacias,
      filasSinCambio: resultado.filasSinCambio,
    };

    if (resultado.errores.length > 0) {
      mostrarToast('Revisá los errores del archivo antes de confirmar la importación.', 'error');
    } else if (resultado.cambios.length === 0) {
      mostrarToast('No hay cambios de stock para aplicar en el archivo.', 'error');
    }

    nextTick(() => refModalConfirmarConteo.value?.showModal());
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudo leer el archivo Excel.'), 'error');
  }
}

async function confirmarImportacionConteo(): Promise<void> {
  if (!puedeConfirmarConteo.value) return;

  importandoConteo.value = true;
  mensajeModalConfirmarConteo.value = '';

  const cambiosSnapshot = [...cambiosConteoPendientes.value];
  const origenSnapshot = origenConteoConfirmacion.value;
  const metadatosSnapshot: MetadatosReporteCambioConteo = {
    nombreArchivoOrigen:
      origenSnapshot === 'pantalla' ? 'Conteo en pantalla' : nombreArchivoConteo.value,
    observacion: observacionImportacionConteo.value.trim(),
    operador: sesionStore.usuario?.nombreUsuario ?? '—',
  };

  try {
    const resultado = await stockStore.aplicarImportacionConteoMasivo(
      cambiosSnapshot.map((fila) => ({
        varianteId: fila.varianteId,
        cantidadFisicaContada: fila.cantidadNueva,
      })),
      metadatosSnapshot.observacion || undefined,
    );
    cerrarModalConfirmarConteo();
    limpiarEstadoConfirmacionConteo();
    if (origenSnapshot === 'pantalla') {
      conteoEnPantalla.desactivar();
      inputsConteoFila.value = {};
    }

    cambiosConteoAplicados.value = cambiosSnapshot;
    metadatosExitoConteo.value = metadatosSnapshot;
    cantidadAjustesAplicados.value = resultado.lineasProcesadas;

    nextTick(() => refModalExitoConteo.value?.showModal());
  } catch (error) {
    mensajeModalConfirmarConteo.value = mensajeErrorHttp(
      error,
      'No se pudo aplicar el conteo. Intentá de nuevo.',
    );
  } finally {
    importandoConteo.value = false;
  }
}

async function exportarReporteCambioConteo(): Promise<void> {
  if (cambiosConteoAplicados.value.length === 0 || exportandoReporteConteo.value) return;

  exportandoReporteConteo.value = true;
  mensajeModalExitoConteo.value = '';

  try {
    await exportarReporteCambioConteoPdf(cambiosConteoAplicados.value, metadatosExitoConteo.value);
  } catch (error) {
    mensajeModalExitoConteo.value = mensajeErrorHttp(
      error,
      'No se pudo generar el reporte. Revisá que el navegador permita ventanas emergentes.',
    );
  } finally {
    exportandoReporteConteo.value = false;
  }
}

function abrirModalEntrada(fila: FilaStock): void {
  mensajeModalEntrada.value = '';
  varianteEntradaSeleccionada.value = fila.variante;
  productoEntradaSeleccionado.value = fila.producto;
  unidadesEntradaTexto.value = '';
  observacionEntradaTexto.value = '';
  nextTick(() => refModalEntrada.value?.showModal());
}

function cerrarModalEntrada(): void {
  refModalEntrada.value?.close();
}

function alCerrarModalEntrada(): void {
  varianteEntradaSeleccionada.value = null;
  productoEntradaSeleccionado.value = null;
}

function guardarModalEntrada(): void {
  const variante = varianteEntradaSeleccionada.value;
  if (!variante || !sesionStore.usuario) return;

  const unidadesRaw = Number(String(unidadesEntradaTexto.value).replace(',', '.'));
  const unidades = Math.floor(Math.abs(unidadesRaw));
  if (!Number.isFinite(unidadesRaw) || unidades <= 0) {
    mensajeModalEntrada.value =
      'Ingresá un número entero positivo (cantidad que ingresa al inventario físico).';
    return;
  }

  void stockStore
    .aplicarEntradaManual(
      variante.id,
      catalogoStore.nombreLineaComercial(variante.id),
      unidades,
      observacionEntradaTexto.value.trim() || undefined,
    )
    .then(() => cerrarModalEntrada())
    .catch(() => {
      mensajeModalEntrada.value = 'No se pudo registrar la entrada. Intentá de nuevo.';
    });
}

function alternarModoConteoEnPantalla(): void {
  if (conteoEnPantalla.activo.value) {
    if (conteoEnPantalla.cantidadPendientes.value > 0) {
      refModalDescartarConteo.value?.showModal();
      return;
    }
    conteoEnPantalla.desactivar();
    inputsConteoFila.value = {};
    return;
  }
  conteoEnPantalla.activar();
  mostrarToast(
    'Modo conteo activo. Cada ajuste queda en borrador hasta que lo confirmés con revisión previa.',
    'ok',
  );
}

function confirmarSalidaModoConteo(): void {
  conteoEnPantalla.desactivar();
  inputsConteoFila.value = {};
  refModalDescartarConteo.value?.close();
}

function registrarConteoFila(fila: FilaStock): void {
  const texto = inputsConteoFila.value[fila.variante.id] ?? '';
  const error = conteoEnPantalla.registrarCantidadFila(fila, texto);
  if (error) {
    mostrarToast(error, 'error');
    return;
  }
  delete inputsConteoFila.value[fila.variante.id];
  inputsConteoFila.value = { ...inputsConteoFila.value };
}

function valorInputConteoFila(varianteId: string, existencia: number): string {
  const enSesion = conteoEnPantalla.cantidadEnSesion(varianteId);
  if (enSesion != null) return String(enSesion);
  return inputsConteoFila.value[varianteId] ?? String(existencia);
}

function actualizarInputConteoFila(varianteId: string, valor: string): void {
  inputsConteoFila.value = { ...inputsConteoFila.value, [varianteId]: valor };
}

function abrirConfirmacionConteoPantalla(): void {
  const cambios = conteoEnPantalla.cambiosPrevistos.value;
  if (cambios.length === 0) {
    mostrarToast('No hay diferencias entre lo contado y el stock del sistema.', 'error');
    return;
  }
  limpiarEstadoConfirmacionConteo();
  origenConteoConfirmacion.value = 'pantalla';
  nombreArchivoConteo.value = 'Conteo en pantalla';
  cambiosConteoPendientes.value = cambios;
  nextTick(() => refModalConfirmarConteo.value?.showModal());
}

function alEnviarEscaneoConteo(): void {
  const codigo = conteoEnPantalla.textoEscaneo.value.trim();
  if (!codigo) return;
  const fila = conteoEnPantalla.buscarVariantePorCodigo(codigo);
  if (!fila) {
    conteoEnPantalla.mensajeEscaneo.value = 'No hay una variante activa con ese código.';
    return;
  }
  filaConteoEscaneada.value = fila;
  cantidadEscaneoTexto.value = String(
    conteoEnPantalla.cantidadEnSesion(fila.variante.id) ?? fila.existencia,
  );
  conteoEnPantalla.textoEscaneo.value = '';
  conteoEnPantalla.mensajeEscaneo.value = '';
}

function confirmarConteoEscaneado(): void {
  if (!filaConteoEscaneada.value) return;
  const error = conteoEnPantalla.registrarCantidadFila(
    filaConteoEscaneada.value,
    cantidadEscaneoTexto.value,
  );
  if (error) {
    conteoEnPantalla.mensajeEscaneo.value = error;
    return;
  }
  filaConteoEscaneada.value = null;
  cantidadEscaneoTexto.value = '';
  mostrarToast('Cantidad agregada al borrador del conteo.', 'ok');
}

function abrirConteoUnitario(fila: FilaStock): void {
  filaConteoUnitario.value = fila;
  cantidadConteoUnitarioTexto.value = String(fila.existencia);
  observacionConteoUnitario.value = '';
  mensajeConteoUnitario.value = '';
  nextTick(() => refModalConteoUnitario.value?.showModal());
}

function cerrarConteoUnitario(): void {
  refModalConteoUnitario.value?.close();
}

function alCerrarConteoUnitario(): void {
  filaConteoUnitario.value = null;
}

const deltaConteoUnitario = computed(() => {
  const fila = filaConteoUnitario.value;
  if (!fila) return 0;
  const cantidad = parsearCantidadFisica(cantidadConteoUnitarioTexto.value);
  if (cantidad === null) return 0;
  return cantidad - fila.existencia;
});

async function confirmarConteoUnitario(): Promise<void> {
  const fila = filaConteoUnitario.value;
  if (!fila || !sesionStore.usuario) return;

  const cantidad = parsearCantidadFisica(cantidadConteoUnitarioTexto.value);
  if (cantidad === null) {
    mensajeConteoUnitario.value = 'Ingresá un número entero mayor o igual a cero.';
    return;
  }
  if (cantidad === fila.existencia) {
    mensajeConteoUnitario.value = 'La cantidad contada coincide con el stock actual.';
    return;
  }
  if (deltaConteoUnitario.value < 0 && !observacionConteoUnitario.value.trim()) {
    mensajeConteoUnitario.value = 'Las bajas de stock requieren una observación para auditoría.';
    return;
  }

  aplicandoConteoUnitario.value = true;
  mensajeConteoUnitario.value = '';
  try {
    await stockStore.aplicarAjustePorConteo(
      fila.variante.id,
      catalogoStore.nombreLineaComercial(fila.variante.id),
      cantidad,
      sesionStore.usuario.nombreUsuario,
      observacionConteoUnitario.value.trim() || undefined,
    );
    cerrarConteoUnitario();
    mostrarToast('Stock actualizado por conteo unitario.', 'ok');
  } catch (error) {
    mensajeConteoUnitario.value = mensajeErrorHttp(error, 'No se pudo aplicar el conteo.');
  } finally {
    aplicandoConteoUnitario.value = false;
  }
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="tit-stock-actual">
    <div class="pg-marco">
    <header class="pg-cab">
      <div class="pg-cab-izq">
        <Warehouse :size="22" aria-hidden="true" class="pg-cab-ico" stroke-width="1.85" />
        <div class="stk-cab-textos">
          <h1 id="tit-stock-actual" class="pg-titulo">Stock actual</h1>
          <p class="pg-sub">{{ descripcionPagina }}</p>
        </div>
      </div>
    </header>

    <p v-if="textoBannerRestricciones" class="stk-banner-lectura" role="status">
      <span class="stk-banner-ico" aria-hidden="true">
        <Info :size="16" stroke-width="2" />
      </span>
      <span class="stk-banner-texto">{{ textoBannerRestricciones }}</span>
    </p>

    <div class="pg-barra stk-barra-herramientas">
      <div class="stk-barra-filtros pg-barra-fila" aria-label="Filtros de stock">
        <div class="pg-barra-col pg-barra-col--busq">
          <label class="pg-filtro-bl" for="stk-filtro-busq">
            <span class="pg-filtro-etiq">Buscar</span>
            <input
              id="stk-filtro-busq"
              v-model="busqueda"
              type="search"
              class="pg-filtro-inp"
              placeholder="Nombre, marca o código…"
              autocomplete="off"
            />
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--cat">
          <label class="pg-filtro-bl" for="stk-filtro-cat">
            <span class="pg-filtro-etiq">Categoría</span>
            <select id="stk-filtro-cat" v-model="categoriaSeleccionada" class="pg-filtro-inp">
              <option value="">Todas</option>
              <option v-for="c in opcionesCategoriaParaFiltro" :key="c.valor" :value="c.valor">
                {{ c.etiqueta }}
              </option>
            </select>
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--atajos">
          <div class="pg-filtro-bl">
            <span id="stk-leyenda-atajos" class="pg-filtro-etiq">Filtros rápidos</span>
            <div class="stk-filtros-cheq" role="group" aria-labelledby="stk-leyenda-atajos">
              <label class="stk-cheq-wrap">
                <input v-model="soloStockCritico" type="checkbox" class="stk-cheq" />
                Solo agotados
              </label>
              <label class="stk-cheq-wrap">
                <input v-model="soloStockBajo" type="checkbox" class="stk-cheq" />
                Solo {{ umbralStockBajo }} o menos unidades
              </label>
            </div>
          </div>
        </div>

        <div class="pg-barra-col pg-barra-col--reinicio stk-barra-reinicio">
          <div class="pg-filtro-bl">
            <span class="pg-filtro-etiq">Reinicio</span>
            <button
              type="button"
              class="pg-btn-reset-filtros"
              :disabled="!hayFiltrosActivos"
              @click="limpiarFiltros"
            >
              <RefreshCw :size="16" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="puedeAjustarConteo"
        class="stk-barra-acciones"
        aria-label="Acciones de conteo"
      >
        <span class="pg-filtro-etiq stk-barra-acciones-etiq">Conteo de inventario</span>
        <div class="stk-conteo-acciones">
          <button
            type="button"
            class="pg-btn-primario stk-btn-conteo"
            :class="{ 'stk-btn-conteo--on': conteoEnPantalla.activo.value }"
            @click="alternarModoConteoEnPantalla"
          >
            <ClipboardCheck :size="18" stroke-width="2" aria-hidden="true" />
            {{ conteoEnPantalla.activo.value ? 'Salir del conteo' : 'Conteo en pantalla' }}
          </button>
          <button
            type="button"
            class="pg-btn-primario stk-btn-conteo"
            :disabled="filasParaConteoFisico.length === 0 || conteoEnPantalla.activo.value"
            @click="generarPlantillaConteoFisico"
          >
            <ClipboardList :size="18" stroke-width="2" aria-hidden="true" />
            Exportar Excel
          </button>
          <button
            type="button"
            class="stk-btn-importar"
            :disabled="conteoEnPantalla.activo.value"
            @click="abrirSelectorImportarConteo"
          >
            <Upload :size="18" stroke-width="2" aria-hidden="true" />
            Importar conteo
          </button>
          <input
            ref="refInputImportarConteo"
            type="file"
            class="stk-input-archivo"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            @change="alSeleccionarArchivoConteo"
          />
        </div>
      </div>
    </div>

    <section
      v-if="puedeAjustarConteo && conteoEnPantalla.activo.value"
      class="stk-conteo-panel"
      aria-label="Conteo en pantalla"
    >
      <p class="stk-conteo-panel-aviso" role="status">
        <Info :size="16" aria-hidden="true" />
        Los cambios quedan en borrador hasta que los revisés y confirmés. Cada ajuste se registra en
        auditorías con tu usuario.
      </p>

      <form class="stk-conteo-escaneo" @submit.prevent="alEnviarEscaneoConteo">
        <label class="pg-filtro-bl stk-conteo-escaneo-lab" for="stk-escaneo-conteo">
          <span class="pg-filtro-etiq">Escanear código</span>
          <div class="stk-conteo-escaneo-inp">
            <ScanBarcode :size="18" aria-hidden="true" />
            <input
              id="stk-escaneo-conteo"
              v-model="conteoEnPantalla.textoEscaneo.value"
              type="text"
              class="pg-filtro-inp"
              placeholder="Código de barras o ID de variante…"
              autocomplete="off"
            />
          </div>
        </label>
        <button type="submit" class="stk-btn-pri stk-btn-pri--compacto">Buscar</button>
      </form>

      <div v-if="filaConteoEscaneada" class="stk-conteo-escaneo-res">
        <p class="stk-conteo-escaneo-prod">
          <strong>{{ filaConteoEscaneada.producto.nombre }}</strong>
          · {{ etiquetaTalleColor(filaConteoEscaneada.variante.talle, filaConteoEscaneada.variante.color) }}
          · Sistema: {{ filaConteoEscaneada.existencia }} u.
        </p>
        <label class="stk-conteo-escaneo-cant" for="stk-escaneo-cant">
          <span class="pg-sr">Cantidad contada</span>
          <input
            id="stk-escaneo-cant"
            v-model="cantidadEscaneoTexto"
            type="number"
            min="0"
            step="1"
            class="pg-filtro-inp"
          />
        </label>
        <button type="button" class="stk-btn-pri stk-btn-pri--compacto" @click="confirmarConteoEscaneado">
          Agregar al borrador
        </button>
        <button type="button" class="stk-btn-sec stk-btn-sec--compacto" @click="filaConteoEscaneada = null">
          Cancelar
        </button>
      </div>

      <p v-if="conteoEnPantalla.mensajeEscaneo.value" class="stk-conteo-msg" role="alert">
        {{ conteoEnPantalla.mensajeEscaneo.value }}
      </p>

      <div class="stk-conteo-panel-pie">
        <p class="stk-conteo-resumen" role="status">
          <strong>{{ conteoEnPantalla.cambiosPrevistos.value.length }}</strong>
          {{ conteoEnPantalla.cambiosPrevistos.value.length === 1 ? 'diferencia' : 'diferencias' }}
          pendientes
        </p>
        <div class="stk-conteo-panel-acc">
          <button
            type="button"
            class="stk-btn-sec stk-btn-sec--compacto"
            :disabled="conteoEnPantalla.cantidadPendientes.value === 0"
            @click="conteoEnPantalla.descartarSesion()"
          >
            Descartar borrador
          </button>
          <button
            type="button"
            class="stk-btn-pri stk-btn-pri--compacto"
            :disabled="conteoEnPantalla.cambiosPrevistos.value.length === 0"
            @click="abrirConfirmacionConteoPantalla"
          >
            Revisar y confirmar
          </button>
        </div>
      </div>
    </section>

    <p
      v-if="mensajeToast"
      class="stk-aviso"
      :class="`stk-aviso--${tipoMensajeToast}`"
      role="status"
    >
      {{ mensajeToast }}
    </p>

    <div class="pg-tabla-cuerpo" role="region" aria-label="Existencias por producto">
      <ul
        v-if="gruposFiltrados.length > 0"
        class="stk-fila-lista"
        role="list"
        aria-label="Productos con stock"
      >
        <li v-for="grupo in gruposFiltrados" :key="grupo.producto.id" role="listitem">
          <article class="stk-prod-tarjeta">
            <div class="stk-prod-tarjeta-cab">
              <div class="stk-prod-tarjeta-info">
                <p class="stk-fila-tarjeta-nombre">{{ grupo.producto.nombre }}</p>
                <p v-if="grupo.producto.marca.trim()" class="stk-prod-tarjeta-marca">
                  {{ grupo.producto.marca }}
                </p>
              </div>
              <span :class="claseEstadoGrupo(grupo)">{{ textoEstadoGrupo(grupo) }}</span>
            </div>
            <div class="stk-fila-tarjeta-chips">
              <span class="stk-fila-chip">
                {{ catalogoStore.nombreCategoria(grupo.producto.categoriaId) }}
              </span>
              <span class="stk-fila-chip">
                {{ grupo.filas.length }}
                {{ grupo.filas.length === 1 ? 'variante' : 'variantes' }}
              </span>
            </div>
            <div class="stk-fila-tarjeta-total">
              <span class="stk-fila-tarjeta-total-etiq">Total unidades</span>
              <strong class="stk-mono stk-cant">{{ existenciaTotalGrupo(grupo) }}</strong>
            </div>
            <button
              type="button"
              class="stk-btn-variantes"
              :aria-expanded="estaProductoExpandido(grupo.producto.id)"
              :aria-controls="`stk-variantes-${grupo.producto.id}`"
              @click="alternarVariantesProducto(grupo.producto.id)"
            >
              <ChevronUp v-if="estaProductoExpandido(grupo.producto.id)" :size="16" aria-hidden="true" />
              <ChevronDown v-else :size="16" aria-hidden="true" />
              {{ estaProductoExpandido(grupo.producto.id) ? 'Ocultar variantes' : 'Ver variantes' }}
            </button>
            <ul
              v-if="estaProductoExpandido(grupo.producto.id)"
              :id="`stk-variantes-${grupo.producto.id}`"
              class="stk-variantes-lista"
              role="list"
              :aria-label="`Variantes de ${grupo.producto.nombre}`"
            >
              <li v-for="fila in grupo.filas" :key="fila.variante.id" role="listitem">
                <div class="stk-variante-item">
                  <div class="stk-variante-item-cab">
                    <span class="stk-variante-talle stk-mono">
                      {{ etiquetaTalleColor(fila.variante.talle, fila.variante.color) }}
                    </span>
                    <span :class="claseEstadoCantidad(fila.existencia)">
                      {{ textoEstadoCantidad(fila.existencia) }}
                    </span>
                  </div>
                  <p v-if="fila.variante.codigoBarras?.trim()" class="stk-variante-cod stk-mono">
                    {{ fila.variante.codigoBarras?.trim() }}
                  </p>
                  <div class="stk-variante-item-pie">
                    <span class="stk-variante-cant stk-mono stk-cant">{{ fila.existencia }} u.</span>
                    <div v-if="conteoEnPantalla.activo.value && puedeAjustarConteo" class="stk-conteo-fila">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        class="pg-filtro-inp stk-conteo-fila-inp"
                        :value="valorInputConteoFila(fila.variante.id, fila.existencia)"
                        @input="
                          actualizarInputConteoFila(
                            fila.variante.id,
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                      />
                      <button type="button" class="stk-ac-mini" @click="registrarConteoFila(fila)">
                        Contar
                      </button>
                    </div>
                    <button
                      v-else-if="puedeAjustarConteo"
                      type="button"
                      class="stk-ac-mini"
                      @click="abrirConteoUnitario(fila)"
                    >
                      Contar
                    </button>
                    <button
                      v-if="puedeEntradaManual"
                      type="button"
                      class="stk-ac-mini stk-ac-mini--entr"
                      @click="abrirModalEntrada(fila)"
                    >
                      <PackagePlus class="stk-ac-mini-ico" :size="15" aria-hidden="true" />
                      Entrada
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </article>
        </li>
      </ul>
      <p v-else class="stk-fila-vacio" role="status">
        No encontramos productos para las condiciones marcadas en los filtros.
      </p>

      <div class="pg-tabla-scroll stk-tabla-scroll stk-tabla-scroll--escritorio">
        <table class="pg-tabla pg-tabla--estado">
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Marca</th>
            <th scope="col" class="stk-col-corta">Categoría</th>
            <th scope="col" class="stk-der stk-col-stock">Total</th>
            <th scope="col" class="stk-col-estado">Estado</th>
            <th scope="col" class="stk-col-variantes">Variantes</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="grupo in gruposFiltrados" :key="grupo.producto.id">
            <tr class="stk-fila-producto">
              <td class="stk-nombre">{{ grupo.producto.nombre }}</td>
              <td>{{ grupo.producto.marca || '—' }}</td>
              <td class="stk-mute stk-col-corta">
                {{ catalogoStore.nombreCategoria(grupo.producto.categoriaId) }}
              </td>
              <td class="stk-der stk-mono stk-cant">{{ existenciaTotalGrupo(grupo) }}</td>
              <td class="stk-cel-estado">
                <span :class="claseEstadoGrupo(grupo)">{{ textoEstadoGrupo(grupo) }}</span>
              </td>
              <td class="stk-cel-variantes">
                <button
                  type="button"
                  class="stk-btn-variantes stk-btn-variantes--tabla"
                  :aria-expanded="estaProductoExpandido(grupo.producto.id)"
                  @click="alternarVariantesProducto(grupo.producto.id)"
                >
                  <ChevronUp v-if="estaProductoExpandido(grupo.producto.id)" :size="15" aria-hidden="true" />
                  <ChevronDown v-else :size="15" aria-hidden="true" />
                  {{ estaProductoExpandido(grupo.producto.id) ? 'Ocultar' : 'Ver variantes' }}
                </button>
              </td>
            </tr>
            <tr
              v-for="fila in grupo.filas"
              v-show="estaProductoExpandido(grupo.producto.id)"
              :key="fila.variante.id"
              class="stk-fila-variante"
            >
              <td colspan="3" class="stk-cel-variante">
                <span class="stk-variante-talle stk-mono">
                  Talle {{ etiquetaTalleColor(fila.variante.talle, fila.variante.color) }}
                </span>
                <span v-if="fila.variante.codigoBarras?.trim()" class="stk-variante-cod-tabla stk-mono">
                  · {{ fila.variante.codigoBarras?.trim() }}
                </span>
              </td>
              <td class="stk-der stk-mono stk-cant">{{ fila.existencia }}</td>
              <td class="stk-cel-estado">
                <span :class="claseEstadoCantidad(fila.existencia)">
                  {{ textoEstadoCantidad(fila.existencia) }}
                </span>
              </td>
              <td class="stk-cel-variantes">
                <div class="stk-acc-variante">
                  <template v-if="conteoEnPantalla.activo.value && puedeAjustarConteo">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      class="pg-filtro-inp stk-conteo-fila-inp"
                      :value="valorInputConteoFila(fila.variante.id, fila.existencia)"
                      @input="
                        actualizarInputConteoFila(
                          fila.variante.id,
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                    />
                    <button type="button" class="stk-ac-mini" @click="registrarConteoFila(fila)">
                      Contar
                    </button>
                  </template>
                  <button
                    v-else-if="puedeAjustarConteo"
                    type="button"
                    class="stk-ac-mini"
                    title="Conteo unitario con confirmación"
                    @click="abrirConteoUnitario(fila)"
                  >
                    Contar
                  </button>
                  <button
                    v-if="puedeEntradaManual"
                    type="button"
                    class="stk-ac-mini stk-ac-mini--entr"
                    title="Entrada tipo compra manual"
                    @click="abrirModalEntrada(fila)"
                  >
                  <PackagePlus class="stk-ac-mini-ico" :size="17" aria-hidden="true" />
                  Entrada
                </button>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="gruposFiltrados.length === 0">
            <td :colspan="columnasTablaStock" class="stk-vacio">
              No encontramos productos para las condiciones marcadas en los filtros.
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
    </div>

    <Teleport to="body">
      <dialog
        ref="refModalConfirmarConteo"
        class="stk-dlg-conte stk-dlg-conte--import"
        aria-labelledby="stk-dlg-import-h"
        @close="alCerrarModalConfirmarConteo"
      >
        <div class="stk-dlg-pane stk-dlg-pane--import" @click.stop>
          <header class="stk-dlg-cap">
            <div>
              <h2 id="stk-dlg-import-h">
                {{
                  origenConteoConfirmacion === 'pantalla'
                    ? 'Confirmar conteo en pantalla'
                    : 'Confirmar importación de conteo'
                }}
              </h2>
              <p v-if="nombreArchivoConteo" class="stk-dlg-archivo">{{ nombreArchivoConteo }}</p>
            </div>
            <button
              type="button"
              class="stk-dlg-x"
              aria-label="Cerrar"
              :disabled="importandoConteo"
              @click="cerrarModalConfirmarConteo"
            >
              ×
            </button>
          </header>

          <p class="stk-dlg-ley">
            Revisá los cambios antes de aplicarlos. Cada variación quedará registrada en
            <RouterLink class="stk-enlace-interno" :to="{ name: 'stock-auditorias' }">
              Auditorías de stock
            </RouterLink>
            como ajuste por conteo.
          </p>

          <div v-if="erroresParseoConteo.length" class="stk-import-alerta stk-import-alerta--error" role="alert">
            <p class="stk-import-alerta-tit">Errores en el archivo</p>
            <ul class="stk-import-lista">
              <li v-for="(error, i) in erroresParseoConteo" :key="`err-${i}`">{{ error }}</li>
            </ul>
          </div>

          <div
            v-if="advertenciasParseoConteo.length"
            class="stk-import-alerta stk-import-alerta--aviso"
            role="status"
          >
            <p class="stk-import-alerta-tit">Advertencias</p>
            <ul class="stk-import-lista">
              <li v-for="(aviso, i) in advertenciasParseoConteo" :key="`av-${i}`">{{ aviso }}</li>
            </ul>
          </div>

          <div class="stk-import-resumen" role="status">
            <span><strong>{{ cambiosConteoPendientes.length }}</strong> cambio(s) a aplicar</span>
            <span><strong>{{ totalUnidadesAjusteConteo }}</strong> unidades en variación</span>
            <span v-if="resumenParseoConteo.filasSinCambio">
              {{ resumenParseoConteo.filasSinCambio }} sin cambio
            </span>
          </div>

          <div class="stk-import-tabla-wrap" role="region" aria-label="Cambios de stock previstos">
            <table class="stk-import-tabla">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Producto</th>
                  <th scope="col" class="stk-der">Actual</th>
                  <th scope="col" class="stk-der">Nuevo</th>
                  <th scope="col" class="stk-der">Variación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fila in cambiosConteoPendientes" :key="fila.varianteId">
                  <td class="stk-mono">{{ fila.codigoProducto }}</td>
                  <td>{{ fila.nombreProducto }}</td>
                  <td class="stk-der stk-mono">{{ fila.cantidadAnterior }}</td>
                  <td class="stk-der stk-mono stk-cant">{{ fila.cantidadNueva }}</td>
                  <td class="stk-der stk-mono" :class="claseDeltaConteo(fila.delta)">
                    {{ textoDeltaConteo(fila.delta) }}
                  </td>
                </tr>
                <tr v-if="cambiosConteoPendientes.length === 0">
                  <td colspan="5" class="stk-vacio-mini">
                    {{
                      erroresParseoConteo.length
                        ? 'Corregí el archivo para continuar.'
                        : 'No hay cambios de stock para confirmar.'
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <label class="stk-dlg-lab stk-etq-bl" for="stk-import-obs">
            <span class="pg-filtro-etiq">
              Observación para auditoría
              <span v-if="!observacionConteoObligatoria">(opcional)</span>
              <span v-else class="stk-obs-oblig">(obligatoria)</span>
            </span>
            <textarea
              id="stk-import-obs"
              v-model="observacionImportacionConteo"
              class="stk-txt"
              rows="2"
              maxlength="240"
              placeholder="Ej. Conteo mensual depósito, inventario fin de temporada…"
              :disabled="importandoConteo"
              :required="observacionConteoObligatoria"
            />
          </label>
          <p v-if="observacionConteoObligatoria" class="stk-dlg-obs-aviso" role="status">
            Este conteo incluye bajas de stock o varios ítems. Indicá el motivo para dejar trazabilidad
            en auditorías.
          </p>

          <p v-if="mensajeModalConfirmarConteo" class="stk-dlg-msg" role="alert">
            {{ mensajeModalConfirmarConteo }}
          </p>

          <footer class="stk-dlg-acc">
            <button
              type="button"
              class="stk-btn-sec"
              :disabled="importandoConteo"
              @click="cerrarModalConfirmarConteo"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="stk-btn-pri"
              :disabled="!puedeConfirmarConteo"
              @click="confirmarImportacionConteo"
            >
              {{ importandoConteo ? 'Aplicando…' : 'Confirmar y aplicar cambios' }}
            </button>
          </footer>
        </div>
      </dialog>

      <dialog
        ref="refModalExitoConteo"
        class="stk-dlg-conte stk-dlg-conte--exito"
        aria-labelledby="stk-dlg-exito-h"
        @close="alCerrarModalExitoConteo"
      >
        <div class="stk-dlg-pane stk-dlg-pane--exito" @click.stop>
          <div class="stk-exito-ico-wrap" aria-hidden="true">
            <CheckCircle2 :size="52" stroke-width="1.75" class="stk-exito-ico" />
          </div>
          <h2 id="stk-dlg-exito-h" class="stk-exito-tit">Stock actualizado correctamente</h2>
          <p class="stk-exito-lead">
            Se aplicaron <strong>{{ cantidadAjustesAplicados }}</strong>
            ajuste(s) de inventario. Los movimientos quedaron registrados en auditorías.
          </p>
          <p v-if="metadatosExitoConteo.nombreArchivoOrigen" class="stk-exito-meta">
            Archivo: {{ metadatosExitoConteo.nombreArchivoOrigen }}
          </p>

          <p v-if="mensajeModalExitoConteo" class="stk-dlg-msg" role="alert">
            {{ mensajeModalExitoConteo }}
          </p>

          <footer class="stk-exito-acc">
            <button
              type="button"
              class="stk-btn-pri stk-btn-pri--exito"
              :disabled="exportandoReporteConteo || cambiosConteoAplicados.length === 0"
              @click="exportarReporteCambioConteo"
            >
              <FileDown :size="18" aria-hidden="true" />
              {{ exportandoReporteConteo ? 'Generando reporte…' : 'Exportar reporte cambio' }}
            </button>
            <button type="button" class="stk-btn-sec" @click="volverAlMenuStock">
              Volver al menú stock
            </button>
          </footer>
        </div>
      </dialog>

      <dialog
        ref="refModalConteoUnitario"
        class="stk-dlg-conte"
        aria-labelledby="stk-dlg-conteo-unit-h"
        @close="alCerrarConteoUnitario"
      >
        <form
          v-if="filaConteoUnitario"
          class="stk-dlg-pane"
          @submit.prevent="confirmarConteoUnitario"
        >
          <header class="stk-dlg-cap">
            <h2 id="stk-dlg-conteo-unit-h">Conteo unitario · {{ filaConteoUnitario.producto.nombre }}</h2>
            <button
              type="button"
              class="stk-dlg-x"
              aria-label="Cerrar"
              :disabled="aplicandoConteoUnitario"
              @click="cerrarConteoUnitario"
            >
              ×
            </button>
          </header>
          <p class="stk-dlg-ley">
            Variante
            {{ etiquetaTalleColor(filaConteoUnitario.variante.talle, filaConteoUnitario.variante.color) }}.
            Stock en sistema: <strong>{{ filaConteoUnitario.existencia }}</strong> u.
          </p>
          <label class="stk-dlg-lab stk-etq-bl" for="stk-conteo-unit-cant">
            <span class="pg-filtro-etiq">Cantidad física contada</span>
            <input
              id="stk-conteo-unit-cant"
              v-model="cantidadConteoUnitarioTexto"
              type="number"
              min="0"
              step="1"
              class="pg-filtro-inp"
              required
            />
          </label>
          <p
            v-if="deltaConteoUnitario !== 0"
            class="stk-conteo-unit-delta"
            :class="claseDeltaConteo(deltaConteoUnitario)"
            role="status"
          >
            Variación: {{ textoDeltaConteo(deltaConteoUnitario) }} u.
          </p>
          <label class="stk-dlg-lab stk-etq-bl" for="stk-conteo-unit-obs">
            <span class="pg-filtro-etiq">
              Observación
              <span v-if="deltaConteoUnitario >= 0">(opcional)</span>
              <span v-else class="stk-obs-oblig">(obligatoria para bajas)</span>
            </span>
            <textarea
              id="stk-conteo-unit-obs"
              v-model="observacionConteoUnitario"
              class="stk-txt"
              rows="2"
              maxlength="240"
              :required="deltaConteoUnitario < 0"
            />
          </label>
          <p v-if="mensajeConteoUnitario" class="stk-dlg-msg" role="alert">{{ mensajeConteoUnitario }}</p>
          <footer class="stk-dlg-acc">
            <button type="button" class="stk-btn-sec" @click="cerrarConteoUnitario">Cancelar</button>
            <button type="submit" class="stk-btn-pri" :disabled="aplicandoConteoUnitario">
              {{ aplicandoConteoUnitario ? 'Aplicando…' : 'Confirmar conteo' }}
            </button>
          </footer>
        </form>
      </dialog>

      <dialog
        ref="refModalDescartarConteo"
        class="stk-dlg-conte stk-dlg-conte--descartar"
        aria-labelledby="stk-dlg-descartar-h"
      >
        <div class="stk-dlg-pane" @click.stop>
          <header class="stk-dlg-cap">
            <h2 id="stk-dlg-descartar-h">Salir del conteo en pantalla</h2>
          </header>
          <p class="stk-dlg-ley">
            Hay cantidades en borrador sin confirmar. Si salís ahora, esos cambios no se aplicarán al
            stock.
          </p>
          <footer class="stk-dlg-acc">
            <button type="button" class="stk-btn-sec" @click="refModalDescartarConteo?.close()">
              Seguir contando
            </button>
            <button type="button" class="stk-btn-pri" @click="confirmarSalidaModoConteo">
              Descartar y salir
            </button>
          </footer>
        </div>
      </dialog>

      <dialog
        ref="refModalEntrada"
        class="stk-dlg-conte"
        aria-labelledby="stk-dlg-entr-h"
        @close="alCerrarModalEntrada"
      >
        <div v-if="productoEntradaSeleccionado" class="stk-dlg-pane" @click.stop>
          <header class="stk-dlg-cap">
            <h2 id="stk-dlg-entr-h">Entrada mercadería · {{ productoEntradaSeleccionado.nombre }}</h2>
            <button type="button" class="stk-dlg-x" aria-label="Cerrar" @click="cerrarModalEntrada">
              ×
            </button>
          </header>
          <p class="stk-dlg-ley">
            Sumá aquí mercadería que ingresó al inventario físico antes de tener el circuito formal de
            compras cargado contra proveedores. Las unidades aumentan disponibles sin descontar efectivo ni
            IVA hasta que existan remitos electrónicos reales enlazados.
          </p>
          <label class="stk-dlg-lab stk-etq-bl">
            <span class="pg-filtro-etiq">Unidades nuevas disponibles para ventas</span>
            <input
              v-model="unidadesEntradaTexto"
              type="text"
              inputmode="decimal"
              class="pg-filtro-inp"
              autocomplete="off"
              placeholder="Ej. 120"
            />
          </label>
          <label class="stk-dlg-lab stk-etq-bl">
            <span class="pg-filtro-etiq">Referencias (opcional)</span>
            <textarea
              v-model="observacionEntradaTexto"
              class="stk-txt"
              rows="2"
              maxlength="200"
              placeholder="Ej. Factura FAC-B 00432, orden proveedor norte…"
              autocomplete="off"
            ></textarea>
          </label>
          <p v-if="mensajeModalEntrada" class="stk-dlg-msg" role="alert">{{ mensajeModalEntrada }}</p>
          <footer class="stk-dlg-acc">
            <button type="button" class="stk-btn-sec" @click="cerrarModalEntrada">Cancelar</button>
            <button type="button" class="stk-btn-pri" @click="guardarModalEntrada">
              Registrar entrada
            </button>
          </footer>
        </div>
      </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.stk-tabla-scroll {
  --pg-cap-de-filas: 8;
  --pg-altura-cap-fila: 3.15rem;
}

.stk {
  width: 100%;
  max-width: 1120px;
  margin-inline: auto;
}

.stk-cab {
  margin-bottom: 1.15rem;
}

.stk-cab-izq {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.stk-icono {
  flex-shrink: 0;
  color: var(--color-acento);
  opacity: 0.95;
  margin-top: 0.1rem;
}

.stk-tit {
  margin: 0;
  font-size: clamp(1.18rem, 2.8vw, 1.52rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stk-sub {
  margin: 0.35rem 0 0;
  font-size: 0.865rem;
  line-height: 1.52;
  color: var(--color-texto-apagado);
  max-width: 58rem;
}

.stk-sub-r {
  color: var(--color-texto-suave);
  font-weight: 600;
}

.stk-enlace-interno {
  color: var(--color-acento-hover);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid var(--color-acento-borde);
}

.stk-enlace-interno:hover {
  filter: brightness(1.08);
}

.stk-cab-textos {
  min-width: 0;
  flex: 1;
}

.stk-banner-lectura {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0 clamp(1rem, 3vw, 1.65rem) 0.85rem;
  width: auto;
  max-width: none;
  padding: 0.72rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-texto-suave);
  font-size: 0.81rem;
  line-height: 1.5;
}

.stk-banner-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-acento);
}

.stk-banner-texto {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.stk-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.75rem 1.15rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.stk-barra-herramientas {
  flex-direction: column;
  align-items: stretch;
  gap: 0;
}

.stk-barra-filtros {
  width: 100%;
  align-items: flex-end;
}

.stk-barra-reinicio {
  margin-left: auto;
}

.stk-barra-acciones {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-borde);
}

.stk-barra-acciones-etiq {
  text-align: left;
}

.stk-conteo-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: stretch;
  justify-content: flex-start;
}

.stk-conteo-acciones .stk-btn-conteo,
.stk-conteo-acciones .stk-btn-importar {
  flex: 0 1 auto;
  min-width: 9.5rem;
}

.pg-barra-col {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
}

.pg-barra-col--busq {
  flex: 1 1 12rem;
  min-width: min(100%, 11.5rem);
}

.pg-barra-col--cat {
  flex: 0 1 10.75rem;
  min-width: min(100%, 9.5rem);
}

.pg-barra-col--atajos {
  flex: 1 1 15rem;
  min-width: min(100%, 14rem);
}

.stk-btn-importar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.38rem;
  padding: 0.45rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.stk-btn-importar:hover {
  filter: brightness(1.06);
}

.stk-input-archivo {
  display: none;
}

.stk-btn-conteo,
.stk-btn-importar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.38rem;
  padding: 0.45rem 0.85rem;
  white-space: nowrap;
}

.stk-barra-acciones .stk-btn-conteo {
  width: auto;
  min-width: 10.75rem;
  box-sizing: border-box;
}

.stk-btn-conteo--on {
  box-shadow: inset 0 0 0 2px var(--color-advertencia-borde);
  background: var(--color-advertencia-suave);
  color: var(--color-advertencia);
}

.stk-conteo-panel {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-advertencia-borde);
  background: var(--color-advertencia-suave);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stk-conteo-panel-aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto);
}

.stk-conteo-escaneo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-end;
}

.stk-conteo-escaneo-lab {
  flex: 1 1 14rem;
}

.stk-conteo-escaneo-inp {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.stk-conteo-escaneo-res {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.stk-conteo-escaneo-prod {
  margin: 0;
  flex: 1 1 100%;
  font-size: 0.86rem;
}

.stk-conteo-escaneo-cant {
  width: 5rem;
}

.stk-conteo-msg {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-peligro);
}

.stk-conteo-panel-pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.stk-conteo-resumen {
  margin: 0;
  font-size: 0.88rem;
}

.stk-conteo-panel-acc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.stk-btn-pri--compacto,
.stk-btn-sec--compacto {
  min-height: 2.1rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.82rem;
}

.stk-conteo-fila,
.stk-acc-variante {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.stk-conteo-fila-inp {
  width: 4.5rem;
  min-height: 2rem;
  padding: 0.25rem 0.45rem;
}

.stk-obs-oblig {
  color: var(--color-peligro);
  font-weight: 600;
}

.stk-dlg-obs-aviso {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-advertencia);
}

.stk-conteo-unit-delta {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
}

.pg-barra-col--reinicio {
  flex: 0 0 auto;
}

@media (max-width: 719px) {
  .pg-barra-col--reinicio {
    flex: 1 1 100%;
  }

  .stk-conteo-acciones .stk-btn-conteo,
  .stk-conteo-acciones .stk-btn-importar {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 0;
  }
}

.stk-etq-bl {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.stk-etiqueta-bl {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.stk-inp {
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  padding: 0.42rem 0.62rem;
  min-height: 2.38rem;
  box-sizing: border-box;
  width: 100%;
}

.stk-btn-sec,
.stk-btn-pri {
  cursor: pointer;
  border-radius: 10px;
  font-weight: 600;
  padding: 0.45rem 0.92rem;
  font-size: 0.85rem;
}

.stk-btn-sec {
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto);
}

.stk-btn-pri {
  border: none;
  background: linear-gradient(158deg, var(--color-acento-intenso), var(--color-acento));
  color: var(--color-texto-sobre-acento);
}

.stk-btn-pri:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.stk-btn-reset {
  white-space: nowrap;
  gap: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.38rem;
  box-sizing: border-box;
  padding-inline: 0.85rem;
}

.stk-cheq-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.805rem;
  color: var(--color-texto-suave);
  line-height: 1.25;
}

.stk-cheq {
  accent-color: var(--color-acento);
  width: 1.02rem;
  height: 1.02rem;
  flex-shrink: 0;
}

.stk-filtros-cheq {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  gap: 0.45rem 1.15rem;
  min-height: 2.38rem;
  box-sizing: border-box;
  padding: 0.15rem 0;
}

.stk-aviso {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.45;
}

.stk-aviso--ok {
  color: var(--color-exito);
  background: var(--color-exito-suave);
  border: 1px solid var(--color-exito-borde);
}

.stk-aviso--error {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
  border: 1px solid var(--color-peligro-borde);
}

.stk-tab-wrap {
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  overflow-x: auto;
  background: var(--color-fondo-elevado);
}

.stk-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.878rem;
  min-width: 720px;
}

.stk-tabla th,
.stk-tabla td {
  padding: 0.58rem 0.82rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
  text-align: left;
}

.stk-tabla th {
  font-size: 0.715rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  white-space: nowrap;
}

.stk-der {
  text-align: right;
}

.stk-col-corta {
  max-width: 8.75rem;
  white-space: nowrap;
}

.stk-col-stock {
  width: 5rem;
  min-width: 5rem;
  white-space: nowrap;
}

.stk-acc-h {
  min-width: 6.5rem;
}

.stk-nombre {
  font-weight: 600;
}

.stk-mute {
  color: var(--color-texto-apagado);
  font-weight: normal;
}

.stk-inline {
  display: inline;
}

.stk-mono {
  font-variant-numeric: tabular-nums;
}

.stk-mono-mini {
  font-variant-numeric: tabular-nums;
  font-size: 0.785rem;
}

.stk-chip {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.695rem;
  font-weight: 600;
}

.stk-chip--agotado {
  background: var(--color-peligro-suave);
  color: var(--color-peligro);
  border: 1px solid var(--color-peligro-borde);
}

.stk-chip--bajo {
  background: var(--color-advertencia-suave);
  color: rgb(237, 206, 120);
  border: 1px solid var(--color-advertencia-borde);
}

.stk-chip--normal {
  border: 1px solid transparent;
  color: var(--color-exito);
}

.stk-cant {
  font-weight: 700;
}

.stk-acc-cel {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.42rem;
}

.stk-ac-mini {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  border-radius: 9px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  padding: 0.3rem 0.62rem;
  font-size: 0.695rem;
  font-weight: 600;
  white-space: nowrap;
}

.stk-ac-mini--entr {
  border-color: var(--color-exito-borde);
  background: var(--color-exito-suave);
  color: var(--color-exito);
}

.stk-ac-mini:hover {
  filter: brightness(1.06);
}

.stk-ac-mini-ico {
  flex-shrink: 0;
}

.stk-vacio {
  padding: 1.95rem !important;
  text-align: center !important;
  color: var(--color-texto-apagado);
  border-bottom: none !important;
}

.stk-vacio-mini {
  padding: 1.15rem !important;
  font-size: 0.86rem !important;
}

.stk-dlg-conte {
  border: none;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: min(28rem, 100%);
  border-radius: 14px;
  box-shadow: var(--color-sombra-elevada);
  background: transparent;
}

.stk-dlg-conte--import {
  width: min(52rem, 100%);
}

.stk-dlg-conte--exito {
  width: min(28rem, 100%);
}

.stk-dlg-pane--exito {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem clamp(1rem, 3vw, 1.5rem) 1.25rem;
}

.stk-exito-ico-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  margin-bottom: 0.85rem;
  border-radius: 999px;
  background: var(--color-exito-suave);
  border: 1px solid var(--color-exito-borde);
}

.stk-exito-ico {
  color: var(--color-exito);
}

.stk-exito-tit {
  margin: 0;
  font-size: clamp(1.05rem, 2.8vw, 1.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-texto);
}

.stk-exito-lead {
  margin: 0.65rem 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--color-texto-suave);
  max-width: 22rem;
}

.stk-exito-meta {
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
  word-break: break-all;
}

.stk-exito-acc {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 100%;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-borde);
}

.stk-btn-pri--exito {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
}

.stk-exito-acc .stk-btn-sec {
  width: 100%;
}

.stk-dlg-pane--import {
  max-height: min(92dvh, 44rem);
  display: flex;
  flex-direction: column;
}

.stk-dlg-archivo {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
  word-break: break-all;
}

.stk-import-alerta {
  margin-bottom: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  font-size: 0.8rem;
  line-height: 1.45;
}

.stk-import-alerta--error {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
  border: 1px solid var(--color-peligro-borde);
}

.stk-import-alerta--aviso {
  color: var(--color-advertencia);
  background: var(--color-advertencia-suave);
  border: 1px solid var(--color-advertencia-borde);
}

.stk-import-alerta-tit {
  margin: 0 0 0.35rem;
  font-weight: 700;
}

.stk-import-lista {
  margin: 0;
  padding-left: 1.1rem;
}

.stk-import-resumen {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1rem;
  margin-bottom: 0.65rem;
  font-size: 0.82rem;
  color: var(--color-texto-suave);
}

.stk-import-tabla-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-bottom: 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.stk-import-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.stk-import-tabla th,
.stk-import-tabla td {
  padding: 0.52rem 0.72rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.stk-import-tabla th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-elevado);
}

.stk-delta--sube {
  color: var(--color-exito);
  font-weight: 700;
}

.stk-delta--baja {
  color: var(--color-peligro);
  font-weight: 700;
}

.stk-dlg-conte::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(3px);
}

.stk-dlg-pane {
  padding: 1.1rem clamp(1rem, 3vw, 1.35rem);
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  border-radius: 14px;
}

.stk-dlg-cap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}

.stk-dlg-cap h2 {
  margin: 0;
  font-size: clamp(1.02rem, 2.8vw, 1.22rem);
  font-weight: 700;
}

.stk-dlg-x {
  border-radius: 8px;
  width: 2.05rem;
  height: 2.05rem;
  cursor: pointer;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-apagado);
  font-size: 1.05rem;
  line-height: 1;
}

.stk-dlg-x:hover {
  color: var(--color-texto);
}

.stk-dlg-ley {
  margin: 0 0 0.82rem;
  font-size: 0.795rem;
  line-height: 1.53;
  color: var(--color-texto-apagado);
}

.stk-dlg-mini {
  margin: -0.2rem 0 0.9rem;
  font-size: 0.782rem;
  color: var(--color-texto-suave);
}

.stk-dlg-lab + .stk-dlg-lab {
  margin-top: 0.85rem;
}

.stk-dlg-acc {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.05rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-borde);
}

.stk-txt {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  padding: 0.55rem 0.72rem;
  resize: vertical;
  min-height: 3rem;
}

.stk-dlg-msg {
  margin-top: 0.65rem;
  font-size: 0.8rem;
  color: var(--color-peligro);
}

@media (max-width: 640px) {
  .stk-acc-cel {
    justify-content: flex-start;
    flex-direction: column;
    align-items: stretch;
  }

  .stk-ac-mini {
    justify-content: center;
  }
}

.stk-fila-lista {
  display: none;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stk-prod-tarjeta {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.8rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.stk-prod-tarjeta-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.stk-prod-tarjeta-info {
  min-width: 0;
  flex: 1;
}

.stk-prod-tarjeta-marca {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.stk-btn-variantes {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  margin-top: 0.15rem;
  padding: 0.48rem 0.75rem;
  border-radius: 9px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.stk-btn-variantes:hover {
  filter: brightness(1.05);
}

.stk-btn-variantes--tabla {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  width: auto;
  max-width: 100%;
  margin-top: 0;
  padding: 0.32rem 0.55rem;
  font-size: 0.72rem;
  white-space: nowrap;
}

.stk-variantes-lista {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0.35rem 0 0;
  padding: 0;
  list-style: none;
}

.stk-variante-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.stk-variante-item-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.stk-variante-talle {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-texto);
}

.stk-variante-cod {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
}

.stk-variante-item-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.stk-variante-cant {
  font-size: 0.9rem;
}

.stk-fila-producto {
  background: var(--color-fondo-elevado);
}

.stk-fila-variante {
  background: var(--color-fondo-cabecera);
}

.stk-fila-variante td {
  border-bottom: 1px solid var(--color-borde);
}

.stk-cel-variante {
  padding-left: 1.75rem !important;
  font-size: 0.84rem;
  color: var(--color-texto-suave);
}

.stk-col-estado,
.stk-cel-estado {
  width: 8.75rem;
  min-width: 8.75rem;
  max-width: 8.75rem;
  text-align: center;
  vertical-align: middle;
}

.stk-cel-estado .stk-chip {
  display: inline-block;
  max-width: 100%;
  white-space: normal;
  text-align: center;
  line-height: 1.25;
}

.stk-col-variantes,
.stk-cel-variantes {
  width: 10.25rem;
  min-width: 10.25rem;
  max-width: 10.25rem;
  text-align: center;
  vertical-align: middle;
}

.stk-cel-variantes .stk-btn-variantes--tabla,
.stk-cel-variantes .stk-ac-mini {
  margin-inline: auto;
}

.stk-variante-cod-tabla {
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.stk-fila-tarjeta-nombre {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-texto);
  word-break: break-word;
}

.stk-fila-tarjeta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.stk-fila-chip {
  display: inline-block;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  background: var(--color-acento-suave);
  border: 1px solid var(--color-borde);
}

.stk-fila-tarjeta-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.35rem;
  margin-top: 0.1rem;
  border-top: 1px solid var(--color-borde);
}

.stk-fila-tarjeta-total-etiq {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.stk-fila-tarjeta-total strong {
  font-size: 1.1rem;
}

.stk-fila-vacio {
  display: none;
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .pg-tabla-cuerpo {
    overflow-x: visible;
  }

  .stk-tabla-scroll--escritorio {
    display: none;
  }

  .stk-fila-lista,
  .stk-fila-vacio {
    display: flex;
  }
}
</style>
