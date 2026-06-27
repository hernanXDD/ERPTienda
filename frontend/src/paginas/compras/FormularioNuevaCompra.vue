<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import type { IdCondicionCompra, CompraRegistrada, LineaCompraRegistro } from '../../tipos/compraRegistrada';
import type { Producto, Variante } from '../../tipos/catalogo';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import ModalFormularioProducto from '../../componentes/catalogo/ModalFormularioProducto.vue';
import {
  armarNombreLineaComercial,
  etiquetaTalle,
} from '../../modulos/catalogo/catalogoPresentacion';
import type { FilaVarianteCatalogo } from '../../modulos/catalogo/buscarVariantesCatalogo';
import {
  armarFilasProductoCatalogo,
  buscarProductosCatalogo,
  etiquetaCantidadTalles,
  type FilaProductoCatalogo,
} from '../../modulos/catalogo/buscarProductosCatalogo';
import { useCatalogoStore } from '../../stores/catalogo';
import { useCuentaCorrienteProveedorStore } from '../../stores/cuentaCorrienteProveedor';
import { useProveedoresStore } from '../../stores/proveedores';
import { useRegistroComprasStore } from '../../stores/registroCompras';
import { useTallesCatalogoStore } from '../../stores/tallesCatalogo';
import { etiquetaCondicionCompra } from '../../datos/condicionesCompra';
import { calcularCreditoDisponible } from '../../utilidades/cuentaCorriente';
import { ChevronDown, CheckCircle2, PackagePlus, Search } from 'lucide-vue-next';
import { formatearMoneda } from '../../utilidades/formatoMoneda';

const emit = defineEmits<{
  cerrar: [];
}>();

const { tienePermiso } = usePermisosOperador();
const puedeGestionarCatalogo = computed(() => tienePermiso('puedeGestionarCatalogoProductos'));

const proveedoresStore = useProveedoresStore();
const catalogoStore = useCatalogoStore();
const cuentaCorrienteProveedorStore = useCuentaCorrienteProveedorStore();
const registroStore = useRegistroComprasStore();
const tallesCatalogoStore = useTallesCatalogoStore();
const { variantes, cargando: catalogoCargando } = storeToRefs(catalogoStore);
const { talles: tallesCatalogo } = storeToRefs(tallesCatalogoStore);

function tallesParaEtiquetas() {
  return tallesCatalogo.value.length > 0 ? tallesCatalogo.value : undefined;
}

function etiquetaTalleCompra(codigo: string): string {
  return etiquetaTalle(codigo, tallesParaEtiquetas());
}

const refModalProducto = useTemplateRef('refModalProducto');
const refDialogoExito = useTemplateRef<HTMLDialogElement>('refDialogoExito');

const guardando = ref(false);
const compraConfirmada = ref<CompraRegistrada | null>(null);

interface ProductoSeleccionadoBusqueda {
  producto: Producto;
  variantes: Variante[];
  indiceLinea: number;
}

const productoSeleccionadoBusqueda = ref<ProductoSeleccionadoBusqueda | null>(null);
const tallesSeleccionadosIds = ref<string[]>([]);

const proveedoresSeleccionables = computed(() =>
  [...proveedoresStore.proveedores].filter((p) => p.habilitado).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es'),
  ),
);

const proveedorSeleccionadoEtiqueta = computed(() => {
  if (!proveedorSeleccionadoId.value) return 'Elegí un proveedor habilitado…';
  return (
    proveedoresStore.proveedorPorId(proveedorSeleccionadoId.value)?.nombre ??
    'Elegí un proveedor habilitado…'
  );
});

function alternarDesplegableProveedor(): void {
  if (proveedoresSeleccionables.value.length === 0) return;
  proveedorDesplegableAbierto.value = !proveedorDesplegableAbierto.value;
}

function seleccionarProveedor(id: string): void {
  proveedorSeleccionadoId.value = id;
  proveedorDesplegableAbierto.value = false;
}

function cerrarDesplegableProveedorEnClickExterno(event: PointerEvent): void {
  const destino = event.target;
  if (destino instanceof Element && destino.closest('.fnc-combo-prov')) return;
  proveedorDesplegableAbierto.value = false;
}

interface LineaEditable {
  nombre: string;
  cantidadTexto: string;
  costoUnitarioTexto: string;
  varianteId: string | null;
}

const proveedorSeleccionadoId = ref('');
const proveedorDesplegableAbierto = ref(false);
const condicionCompra = ref<IdCondicionCompra>('CONTADO');
const observaciones = ref('');
const lineasEditable = ref<LineaEditable[]>([
  { nombre: '', cantidadTexto: '1', costoUnitarioTexto: '0', varianteId: null },
]);

const indiceLineaAltaProducto = ref(0);

const lineaBusquedaActiva = ref<number | null>(null);
let idCerrarBusqueda: ReturnType<typeof setTimeout> | null = null;

const filasVarianteCatalogo = computed((): FilaVarianteCatalogo[] => {
  return variantes.value
    .filter((v) => v.activa)
    .map((variante): FilaVarianteCatalogo | null => {
      const producto = catalogoStore.productoPorId(variante.productoId);
      if (!producto) return null;
      return {
        variante,
        producto,
        nombreLinea: catalogoStore.nombreLineaComercial(variante.id),
        nombreCategoria: catalogoStore.nombreCategoria(producto.categoriaId),
      };
    })
    .filter((f): f is FilaVarianteCatalogo => f !== null);
});

const filasProductoCatalogo = computed(() => armarFilasProductoCatalogo(filasVarianteCatalogo.value));

function resultadosProductosLinea(indice: number): FilaProductoCatalogo[] {
  if (lineaBusquedaActiva.value !== indice) return [];
  const linea = lineasEditable.value[indice];
  if (!linea || linea.varianteId) return [];
  return buscarProductosCatalogo(filasProductoCatalogo.value, linea.nombre);
}

const resultadosProductosActivos = computed(() => {
  const indice = lineaBusquedaActiva.value;
  if (indice === null) return [] as FilaProductoCatalogo[];
  return resultadosProductosLinea(indice);
});

const lineaBusquedaActivaDatos = computed(() => {
  const indice = lineaBusquedaActiva.value;
  if (indice === null) return null;
  return lineasEditable.value[indice] ?? null;
});

const mostrarPanelBusqueda = computed(() => {
  const linea = lineaBusquedaActivaDatos.value;
  if (!linea || linea.varianteId) return false;
  return linea.nombre.trim().length >= 2;
});

const textoBusquedaActivo = computed(() => lineaBusquedaActivaDatos.value?.nombre.trim() ?? '');

function limpiarPanelBusqueda(): void {
  productoSeleccionadoBusqueda.value = null;
  tallesSeleccionadosIds.value = [];
  lineaBusquedaActiva.value = null;
}

function alFocusBusquedaLinea(indice: number): void {
  if (idCerrarBusqueda) {
    clearTimeout(idCerrarBusqueda);
    idCerrarBusqueda = null;
  }
  lineaBusquedaActiva.value = indice;
}

function alBlurBusquedaLinea(): void {
  idCerrarBusqueda = setTimeout(() => {
    limpiarPanelBusqueda();
  }, 200);
}

function vincularVarianteEnLinea(
  indice: number,
  producto: Producto,
  variante: Variante,
  cantidadTexto: string,
  costoUnitarioTexto: string,
): void {
  const lineas = [...lineasEditable.value];
  const actual = lineas[indice];
  if (!actual) return;
  lineas[indice] = {
    ...actual,
    nombre: armarNombreLineaComercial(producto, variante, tallesParaEtiquetas()),
    varianteId: variante.id,
    cantidadTexto,
    costoUnitarioTexto,
  };
  lineasEditable.value = lineas;
}

function seleccionarProductoBusqueda(indice: number, fila: FilaProductoCatalogo): void {
  if (fila.variantes.length === 1) {
    const variante = fila.variantes[0]!;
    const linea = lineasEditable.value[indice];
    vincularVarianteEnLinea(
      indice,
      fila.producto,
      variante,
      linea?.cantidadTexto ?? '1',
      linea?.costoUnitarioTexto ?? '0',
    );
    limpiarPanelBusqueda();
    mensajeError.value = '';
    return;
  }

  productoSeleccionadoBusqueda.value = {
    producto: fila.producto,
    variantes: fila.variantes,
    indiceLinea: indice,
  };
  tallesSeleccionadosIds.value = [];
}

function volverABusquedaProductos(): void {
  productoSeleccionadoBusqueda.value = null;
  tallesSeleccionadosIds.value = [];
}

function talleEstaSeleccionado(varianteId: string): boolean {
  return tallesSeleccionadosIds.value.includes(varianteId);
}

function alternarTalle(varianteId: string): void {
  const conjunto = new Set(tallesSeleccionadosIds.value);
  if (conjunto.has(varianteId)) {
    conjunto.delete(varianteId);
  } else {
    conjunto.add(varianteId);
  }
  tallesSeleccionadosIds.value = [...conjunto];
}

function confirmarTallesSeleccionados(): void {
  const seleccion = productoSeleccionadoBusqueda.value;
  if (!seleccion || tallesSeleccionadosIds.value.length === 0) return;

  const variantesElegidas = seleccion.variantes.filter((v) =>
    tallesSeleccionadosIds.value.includes(v.id),
  );
  if (variantesElegidas.length === 0) return;

  const idx = seleccion.indiceLinea;
  const lineaBase = lineasEditable.value[idx];
  const cantidadTexto = lineaBase?.cantidadTexto ?? '1';
  const costoUnitarioTexto = lineaBase?.costoUnitarioTexto ?? '0';

  const [primera, ...resto] = variantesElegidas;
  const lineas = [...lineasEditable.value];

  if (lineaBase && primera) {
    lineas[idx] = {
      ...lineaBase,
      nombre: armarNombreLineaComercial(seleccion.producto, primera, tallesParaEtiquetas()),
      varianteId: primera.id,
      cantidadTexto,
      costoUnitarioTexto,
    };
  }

  const lineasNuevas = resto.map((variante) => ({
    nombre: armarNombreLineaComercial(seleccion.producto, variante, tallesParaEtiquetas()),
    cantidadTexto,
    costoUnitarioTexto,
    varianteId: variante.id,
  }));

  lineasEditable.value = [...lineas.slice(0, idx + 1), ...lineasNuevas, ...lineas.slice(idx + 1)];
  limpiarPanelBusqueda();
  mensajeError.value = '';
}

onMounted(() => {
  document.addEventListener('pointerdown', cerrarDesplegableProveedorEnClickExterno);
  void Promise.all([
    proveedoresStore.asegurarCargado(),
    catalogoStore.asegurarCargado(),
    tallesCatalogoStore.asegurarCargado(),
  ]);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', cerrarDesplegableProveedorEnClickExterno);
  if (idCerrarBusqueda) clearTimeout(idCerrarBusqueda);
});

const mensajeError = ref('');

function agregarLinea() {
  lineasEditable.value = [
    ...lineasEditable.value,
    { nombre: '', cantidadTexto: '1', costoUnitarioTexto: '0', varianteId: null },
  ];
}

function asegurarLineaDestinoAltaProducto(): number {
  const idxSinNombre = lineasEditable.value.findIndex(
    (ln) => !ln.nombre.trim() && !ln.varianteId,
  );
  if (idxSinNombre >= 0) return idxSinNombre;

  lineasEditable.value = [
    ...lineasEditable.value,
    { nombre: '', cantidadTexto: '1', costoUnitarioTexto: '0', varianteId: null },
  ];
  return lineasEditable.value.length - 1;
}

function costoUnitarioLinea(indice: number): number | undefined {
  const linea = lineasEditable.value[indice];
  if (!linea) return undefined;
  const costo = Number.parseFloat(linea.costoUnitarioTexto.replace(',', '.'));
  if (!Number.isFinite(costo) || costo < 0) return undefined;
  return Math.round(costo);
}

function abrirAltaProducto(indiceLinea?: number) {
  if (idCerrarBusqueda) {
    clearTimeout(idCerrarBusqueda);
    idCerrarBusqueda = null;
  }

  const indice = indiceLinea ?? asegurarLineaDestinoAltaProducto();
  indiceLineaAltaProducto.value = indice;
  lineaBusquedaActiva.value = indice;
  const linea = lineasEditable.value[indice];
  refModalProducto.value?.abrirNuevo({
    nombre: linea?.nombre.trim() ?? '',
    costoCompraReferencia: costoUnitarioLinea(indice),
    desdeCompra: true,
  });
}

function puedeCrearProductoDesdeBusqueda(indice: number): boolean {
  if (!puedeGestionarCatalogo.value) return false;
  const linea = lineasEditable.value[indice];
  if (!linea || linea.varianteId) return false;
  const texto = linea.nombre.trim();
  if (texto.length < 2) return false;
  return buscarProductosCatalogo(filasProductoCatalogo.value, texto).length === 0;
}

function alTeclaBusquedaLinea(event: KeyboardEvent, indice: number): void {
  if (event.key !== 'Enter') return;
  if (!puedeCrearProductoDesdeBusqueda(indice)) return;
  event.preventDefault();
  abrirAltaProducto(indice);
}

function vincularVarianteALinea(
  variante: Variante,
  producto: Producto,
  opciones?: { precioCompra?: number },
) {
  const idx = indiceLineaAltaProducto.value;
  const lineas = [...lineasEditable.value];
  const actual = lineas[idx] ?? {
    nombre: '',
    cantidadTexto: '1',
    costoUnitarioTexto: '0',
    varianteId: null,
  };

  lineas[idx] = {
    ...actual,
    nombre: armarNombreLineaComercial(producto, variante, tallesParaEtiquetas()),
    varianteId: variante.id,
    ...(opciones?.precioCompra !== undefined && opciones.precioCompra >= 0
      ? { costoUnitarioTexto: String(opciones.precioCompra) }
      : {}),
  };
  lineasEditable.value = lineas;
  mensajeError.value = '';
}

function alGuardarProductoDesdeCompra(payload: {
  producto: Producto;
  variantes: Variante[];
  precioCompra?: number;
}) {
  if (idCerrarBusqueda) {
    clearTimeout(idCerrarBusqueda);
    idCerrarBusqueda = null;
  }

  let activas = payload.variantes.filter((v) => v.activa);
  if (activas.length === 0) {
    activas = catalogoStore.variantesDeProducto(payload.producto.id);
  }
  if (activas.length === 0) {
    mensajeError.value =
      'El producto se creó en el catálogo, pero no tiene variantes activas para vincular a la compra.';
    return;
  }

  const opcionesPrecio =
    payload.precioCompra !== undefined && payload.precioCompra >= 0
      ? { precioCompra: payload.precioCompra }
      : undefined;

  if (activas.length === 1) {
    vincularVarianteALinea(activas[0]!, payload.producto, opcionesPrecio);
    limpiarPanelBusqueda();
    return;
  }

  if (opcionesPrecio) {
    const idx = indiceLineaAltaProducto.value;
    const lineas = [...lineasEditable.value];
    const actual = lineas[idx];
    if (actual) {
      lineas[idx] = {
        ...actual,
        costoUnitarioTexto: String(opcionesPrecio.precioCompra),
      };
      lineasEditable.value = lineas;
    }
  }

  productoSeleccionadoBusqueda.value = {
    producto: payload.producto,
    variantes: activas,
    indiceLinea: indiceLineaAltaProducto.value,
  };
  lineaBusquedaActiva.value = indiceLineaAltaProducto.value;
  tallesSeleccionadosIds.value = [];
}

function alEditarNombreLinea(ln: LineaEditable, indice: number): void {
  ln.varianteId = null;
  productoSeleccionadoBusqueda.value = null;
  tallesSeleccionadosIds.value = [];
  lineaBusquedaActiva.value = indice;
}

function quitarLinea(indice: number) {
  if (lineasEditable.value.length <= 1) return;
  lineasEditable.value = lineasEditable.value.filter((_, i) => i !== indice);
}

const totalCalculado = computed(() => {
  let suma = 0;
  for (const ln of lineasEditable.value) {
    const cantidad = Number.parseInt(ln.cantidadTexto, 10);
    const costo = Number.parseFloat(ln.costoUnitarioTexto.replace(',', '.'));
    if (
      ln.nombre.trim() &&
      Number.isFinite(cantidad) &&
      cantidad >= 1 &&
      Number.isFinite(costo) &&
      costo >= 0
    ) {
      suma += cantidad * Math.round(costo);
    }
  }
  return suma;
});

const proveedorSeleccionado = computed(() =>
  proveedorSeleccionadoId.value
    ? proveedoresStore.proveedorPorId(proveedorSeleccionadoId.value) ?? null
    : null,
);

const puedeCuentaProveedor = computed(
  () =>
    Boolean(
      proveedorSeleccionado.value?.habilitado &&
        proveedorSeleccionado.value.comprasCreditoHabilitadas,
    ),
);

const creditoDisponibleProveedor = computed(() => {
  const p = proveedorSeleccionado.value;
  if (!p) return 0;
  const saldo = cuentaCorrienteProveedorStore.saldoProveedorCacheado(p.id);
  return calcularCreditoDisponible(p.limiteCreditoCompras, saldo);
});

const excedeCreditoCuentaProveedor = computed(() => {
  if (condicionCompra.value !== 'CUENTA_PROVEEDOR') return false;
  const p = proveedorSeleccionado.value;
  if (!p || p.limiteCreditoCompras <= 0) return false;
  return totalCalculado.value > creditoDisponibleProveedor.value + 0.001;
});

function construirLineasValidadas(): LineaCompraRegistro[] | null {
  const resultado: LineaCompraRegistro[] = [];
  for (const ln of lineasEditable.value) {
    const nombreTrim = ln.nombre.trim();
    if (!nombreTrim) continue;

    const cantidad = Number.parseInt(ln.cantidadTexto, 10);
    if (!Number.isFinite(cantidad) || cantidad < 1) {
      return null;
    }
    const costoBruto = Number.parseFloat(ln.costoUnitarioTexto.replace(',', '.'));
    if (!Number.isFinite(costoBruto) || costoBruto < 0) {
      return null;
    }
    const costoUnitario = Math.round(costoBruto);
    const subtotal = cantidad * costoUnitario;
    resultado.push({
      varianteId: ln.varianteId,
      nombre: nombreTrim,
      cantidad,
      costoUnitario,
      subtotal,
    });
  }
  if (resultado.length === 0) return null;
  return resultado;
}

async function guardar() {
  mensajeError.value = '';
  if (!proveedorSeleccionadoId.value) {
    mensajeError.value = 'Elegí un proveedor.';
    return;
  }
  const proveedor = proveedoresStore.proveedorPorId(proveedorSeleccionadoId.value);
  if (!proveedor) {
    mensajeError.value = 'El proveedor ya no está disponible.';
    return;
  }

  const lineas = construirLineasValidadas();
  if (!lineas) {
    mensajeError.value =
      'Agregá al menos un ítem con nombre, cantidad entera mayor a cero y costo unitario válido.';
    return;
  }

  if (condicionCompra.value === 'CUENTA_PROVEEDOR') {
    if (!proveedor.comprasCreditoHabilitadas) {
      mensajeError.value = 'Este proveedor no tiene cuenta corriente habilitada.';
      return;
    }
    if (excedeCreditoCuentaProveedor.value) {
      mensajeError.value = `La compra supera el crédito disponible (${formatearMoneda(creditoDisponibleProveedor.value)}).`;
      return;
    }
  }

  const totalLineas = lineas.reduce((a, ln) => a + ln.subtotal, 0);
  guardando.value = true;
  try {
    const registrada = await registroStore.registrarCompra({
      proveedorId: proveedor.id,
      nombreProveedorMostrar: proveedor.nombre,
      condicionCompra: condicionCompra.value,
      total: totalLineas,
      lineas,
      observaciones: observaciones.value,
    });
    compraConfirmada.value = registrada;
    await nextTick();
    refDialogoExito.value?.showModal();
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo registrar la compra.');
  } finally {
    guardando.value = false;
  }
}

function aceptarCompraConfirmada(): void {
  compraConfirmada.value = null;
  refDialogoExito.value?.close();
  emit('cerrar');
}

function alCerrarDialogoExito(): void {
  if (compraConfirmada.value) {
    aceptarCompraConfirmada();
  }
}

const cantidadItemsCompraConfirmada = computed(
  () => compraConfirmada.value?.lineas.length ?? 0,
);

function cancelar() {
  emit('cerrar');
}
</script>

<template>
  <div class="fnc">
    <header class="fnc-cab">
      <h2 id="titulo-dlg-registrar-compra" class="fnc-tit">Registrar compra</h2>
      <button type="button" class="fnc-x" aria-label="Cerrar" @click="cancelar">×</button>
    </header>
    <p class="fnc-intro">
      Cargá el proveedor, la condición y los ítems recibidos. El número de compra se asignará al guardar.
    </p>

    <div class="fnc-campo fnc-combo-prov">
      <label class="fnc-etq" for="fnc-prov">Proveedor</label>
      <div class="fnc-combo" :class="{ 'fnc-combo--abierto': proveedorDesplegableAbierto }">
        <button
          id="fnc-prov"
          type="button"
          class="fnc-combo-disparador"
          :class="{ 'fnc-combo-disparador--placeholder': !proveedorSeleccionadoId }"
          :disabled="proveedoresSeleccionables.length === 0"
          aria-haspopup="listbox"
          :aria-expanded="proveedorDesplegableAbierto"
          aria-controls="fnc-lista-proveedores"
          @click="alternarDesplegableProveedor"
        >
          <span class="fnc-combo-texto">{{ proveedorSeleccionadoEtiqueta }}</span>
          <ChevronDown :size="16" class="fnc-combo-chevron" aria-hidden="true" />
        </button>
        <ul
          v-show="proveedorDesplegableAbierto"
          id="fnc-lista-proveedores"
          class="fnc-combo-lista"
          role="listbox"
          aria-label="Proveedores habilitados"
          @mousedown.prevent
        >
          <li v-for="p in proveedoresSeleccionables" :key="p.id" role="presentation">
            <button
              type="button"
              class="fnc-combo-opc"
              :class="{ 'fnc-combo-opc--on': proveedorSeleccionadoId === p.id }"
              role="option"
              :aria-selected="proveedorSeleccionadoId === p.id"
              @click="seleccionarProveedor(p.id)"
            >
              {{ p.nombre }}
            </button>
          </li>
        </ul>
      </div>
      <p v-if="proveedoresSeleccionables.length === 0" class="fnc-aviso">
        No hay proveedores habilitados. Alta o habilitá uno en <strong>Compras → Proveedores</strong>.
      </p>
    </div>

    <fieldset class="fnc-fs">
      <legend class="fnc-etq">Condición de compra</legend>
      <div class="fnc-radio-fila">
        <label class="fnc-radio">
          <input v-model="condicionCompra" type="radio" value="CONTADO" />
          Contado
        </label>
        <label class="fnc-radio" :class="{ 'fnc-radio--deshabilitado': !puedeCuentaProveedor }">
          <input
            v-model="condicionCompra"
            type="radio"
            value="CUENTA_PROVEEDOR"
            :disabled="!puedeCuentaProveedor"
          />
          Cuenta proveedor
        </label>
      </div>
      <p v-if="condicionCompra === 'CUENTA_PROVEEDOR' && proveedorSeleccionado" class="fnc-aviso">
        Crédito disponible:
        <strong>{{ formatearMoneda(creditoDisponibleProveedor) }}</strong>
        <span v-if="proveedorSeleccionado.limiteCreditoCompras <= 0"> (sin límite configurado)</span>
      </p>
      <p v-else-if="!puedeCuentaProveedor && proveedorSeleccionadoId" class="fnc-aviso">
        El proveedor elegido no tiene cuenta corriente habilitada.
      </p>
    </fieldset>

    <div class="fnc-lineas">
      <div class="fnc-lineas-cab">
        <div class="fnc-lineas-titulo">
          <span class="fnc-etq">Ítems</span>
          <p class="fnc-busq-ayuda">
            <Search :size="14" aria-hidden="true" />
            Buscá por nombre; si no existe, creá el producto desde la misma búsqueda.
          </p>
        </div>
        <div class="fnc-lineas-acciones">
          <button
            v-if="puedeGestionarCatalogo"
            type="button"
            class="fnc-mini fnc-mini--catalogo"
            @click="abrirAltaProducto()"
          >
            <PackagePlus :size="14" aria-hidden="true" />
            Nuevo producto
          </button>
          <button type="button" class="fnc-mini" @click="agregarLinea">Agregar fila</button>
        </div>
      </div>
      <div class="fnc-scroll">
        <table class="fnc-tab" aria-label="Líneas de la compra">
          <thead>
            <tr>
              <th scope="col">Descripción</th>
              <th scope="col" class="fnc-num">Cant.</th>
              <th scope="col" class="fnc-num">C. unit. (ARS)</th>
              <th scope="col" class="fnc-acc" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(ln, i) in lineasEditable"
              :key="i"
              class="fnc-fila"
              :class="{ 'fnc-fila--busq': lineaBusquedaActiva === i }"
            >
              <td class="fnc-cel-desc">
                <div class="fnc-desc-celda">
                  <div class="fnc-desc-busq">
                    <input
                      v-model="ln.nombre"
                      type="search"
                      class="fnc-inp"
                      :class="{ 'fnc-inp--catalogo': ln.varianteId }"
                      maxlength="140"
                      placeholder="Buscar o describir ítem…"
                      :title="ln.varianteId ? 'Vinculado al catálogo' : 'Escribí para buscar productos cargados'"
                      autocomplete="off"
                      spellcheck="false"
                      @input="alEditarNombreLinea(ln, i)"
                      @focus="alFocusBusquedaLinea(i)"
                      @blur="alBlurBusquedaLinea"
                      @keydown="alTeclaBusquedaLinea($event, i)"
                    />
                  </div>
                  <button
                    v-if="puedeGestionarCatalogo"
                    type="button"
                    class="fnc-mini-icono fnc-mini-icono--texto"
                    title="Crear producto con este nombre"
                    @click="abrirAltaProducto(i)"
                  >
                    <PackagePlus :size="14" aria-hidden="true" />
                    <span class="fnc-mini-icono-etiq">Crear</span>
                  </button>
                </div>
              </td>
              <td class="fnc-cel-cant fnc-num">
                <input
                  v-model="ln.cantidadTexto"
                  type="text"
                  inputmode="numeric"
                  class="fnc-inp fnc-inp-num"
                  autocomplete="off"
                />
              </td>
              <td class="fnc-cel-costo fnc-num">
                <input
                  v-model="ln.costoUnitarioTexto"
                  type="text"
                  inputmode="decimal"
                  class="fnc-inp fnc-inp-num"
                  autocomplete="off"
                />
              </td>
              <td class="fnc-cel-acc fnc-acc">
                <button
                  type="button"
                  class="fnc-quitar"
                  :disabled="lineasEditable.length <= 1"
                  title="Quitar fila"
                  @click="quitarLinea(i)"
                >
                  Quitar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section
        v-if="lineaBusquedaActiva !== null && !lineaBusquedaActivaDatos?.varianteId"
        class="fnc-busq-panel"
        aria-live="polite"
        @mousedown.prevent
      >
        <div v-if="productoSeleccionadoBusqueda" class="fnc-busq-talles">
          <div class="fnc-busq-talles-cab">
            <button type="button" class="fnc-busq-volver" @mousedown.prevent="volverABusquedaProductos">
              ← Volver
            </button>
            <p class="fnc-busq-prod-nombre">{{ productoSeleccionadoBusqueda.producto.nombre }}</p>
            <p class="fnc-busq-talles-etq">Elegí uno o más talles para esta compra</p>
          </div>
          <div class="fnc-busq-talles-grid" role="group" aria-label="Talles disponibles">
            <button
              v-for="variante in productoSeleccionadoBusqueda.variantes"
              :key="variante.id"
              type="button"
              class="fnc-busq-talle"
              :class="{ 'fnc-busq-talle--on': talleEstaSeleccionado(variante.id) }"
              :aria-pressed="talleEstaSeleccionado(variante.id)"
              @mousedown.prevent="alternarTalle(variante.id)"
            >
              {{ etiquetaTalleCompra(variante.talle) }}
            </button>
          </div>
          <footer class="fnc-busq-talles-pie">
            <button
              type="button"
              class="fnc-busq-agregar"
              :disabled="tallesSeleccionadosIds.length === 0"
              @mousedown.prevent="confirmarTallesSeleccionados"
            >
              Agregar
              <span v-if="tallesSeleccionadosIds.length > 0">
                ({{ tallesSeleccionadosIds.length }})
              </span>
            </button>
          </footer>
        </div>

        <template v-else>
          <p v-if="!mostrarPanelBusqueda" class="fnc-busq-hint">
            Escribí al menos 2 letras para buscar en el catálogo.
          </p>

          <p v-else-if="catalogoCargando" class="fnc-busq-hint">Cargando catálogo…</p>

          <ul
            v-else-if="resultadosProductosActivos.length > 0"
            class="fnc-busq-lista"
            role="listbox"
            :aria-label="`Productos para ${textoBusquedaActivo}`"
          >
            <li v-for="fila in resultadosProductosActivos" :key="fila.producto.id">
              <button
                type="button"
                class="fnc-busq-prod"
                role="option"
                @mousedown.prevent="seleccionarProductoBusqueda(lineaBusquedaActiva!, fila)"
              >
                <span class="fnc-busq-prod-nom">{{ fila.producto.nombre }}</span>
                <span class="fnc-busq-prod-meta">
                  <span v-if="fila.nombreCategoria">{{ fila.nombreCategoria }}</span>
                  <span>{{ etiquetaCantidadTalles(fila.variantes.length) }}</span>
                </span>
              </button>
            </li>
          </ul>

          <div v-else class="fnc-busq-vacio">
            <p class="fnc-busq-hint fnc-busq-hint--vacio">
              No encontramos «{{ textoBusquedaActivo }}» en el catálogo.
            </p>
            <button
              v-if="puedeGestionarCatalogo && lineaBusquedaActiva !== null"
              type="button"
              class="fnc-busq-crear"
              @mousedown.prevent="abrirAltaProducto(lineaBusquedaActiva)"
            >
              <PackagePlus :size="16" aria-hidden="true" />
              Crear «{{ textoBusquedaActivo }}»
            </button>
            <p v-if="puedeGestionarCatalogo" class="fnc-busq-atajo">
              También podés presionar <kbd>Enter</kbd> en el campo de búsqueda.
            </p>
          </div>
        </template>
      </section>
    </div>

    <label class="fnc-etq" for="fnc-obs">Observaciones</label>
    <textarea id="fnc-obs" v-model="observaciones" class="fnc-area" rows="2" maxlength="500" />

    <p class="fnc-total-prev">
      <span>Total estimado</span>
      <strong>{{ formatearMoneda(totalCalculado) }}</strong>
    </p>

    <p v-if="mensajeError" class="fnc-error" role="alert">{{ mensajeError }}</p>

    <footer class="fnc-pie">
      <button type="button" class="fnc-btn-sec" :disabled="guardando" @click="cancelar">Cancelar</button>
      <button type="button" class="fnc-btn-pri" :disabled="guardando" @click="guardar">
        {{ guardando ? 'Guardando…' : 'Guardar compra' }}
      </button>
    </footer>

    <ModalFormularioProducto ref="refModalProducto" @guardado="alGuardarProductoDesdeCompra" />

    <Teleport to="body">
      <dialog
        ref="refDialogoExito"
        class="fnc-exito-modal"
        aria-labelledby="fnc-exito-titulo"
        aria-describedby="fnc-exito-desc"
        @close="alCerrarDialogoExito"
        @cancel.prevent="aceptarCompraConfirmada"
      >
        <div v-if="compraConfirmada" class="fnc-exito-panel" @click.stop>
          <div class="fnc-exito-anim" aria-hidden="true">
            <span class="fnc-exito-anillo" />
            <CheckCircle2 class="fnc-exito-ico" :size="52" stroke-width="1.75" />
          </div>

          <h2 id="fnc-exito-titulo" class="fnc-exito-titulo">Compra registrada</h2>

          <p id="fnc-exito-desc" class="fnc-exito-det">
            <span class="fnc-exito-num">{{ compraConfirmada.numero }}</span>
            ·
            {{ formatearMoneda(compraConfirmada.total) }}
          </p>

          <p class="fnc-exito-prov">{{ compraConfirmada.nombreProveedorMostrar }}</p>

          <ul class="fnc-exito-resumen" aria-label="Resumen de la compra">
            <li>
              <span class="fnc-exito-resumen-etiq">Condición</span>
              <span>{{ etiquetaCondicionCompra(compraConfirmada.condicionCompra) }}</span>
            </li>
            <li>
              <span class="fnc-exito-resumen-etiq">Ítems</span>
              <span>{{ cantidadItemsCompraConfirmada }}</span>
            </li>
          </ul>

          <button type="button" class="fnc-exito-btn" @click="aceptarCompraConfirmada">
            Aceptar
          </button>
        </div>
      </dialog>
    </Teleport>
  </div>
</template>

<style scoped>
.fnc {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.25rem 1.15rem;
  min-height: min(78dvh, 44rem);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.fnc-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  flex-shrink: 0;
}

.fnc-tit {
  margin: 0;
  font-size: 1.06rem;
  font-weight: 700;
}

.fnc-x {
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.2rem;
}

.fnc-x:hover {
  color: var(--color-texto);
}

.fnc-intro {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
  flex-shrink: 0;
}

.fnc-etq {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-texto-apagado);
}

.fnc-select,
.fnc-inp,
.fnc-area {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.88rem;
}

.fnc-campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
}

.fnc-combo {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.fnc-combo-disparador {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.88rem;
  text-align: left;
  cursor: pointer;
}

.fnc-combo-disparador:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.fnc-combo-disparador--placeholder .fnc-combo-texto {
  color: var(--color-texto-apagado);
}

.fnc-combo-texto {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fnc-combo-chevron {
  flex-shrink: 0;
  color: var(--color-texto-apagado);
  transition: transform 0.15s ease;
}

.fnc-combo--abierto .fnc-combo-chevron {
  transform: rotate(180deg);
}

.fnc-combo-lista {
  position: absolute;
  z-index: 40;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  max-height: min(14rem, 42dvh);
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
}

.fnc-combo-opc {
  display: block;
  width: 100%;
  padding: 0.5rem 0.55rem;
  border: none;
  border-radius: calc(var(--radio-control) - 2px);
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  font-size: 0.88rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.fnc-combo-opc:hover,
.fnc-combo-opc--on {
  background: var(--color-acento-suave);
}

.fnc-fs {
  margin: 0;
  padding: 0;
  border: none;
  flex-shrink: 0;
}

.fnc-fs legend {
  margin-bottom: 0.35rem;
}

.fnc-radio-fila {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.fnc-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  cursor: pointer;
}

.fnc-lineas {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  flex: 1;
  min-height: 0;
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
}

.fnc-lineas-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.fnc-lineas-titulo {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.fnc-busq-ayuda {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-texto-suave);
}

.fnc-lineas-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.fnc-mini {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-acento-hover);
  cursor: pointer;
}

.fnc-mini--catalogo {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.fnc-desc-celda {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  min-width: 0;
}

.fnc-desc-busq {
  position: relative;
  flex: 1;
  min-width: 0;
}

.fnc-desc-busq .fnc-inp {
  width: 100%;
  min-width: 0;
}

.fnc-fila--busq td {
  background: color-mix(in srgb, var(--color-acento-suave) 55%, transparent);
}

.fnc-fila--busq .fnc-inp {
  border-color: var(--color-acento-borde);
}

.fnc-busq-panel {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo-cabecera);
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.fnc-busq-hint {
  margin: 0;
  padding: 0.35rem 0.15rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-texto-apagado);
}

.fnc-busq-hint--vacio {
  color: var(--color-texto-suave);
}

.fnc-busq-vacio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.15rem 0;
}

.fnc-busq-crear {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--color-acento-borde);
  border-radius: 9px;
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.fnc-busq-crear:hover {
  background: color-mix(in srgb, var(--color-acento-suave) 65%, var(--color-acento-hover));
}

.fnc-busq-atajo {
  margin: 0;
  font-size: 0.74rem;
  color: var(--color-texto-apagado);
}

.fnc-busq-atajo kbd {
  display: inline-block;
  padding: 0.05rem 0.35rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  background: var(--color-fondo-elevado);
  font-family: inherit;
  font-size: 0.72rem;
}

.fnc-busq-lista {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 9rem;
  overflow: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  min-width: 0;
}

.fnc-busq-prod {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 0.4rem 0.35rem;
  border: none;
  border-bottom: 1px solid color-mix(in srgb, var(--color-borde) 70%, transparent);
  background: transparent;
  color: var(--color-texto);
  font: inherit;
  font-size: 0.84rem;
  text-align: left;
  cursor: pointer;
}

.fnc-busq-lista li:last-child .fnc-busq-prod {
  border-bottom: none;
}

.fnc-busq-prod:hover,
.fnc-busq-prod:focus-visible {
  background: var(--color-acento-suave);
  outline: none;
}

.fnc-busq-prod-nom {
  font-weight: 500;
  line-height: 1.3;
  min-width: 0;
  overflow-wrap: anywhere;
}

.fnc-busq-prod-meta {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
}

.fnc-busq-talles {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.fnc-busq-talles-cab {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.fnc-busq-volver {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  font: inherit;
  font-size: 0.76rem;
  cursor: pointer;
}

.fnc-busq-volver:hover {
  color: var(--color-acento-hover);
}

.fnc-busq-prod-nombre {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
}

.fnc-busq-talles-etq {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-texto-apagado);
}

.fnc-busq-talles-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.fnc-busq-talle {
  min-width: 2.35rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: 999px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.fnc-busq-talle:hover {
  border-color: var(--color-acento-borde);
}

.fnc-busq-talle--on {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
}

.fnc-busq-talles-pie {
  display: flex;
  justify-content: flex-end;
}

.fnc-busq-agregar {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-acento-borde);
  border-radius: 8px;
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.fnc-busq-agregar:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fnc-busq-agregar:not(:disabled):hover {
  background: color-mix(in srgb, var(--color-acento-suave) 70%, var(--color-acento-hover));
}

.fnc-inp--catalogo {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.fnc-mini-icono {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  padding: 0;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-acento-hover);
  cursor: pointer;
}

.fnc-mini-icono:hover {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.fnc-mini-icono--texto {
  width: auto;
  min-width: 1.85rem;
  padding: 0 0.45rem;
  gap: 0.25rem;
}

.fnc-mini-icono-etiq {
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
}

.fnc-scroll {
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  overflow: auto;
  max-height: 14rem;
  max-width: 100%;
  min-width: 0;
}

.fnc-tab td {
  overflow: hidden;
}

.fnc-tab {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  table-layout: fixed;
}

.fnc-tab th,
.fnc-tab td {
  padding: 0.35rem 0.45rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.fnc-tab thead th {
  position: sticky;
  top: 0;
  background: var(--color-fondo-cabecera);
  font-weight: 600;
  color: var(--color-texto-suave);
}

.fnc-num {
  text-align: right;
  width: 6.5rem;
}

.fnc-acc {
  width: 4rem;
  text-align: right;
}

.fnc-inp-num {
  max-width: 6.8rem;
  margin-inline-start: auto;
  display: block;
}

.fnc-quitar {
  padding: 0.2rem 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  cursor: pointer;
  text-decoration: underline;
}

.fnc-quitar:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: none;
}

.fnc-area {
  resize: vertical;
  min-height: 2.5rem;
}

.fnc-total-prev {
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radio-control);
  background: var(--color-acento-suave);
  border: 1px solid var(--color-acento-borde);
  font-size: 0.86rem;
  flex-shrink: 0;
}

.fnc-total-prev strong {
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
}

.fnc-error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-peligro);
}

.fnc-aviso {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-texto-suave);
}

.fnc-pie {
  margin-top: auto;
  padding-top: 0.35rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

.fnc-btn-sec {
  padding: 0.5rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}

.fnc-btn-pri {
  padding: 0.5rem 1rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento));
  cursor: pointer;
  box-shadow: var(--color-sombra-elevada);
}

.fnc-btn-pri:hover {
  filter: brightness(1.05);
}

@media (max-width: 720px) {
  .fnc {
    gap: 0.75rem;
    padding: 0.85rem 0.9rem 1rem;
    min-height: 0;
    overflow-x: hidden;
  }

  .fnc-combo-disparador {
    font-size: 1rem;
  }

  .fnc-combo-lista {
    max-height: min(12rem, 38dvh);
  }

  .fnc-select,
  .fnc-inp,
  .fnc-area {
    font-size: 1rem;
    max-width: 100%;
  }

  .fnc-lineas-cab {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
  }

  .fnc-lineas-acciones {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
    width: 100%;
  }

  .fnc-lineas-acciones .fnc-mini {
    justify-content: center;
    padding: 0.45rem 0.5rem;
    font-size: 0.8rem;
    min-width: 0;
  }

  .fnc-scroll {
    max-height: none;
    overflow: visible;
    border: none;
    background: transparent;
  }

  .fnc-tab {
    display: block;
    width: 100%;
    max-width: 100%;
    border-collapse: separate;
    border-spacing: 0 0.55rem;
    table-layout: auto;
  }

  .fnc-tab thead {
    display: none;
  }

  .fnc-tab tbody {
    display: block;
    width: 100%;
    max-width: 100%;
  }

  .fnc-tab tr.fnc-fila {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.5rem 0.65rem;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.65rem 0.7rem;
    border: 1px solid var(--color-borde);
    border-radius: 10px;
    background: var(--color-fondo-cabecera);
  }

  .fnc-tab tr.fnc-fila--busq {
    border-color: var(--color-acento-borde);
    background: color-mix(in srgb, var(--color-acento-suave) 55%, var(--color-fondo-cabecera));
  }

  .fnc-tab td {
    display: block;
    width: auto;
    max-width: 100%;
    min-width: 0;
    padding: 0;
    border-bottom: none;
    overflow: visible;
  }

  .fnc-tab td + td {
    margin-top: 0;
  }

  .fnc-cel-desc {
    grid-column: 1 / -1;
  }

  .fnc-cel-acc {
    grid-column: 1 / -1;
  }

  .fnc-cel-desc::before,
  .fnc-cel-cant::before,
  .fnc-cel-costo::before {
    display: block;
    margin-bottom: 0.28rem;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-texto-apagado);
  }

  .fnc-cel-desc::before {
    content: 'Descripción';
  }

  .fnc-cel-cant::before {
    content: 'Cantidad';
  }

  .fnc-cel-costo::before {
    content: 'Costo unit. (ARS)';
  }

  .fnc-desc-celda {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }

  .fnc-mini-icono--texto {
    width: 100%;
    min-height: 2.35rem;
    justify-content: center;
  }

  .fnc-cel-cant,
  .fnc-cel-costo {
    text-align: left;
    width: auto;
  }

  .fnc-inp-num {
    max-width: none;
    width: 100%;
    margin-inline-start: 0;
  }

  .fnc-cel-acc {
    width: auto;
    text-align: left;
    margin-top: 0.35rem;
    padding-top: 0.35rem;
    border-top: 1px dashed var(--color-borde);
  }

  .fnc-quitar {
    padding: 0.15rem 0;
  }

  .fnc-busq-crear {
    width: 100%;
    max-width: 100%;
    white-space: normal;
    text-align: center;
    overflow-wrap: anywhere;
  }

  .fnc-busq-prod {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .fnc-busq-prod-meta {
    flex-wrap: wrap;
  }

  .fnc-pie {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .fnc-btn-sec,
  .fnc-btn-pri {
    width: 100%;
    text-align: center;
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
  }
}

.fnc-exito-modal {
  padding: 0;
  border: none;
  background: transparent;
  max-width: none;
  max-height: none;
}

.fnc-exito-modal::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(4px);
}

.fnc-exito-modal[open] .fnc-exito-panel {
  animation: fnc-exito-panel 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.fnc-exito-panel {
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.5rem 1.25rem 1.2rem;
  border-radius: calc(var(--radio-control) + 4px);
  border: 1px solid var(--color-borde);
  background: linear-gradient(180deg, var(--color-fondo-elevado) 0%, var(--color-fondo-cabecera) 100%);
  box-shadow: var(--color-sombra-elevada);
  text-align: center;
}

.fnc-exito-anim {
  position: relative;
  display: grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  margin: 0 auto 0.75rem;
}

.fnc-exito-anillo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--color-acento-borde);
}

.fnc-exito-ico {
  color: var(--color-acento-hover);
}

.fnc-exito-titulo {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.fnc-exito-det {
  margin: 0.4rem 0 0;
  font-size: 0.9rem;
  color: var(--color-texto-suave);
  font-variant-numeric: tabular-nums;
}

.fnc-exito-num {
  font-weight: 700;
  color: var(--color-acento-hover);
}

.fnc-exito-prov {
  margin: 0.35rem 0 0;
  font-size: 0.84rem;
  color: var(--color-texto-apagado);
}

.fnc-exito-resumen {
  margin: 0.85rem 0 0;
  padding: 0.55rem 0.65rem;
  list-style: none;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  text-align: left;
}

.fnc-exito-resumen li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
  padding: 0.2rem 0;
}

.fnc-exito-resumen li + li {
  margin-top: 0.25rem;
  padding-top: 0.35rem;
  border-top: 1px dashed var(--color-borde);
}

.fnc-exito-resumen-etiq {
  color: var(--color-texto-apagado);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
}

.fnc-exito-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2.55rem;
  margin-top: 1rem;
  padding: 0.5rem 0.85rem;
  border: none;
  border-radius: var(--radio-control);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento));
  cursor: pointer;
  box-shadow: var(--color-sombra-elevada);
}

.fnc-exito-btn:hover {
  filter: brightness(1.05);
}

@keyframes fnc-exito-panel {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
