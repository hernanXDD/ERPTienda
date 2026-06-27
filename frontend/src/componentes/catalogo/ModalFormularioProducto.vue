<script setup lang="ts">
import { Barcode, Layers, Trash2, X } from 'lucide-vue-next';
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import {
  calcularPorcentajeGanancia,
  calcularPrecioVentaSugerido,
  obtenerUltimoCostoCompraProducto,
} from '../../modulos/catalogo/costosProducto';
import { etiquetaTalle } from '../../modulos/catalogo/catalogoPresentacion';
import {
  COLOR_VARIANTE_VACIO,
  crearTallesBorradorAltaRapidaCompra,
  crearTallesBorradorDesdeCatalogo,
  normalizarTalle,
  resolverCodigoTalleUnicoAltaCompra,
  tallesBorradorDesdeVariantes,
  type BorradorTalle,
} from '../../modulos/catalogo/tallesCatalogo';
import { TALLES_CATALOGO_SEMILLA } from '../../datos/tallesCatalogo';
import {
  codigoBarrasDesdeIdVariante,
  generarCodigoBarrasNuevoVariante,
} from '../../modulos/catalogo/codigoBarras';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useCatalogoStore } from '../../stores/catalogo';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useRegistroComprasStore } from '../../stores/registroCompras';
import { useStockStore } from '../../stores/stock';
import { useTallesCatalogoStore } from '../../stores/tallesCatalogo';
import type { Producto, Variante } from '../../tipos/catalogo';
import { formatearDecimal, formatearMoneda } from '../../utilidades/formatoMoneda';

export interface OpcionesAltaProducto {
  nombre?: string;
  costoCompraReferencia?: number;
  /** Alta desde registro de compras: permite editar el costo y devolverlo a la línea. */
  desdeCompra?: boolean;
}

const emit = defineEmits<{
  cerrar: [];
  guardado: [
    payload: {
      producto: Producto;
      variantes: Variante[];
      modo: 'crear' | 'editar';
      precioCompra?: number;
    },
  ];
}>();

const configuracionSistemaStore = useConfiguracionSistemaStore();
const catalogo = useCatalogoStore();
const stockStore = useStockStore();
const registroCompras = useRegistroComprasStore();
const tallesCatalogoStore = useTallesCatalogoStore();
const { tienePermiso } = usePermisosOperador();
const puedeGestionarCatalogo = computed(() => tienePermiso('puedeGestionarCatalogoProductos'));
const { categorias, variantes } = storeToRefs(catalogo);
const { compras } = storeToRefs(registroCompras);
const { parametros: parametrosSistema } = storeToRefs(configuracionSistemaStore);

const refDialogo = useTemplateRef<HTMLDialogElement>('refDialogo');
const refInputNombre = useTemplateRef<HTMLInputElement>('refInputNombre');
const refDialogoTalles = useTemplateRef<HTMLDialogElement>('refDialogoTalles');
const refDialogoReemplazarCb = useTemplateRef<HTMLDialogElement>('refDialogoReemplazarCb');
const filaPendienteGenerarCb = ref<BorradorTalle | null>(null);
const tallePersonalizadoNuevo = ref('');

const formulario = reactive({
  nombre: '',
  marca: '',
  descripcion: '',
  categoriaId: '',
  precioCompra: '' as string | number,
  precioVenta: '' as string | number,
});

const tallesBorrador = ref<BorradorTalle[]>(crearTallesBorradorDesdeCatalogo());
const idEdicion = ref<string | null>(null);
const desdeCompraActivo = ref(false);
const costoCompraReferenciaExterno = ref<number | null>(null);
const mensajeError = ref('');
const guardando = ref(false);

const idsVariantesProductoEnModal = computed(() => {
  if (!idEdicion.value) return [] as string[];
  return catalogo.todasVariantesDeProducto(idEdicion.value).map((v) => v.id);
});

function parsearPrecioEntero(bruto: string | number): number | null {
  if (typeof bruto === 'number') {
    return Number.isFinite(bruto) && bruto >= 0 ? Math.round(bruto) : null;
  }
  const texto = String(bruto).trim();
  if (!texto) return null;
  const valor = Number(texto.replace(',', '.'));
  return Number.isFinite(valor) && valor >= 0 ? Math.round(valor) : null;
}

const precioCompraReferencia = computed(() => {
  if (desdeCompraActivo.value) {
    return parsearPrecioEntero(formulario.precioCompra);
  }
  if (costoCompraReferenciaExterno.value !== null) {
    return costoCompraReferenciaExterno.value;
  }
  return obtenerUltimoCostoCompraProducto(idsVariantesProductoEnModal.value, compras.value);
});

const precioVentaNumericoModal = computed(() => {
  const bruto = formulario.precioVenta;
  if (typeof bruto === 'number') return bruto;
  const texto = String(bruto).trim();
  if (!texto) return Number.NaN;
  return Number(texto.replace(',', '.'));
});

const porcentajeGananciaReferencia = computed(() =>
  calcularPorcentajeGanancia(precioVentaNumericoModal.value, precioCompraReferencia.value),
);

const textoPrecioCompraReferencia = computed(() => {
  const costo = precioCompraReferencia.value;
  if (costo === null) return 'Sin compras';
  return formatearMoneda(costo);
});

const textoPorcentajeGanancia = computed(() => {
  const pct = porcentajeGananciaReferencia.value;
  if (pct === null) return '—';
  const prefijo = pct > 0 ? '+' : '';
  return `${prefijo}${formatearDecimal(pct)} %`;
});

const clasePorcentajeGanancia = computed(() => {
  const pct = porcentajeGananciaReferencia.value;
  if (pct === null) return 'cat-prod-valor-ref--neutro';
  if (pct < 0) return 'cat-prod-valor-ref--bajo';
  if (pct >= 30) return 'cat-prod-valor-ref--alto';
  return 'cat-prod-valor-ref--medio';
});

const precioVentaSugerido = computed(() =>
  calcularPrecioVentaSugerido(
    precioCompraReferencia.value,
    parametrosSistema.value.porcentajeGananciaSugerida,
  ),
);

const textoPrecioVentaSugerido = computed(() => {
  const sugerido = precioVentaSugerido.value;
  if (sugerido === null) return 'Sin costo de compra';
  return formatearMoneda(sugerido);
});

const puedeAplicarPrecioSugerido = computed(
  () => precioVentaSugerido.value !== null && puedeGestionarCatalogo.value,
);

function catalogoTallesParaBorrador(): typeof TALLES_CATALOGO_SEMILLA {
  return tallesCatalogoStore.talles.length > 0
    ? tallesCatalogoStore.talles
    : TALLES_CATALOGO_SEMILLA;
}

function catalogoTallesHabilitadosParaAlta(): typeof TALLES_CATALOGO_SEMILLA {
  return tallesCatalogoStore.habilitados.length > 0
    ? tallesCatalogoStore.habilitados
    : TALLES_CATALOGO_SEMILLA.filter((t) => t.habilitado);
}

function etiquetaTalleModal(codigo: string): string {
  return etiquetaTalle(codigo, catalogoTallesParaBorrador());
}

const etiquetaTalleUnicoPorDefecto = computed(() =>
  etiquetaTalleModal(resolverCodigoTalleUnicoAltaCompra(catalogoTallesHabilitadosParaAlta())),
);

function reiniciarTallesBorradorNuevo(): void {
  tallesBorrador.value = crearTallesBorradorDesdeCatalogo(catalogoTallesHabilitadosParaAlta());
}

function resetFormulario(): void {
  formulario.nombre = '';
  formulario.marca = '';
  formulario.descripcion = '';
  formulario.categoriaId = categorias.value[0]?.id ?? '';
  formulario.precioCompra = '';
  formulario.precioVenta = '';
  reiniciarTallesBorradorNuevo();
  tallePersonalizadoNuevo.value = '';
  idEdicion.value = null;
  desdeCompraActivo.value = false;
  costoCompraReferenciaExterno.value = null;
  mensajeError.value = '';
}

function tituloModal(): string {
  if (idEdicion.value) return 'Modificar producto';
  if (desdeCompraActivo.value) return 'Alta rápida para compra';
  return 'Nuevo producto';
}

function textoAyudaModal(): string {
  if (desdeCompraActivo.value) {
    return 'Completá lo mínimo para cargar el ítem en esta compra. Podés ajustar talles y códigos de barras después en el catálogo.';
  }
  return 'Completá los datos del artículo. El color o modelo va en el nombre (ej. «remera negra»); habilitá los talles que vendés.';
}

function aplicarPrecioVentaSugerido(): void {
  const sugerido = precioVentaSugerido.value;
  if (sugerido === null) return;
  formulario.precioVenta = sugerido;
}

const tallesHabilitados = computed(() => tallesBorrador.value.filter((f) => f.habilitado));

const mapaTipoTalleCatalogo = computed(
  () =>
    new Map(
      catalogoTallesParaBorrador().map((talle) => [
        talle.codigo.trim().toLowerCase(),
        talle.tipo,
      ]),
    ),
);

const tallesPredefinidosLetra = computed(() =>
  tallesBorrador.value.filter(
    (fila) =>
      !fila.esPersonalizado && mapaTipoTalleCatalogo.value.get(fila.talle.toLowerCase()) === 'LETRA',
  ),
);

const tallesPredefinidosNumero = computed(() =>
  tallesBorrador.value.filter(
    (fila) =>
      !fila.esPersonalizado &&
      mapaTipoTalleCatalogo.value.get(fila.talle.toLowerCase()) === 'NUMERO',
  ),
);

const tallesPersonalizados = computed(() => tallesBorrador.value.filter((f) => f.esPersonalizado));

function abrirSelectorTalles(): void {
  mensajeError.value = '';
  refDialogoTalles.value?.showModal();
}

function cerrarSelectorTalles(): void {
  refDialogoTalles.value?.close();
}

function alternarTalle(fila: BorradorTalle): void {
  fila.habilitado = !fila.habilitado;
  mensajeError.value = '';
}

function agregarTallePersonalizado(): void {
  const talle = normalizarTalle(tallePersonalizadoNuevo.value);
  if (!talle) {
    mensajeError.value = 'Indicá un talle para agregar.';
    return;
  }
  const duplicado = tallesBorrador.value.some(
    (f) => f.talle.toLowerCase() === talle.toLowerCase(),
  );
  if (duplicado) {
    mensajeError.value = 'Ese talle ya está en la lista.';
    return;
  }
  tallesBorrador.value = [
    ...tallesBorrador.value,
    {
      talle,
      habilitado: true,
      codigoBarras: '',
      esPersonalizado: true,
    },
  ];
  tallePersonalizadoNuevo.value = '';
  mensajeError.value = '';
}

function quitarTallePersonalizado(fila: BorradorTalle): void {
  if (!fila.esPersonalizado) return;
  tallesBorrador.value = tallesBorrador.value.filter((f) => f !== fila);
  mensajeError.value = '';
}

function codigosBarrasOcupados(excluirIdVariante?: string): Set<string> {
  const ocupados = new Set<string>();
  for (const variante of variantes.value) {
    if (excluirIdVariante && variante.id === excluirIdVariante) continue;
    const codigo = variante.codigoBarras.trim();
    if (codigo) ocupados.add(codigo);
  }
  for (const fila of tallesBorrador.value) {
    if (!fila.habilitado) continue;
    if (excluirIdVariante && fila.id === excluirIdVariante) continue;
    const codigo = fila.codigoBarras.trim();
    if (codigo) ocupados.add(codigo);
  }
  return ocupados;
}

function generarCodigoBarrasParaFila(fila: BorradorTalle): void {
  try {
    const ocupados = codigosBarrasOcupados(fila.id);
    let codigo: string;
    if (fila.id) {
      codigo = codigoBarrasDesdeIdVariante(fila.id);
      if (ocupados.has(codigo)) {
        codigo = generarCodigoBarrasNuevoVariante(ocupados);
      }
    } else {
      codigo = generarCodigoBarrasNuevoVariante(ocupados);
    }
    fila.codigoBarras = codigo;
  } catch {
    mensajeError.value = 'No se pudo generar un código de barras único.';
  }
}

function solicitarGenerarCodigoBarrasParaFila(fila: BorradorTalle): void {
  if (!puedeGestionarCatalogo.value) return;
  if (fila.codigoBarras.trim()) {
    filaPendienteGenerarCb.value = fila;
    refDialogoReemplazarCb.value?.showModal();
    return;
  }
  generarCodigoBarrasParaFila(fila);
}

function confirmarReemplazoCodigoBarras(): void {
  if (filaPendienteGenerarCb.value) {
    generarCodigoBarrasParaFila(filaPendienteGenerarCb.value);
  }
  cerrarDialogoReemplazarCb();
}

function cerrarDialogoReemplazarCb(): void {
  refDialogoReemplazarCb.value?.close();
  filaPendienteGenerarCb.value = null;
}

function generarCodigosBarrasFaltantes(): void {
  let generados = 0;
  for (const fila of tallesBorrador.value) {
    if (fila.habilitado && !fila.codigoBarras.trim()) {
      generarCodigoBarrasParaFila(fila);
      generados += 1;
    }
  }
  if (generados === 0) {
    mensajeError.value = 'Todos los talles habilitados ya tienen código de barras.';
    return;
  }
  mensajeError.value = '';
}

function cerrarModal(): void {
  refDialogo.value?.close();
}

function alCerrarDialogo(): void {
  resetFormulario();
  emit('cerrar');
}

function validarTallesBorrador(): BorradorTalle[] | null {
  const habilitados = tallesBorrador.value.filter((f) => f.habilitado);
  if (habilitados.length === 0) {
    mensajeError.value = 'Habilitá al menos un talle para el producto.';
    return null;
  }

  const codigosBarras = new Set<string>();
  for (const fila of habilitados) {
    const talle = normalizarTalle(fila.talle);
    if (!talle) {
      mensajeError.value = 'Cada talle habilitado debe tener un nombre válido.';
      return null;
    }

    const codigoBarras = fila.codigoBarras.trim();
    if (codigoBarras) {
      if (codigosBarras.has(codigoBarras)) {
        mensajeError.value = 'Hay dos talles con el mismo código de barras.';
        return null;
      }
      const duplicadoCatalogo = variantes.value.find(
        (v) => v.codigoBarras.trim() === codigoBarras && v.id !== fila.id,
      );
      if (duplicadoCatalogo) {
        mensajeError.value = 'Ese código de barras ya está asignado a otra variante.';
        return null;
      }
      codigosBarras.add(codigoBarras);
    }
  }

  return habilitados.map((fila) => ({
    ...fila,
    talle: normalizarTalle(fila.talle),
    codigoBarras: fila.codigoBarras.trim(),
  }));
}

async function persistirVariantes(productoId: string, filas: BorradorTalle[]): Promise<Variante[] | null> {
  const actuales = catalogo.todasVariantesDeProducto(productoId);
  const idsActivos = new Set<string>();
  const guardadas: Variante[] = [];

  try {
    for (const fila of filas) {
      const datos: Omit<Variante, 'id'> = {
        productoId,
        talle: fila.talle,
        color: COLOR_VARIANTE_VACIO,
        codigoBarras: fila.codigoBarras,
        activa: true,
      };
      if (fila.id) {
        const ok = await catalogo.actualizarVariante(fila.id, datos);
        if (!ok) {
          mensajeError.value = 'Ya existe otra variante con ese talle.';
          return null;
        }
        const actualizada = catalogo.variantePorId(fila.id);
        if (!actualizada) {
          mensajeError.value = 'No se pudo actualizar un talle del producto.';
          return null;
        }
        guardadas.push(actualizada);
        idsActivos.add(fila.id);
      } else {
        const creada = await catalogo.agregarVariante(datos);
        if (!creada) {
          mensajeError.value = 'Ya existe una variante con ese talle.';
          return null;
        }
        guardadas.push(creada);
        idsActivos.add(creada.id);
      }
    }

    for (const existente of actuales) {
      if (idsActivos.has(existente.id) || !existente.activa) continue;
      const ok = await catalogo.actualizarVariante(existente.id, {
        productoId,
        talle: existente.talle,
        color: COLOR_VARIANTE_VACIO,
        codigoBarras: existente.codigoBarras,
        activa: false,
      });
      if (!ok) {
        mensajeError.value = 'No se pudo desactivar un talle del producto.';
        return null;
      }
    }

    return guardadas;
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudieron guardar los talles.');
    return null;
  }
}

async function guardar(): Promise<void> {
  mensajeError.value = '';

  const nombre = formulario.nombre.trim();
  const marca = formulario.marca.trim() || (desdeCompraActivo.value ? 'Genérica' : '');
  if (!nombre || !marca) {
    mensajeError.value = 'Completá nombre y marca.';
    return;
  }
  if (!formulario.categoriaId) {
    mensajeError.value = 'Elegí una categoría (tipo de producto).';
    return;
  }
  const precio =
    typeof formulario.precioVenta === 'number'
      ? formulario.precioVenta
      : Number(String(formulario.precioVenta).replace(',', '.'));
  if (!Number.isFinite(precio) || precio < 0) {
    mensajeError.value = 'Indicá un precio de venta válido (mayor o igual a 0).';
    return;
  }

  const filasTalle = validarTallesBorrador();
  if (!filasTalle) return;

  const datosProducto = {
    nombre,
    marca,
    descripcion: formulario.descripcion.trim(),
    categoriaId: formulario.categoriaId,
    precioVenta: precio,
  };

  guardando.value = true;
  try {
    let producto: Producto;
    let variantesGuardadas: Variante[] = [];
    const modo: 'crear' | 'editar' = idEdicion.value ? 'editar' : 'crear';

    if (idEdicion.value) {
      await catalogo.actualizarProducto(idEdicion.value, datosProducto);
      const variantesPersistidas = await persistirVariantes(idEdicion.value, filasTalle);
      if (!variantesPersistidas) return;
      variantesGuardadas = variantesPersistidas;
      const actualizado = catalogo.productoPorId(idEdicion.value);
      if (!actualizado) return;
      producto = actualizado;
    } else {
      producto = await catalogo.agregarProducto(datosProducto);
      const variantesPersistidas = await persistirVariantes(producto.id, filasTalle);
      if (!variantesPersistidas) {
        await catalogo.eliminarProducto(producto.id);
        stockStore.quitarVariantes(
          catalogo.todasVariantesDeProducto(producto.id).map((v) => v.id),
        );
        return;
      }
      variantesGuardadas = variantesPersistidas;
    }

    const precioCompra =
      desdeCompraActivo.value ? parsearPrecioEntero(formulario.precioCompra) : null;
    emit('guardado', {
      producto,
      variantes: variantesGuardadas,
      modo,
      ...(precioCompra !== null ? { precioCompra } : {}),
    });
    cerrarModal();
    resetFormulario();
    void stockStore.cargar({ forzar: true });
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo guardar el producto.');
  } finally {
    guardando.value = false;
  }
}

function aplicarPrecioVentaSugeridoDesdeCosto(costo: number | null): void {
  const sugerido = calcularPrecioVentaSugerido(
    costo,
    parametrosSistema.value.porcentajeGananciaSugerida,
  );
  if (sugerido !== null) {
    formulario.precioVenta = sugerido;
  }
}

function abrirNuevo(opciones?: OpcionesAltaProducto): void {
  resetFormulario();
  desdeCompraActivo.value = opciones?.desdeCompra === true;

  if (opciones?.nombre?.trim()) {
    formulario.nombre = opciones.nombre.trim();
  }

  if (desdeCompraActivo.value) {
    formulario.marca = 'Genérica';
    tallesBorrador.value = crearTallesBorradorAltaRapidaCompra(catalogoTallesHabilitadosParaAlta());

    const costoInicial = opciones?.costoCompraReferencia;
    if (
      costoInicial !== undefined &&
      Number.isFinite(costoInicial) &&
      costoInicial > 0
    ) {
      formulario.precioCompra = String(Math.round(costoInicial));
      aplicarPrecioVentaSugeridoDesdeCosto(Math.round(costoInicial));
    } else {
      formulario.precioCompra = '0';
      aplicarPrecioVentaSugeridoDesdeCosto(0);
    }
  } else if (
    opciones?.costoCompraReferencia !== undefined &&
    Number.isFinite(opciones.costoCompraReferencia) &&
    opciones.costoCompraReferencia >= 0
  ) {
    costoCompraReferenciaExterno.value = Math.round(opciones.costoCompraReferencia);
    aplicarPrecioVentaSugeridoDesdeCosto(costoCompraReferenciaExterno.value);
  }

  refDialogo.value?.showModal();

  if (desdeCompraActivo.value) {
    void nextTick(() => refInputNombre.value?.focus());
  }
}

function abrirEdicion(productoId: string): void {
  const p = catalogo.productoPorId(productoId);
  if (!p) return;

  resetFormulario();
  idEdicion.value = p.id;
  formulario.nombre = p.nombre;
  formulario.marca = p.marca;
  formulario.descripcion = p.descripcion;
  formulario.categoriaId = p.categoriaId;
  formulario.precioVenta = p.precioVenta;
  const existentes = catalogo.todasVariantesDeProducto(p.id);
  tallesBorrador.value = tallesBorradorDesdeVariantes(existentes, catalogoTallesParaBorrador());
  refDialogo.value?.showModal();
}

defineExpose({ abrirNuevo, abrirEdicion, cerrarModal });

onMounted(() => {
  void Promise.all([
    catalogo.asegurarCargado(),
    configuracionSistemaStore.asegurarCargado(),
    registroCompras.asegurarCargado(),
    tallesCatalogoStore.asegurarCargado(),
  ]);
});
</script>

<template>
  <Teleport to="body">
    <dialog ref="refDialogo" class="cat-prod-modal" @close="alCerrarDialogo">
      <div class="cat-prod-modal-panel" @click.stop>
        <header class="cat-prod-modal-cap">
          <div>
            <h2 id="titulo-modal-prod" class="cat-prod-modal-titulo">{{ tituloModal() }}</h2>
            <p class="cat-prod-modal-sub">{{ textoAyudaModal() }}</p>
          </div>
          <button type="button" class="cat-prod-modal-x" aria-label="Cerrar" @click="cerrarModal">
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <form class="cat-prod-formulario" @submit.prevent="guardar">
          <div class="cat-prod-formulario-cuerpo">
            <p
              v-if="mensajeError"
              class="cat-prod-aviso cat-prod-aviso--error"
              role="alert"
            >
              {{ mensajeError }}
            </p>

            <section class="cat-prod-seccion" aria-labelledby="cat-prod-sec-datos">
              <h3 id="cat-prod-sec-datos" class="cat-prod-seccion-tit">Datos del producto</h3>
              <div class="cat-prod-rejilla">
                <div class="cat-prod-campo">
                  <label class="pg-filtro-etiq" for="modal-prod-nombre">Nombre</label>
                  <input
                    id="modal-prod-nombre"
                    ref="refInputNombre"
                    v-model="formulario.nombre"
                    type="text"
                    class="pg-filtro-inp"
                    required
                    maxlength="200"
                    placeholder="Ej. Remera negra"
                    autocomplete="off"
                  />
                </div>
                <div class="cat-prod-campo">
                  <label class="pg-filtro-etiq" for="modal-prod-marca">Marca</label>
                  <input
                    id="modal-prod-marca"
                    v-model="formulario.marca"
                    type="text"
                    class="pg-filtro-inp"
                    required
                    maxlength="120"
                    :placeholder="desdeCompraActivo ? 'Opcional: Genérica si queda vacío' : undefined"
                  />
                </div>
                <div class="cat-prod-campo">
                  <label class="pg-filtro-etiq" for="modal-prod-cat">Categoría</label>
                  <select
                    id="modal-prod-cat"
                    v-model="formulario.categoriaId"
                    class="pg-filtro-inp pg-filtro-sel"
                    required
                  >
                    <option disabled value="">Seleccionar…</option>
                    <option v-for="c in categorias" :key="c.id" :value="c.id">
                      {{ c.nombre }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="cat-prod-rejilla cat-prod-rejilla--precios">
                <div class="cat-prod-campo">
                  <label
                    v-if="desdeCompraActivo"
                    class="pg-filtro-etiq"
                    for="modal-prod-costo"
                  >
                    Precio de compra
                  </label>
                  <span v-else class="pg-filtro-etiq" id="modal-prod-costo-etiq">Precio de compra</span>
                  <input
                    v-if="desdeCompraActivo"
                    id="modal-prod-costo"
                    v-model="formulario.precioCompra"
                    type="number"
                    class="pg-filtro-inp pg-mono"
                    min="0"
                    step="1"
                    inputmode="decimal"
                    placeholder="0"
                    required
                  />
                  <output
                    v-else
                    id="modal-prod-costo"
                    class="pg-filtro-inp pg-mono cat-prod-valor-ref"
                    aria-labelledby="modal-prod-costo-etiq"
                  >
                    {{ textoPrecioCompraReferencia }}
                  </output>
                  <p class="cat-prod-campo-ayuda">
                    {{
                      desdeCompraActivo
                        ? 'Costo unitario de esta compra. Se usará en la línea al guardar el producto.'
                        : 'Último costo en compras vinculadas a sus variantes.'
                    }}
                  </p>
                </div>
                <div class="cat-prod-campo">
                  <span class="pg-filtro-etiq" id="modal-prod-ganancia-etiq">% Ganancia</span>
                  <output
                    id="modal-prod-ganancia"
                    class="pg-filtro-inp pg-mono cat-prod-valor-ref"
                    :class="clasePorcentajeGanancia"
                    aria-labelledby="modal-prod-ganancia-etiq"
                  >
                    {{ textoPorcentajeGanancia }}
                  </output>
                  <p class="cat-prod-campo-ayuda">Sobre el costo de compra vs. precio de venta.</p>
                </div>
                <div class="cat-prod-campo">
                  <label class="pg-filtro-etiq" for="modal-prod-precio">Precio de venta (referencia)</label>
                  <input
                    id="modal-prod-precio"
                    v-model="formulario.precioVenta"
                    type="number"
                    class="pg-filtro-inp pg-mono"
                    required
                    min="0"
                    step="1"
                    inputmode="decimal"
                    placeholder="0"
                  />
                  <div class="cat-prod-precio-sugerido">
                    <p class="cat-prod-campo-ayuda">
                      Sugerido ({{ parametrosSistema.porcentajeGananciaSugerida }} %):
                      <strong class="pg-mono">{{ textoPrecioVentaSugerido }}</strong>
                    </p>
                    <button
                      type="button"
                      class="pg-btn-secundario cat-prod-btn-sugerido"
                      :disabled="!puedeAplicarPrecioSugerido"
                      @click="aplicarPrecioVentaSugerido"
                    >
                      Aplicar sugerido
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="!desdeCompraActivo" class="cat-prod-campo cat-prod-campo--ancho">
                <label class="pg-filtro-etiq" for="modal-prod-desc">Descripción</label>
                <textarea
                  id="modal-prod-desc"
                  v-model="formulario.descripcion"
                  class="pg-filtro-inp cat-prod-textarea"
                  rows="2"
                  maxlength="1000"
                  placeholder="Detalle opcional para fichas e informes…"
                />
              </div>
            </section>

            <section class="cat-prod-seccion cat-prod-seccion--variantes" aria-labelledby="cat-prod-sec-var">
              <div class="cat-prod-seccion-enc cat-prod-seccion-enc--variantes">
                <div>
                  <h3 id="cat-prod-sec-var" class="cat-prod-seccion-tit">Talles</h3>
                  <p class="cat-prod-seccion-ayuda">
                    <template v-if="desdeCompraActivo">
                      Por defecto se usa talle <strong>{{ etiquetaTalleUnicoPorDefecto }}</strong>.
                      Cambialo si el artículo tiene varios talles.
                    </template>
                    <template v-else>
                      Elegí qué talles vendés. Cada uno tiene stock propio; el precio de compra es
                      unitario para todo el producto.
                    </template>
                  </p>
                </div>
              </div>

              <div class="cat-prod-talles-panel">
                <div class="cat-prod-talles-resumen">
                  <span class="pg-filtro-etiq">Talles habilitados</span>
                  <p v-if="tallesHabilitados.length === 0" class="cat-prod-talles-vacio">
                    Ningún talle seleccionado.
                  </p>
                  <div v-else class="cat-prod-talles-etiquetas" aria-label="Talles seleccionados">
                    <span
                      v-for="fila in tallesHabilitados"
                      :key="`badge-${fila.talle}`"
                      class="cat-prod-talle-badge"
                    >
                      {{ etiquetaTalleModal(fila.talle) }}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  class="pg-btn-primario cat-prod-btn-elegir-talles"
                  @click="abrirSelectorTalles"
                >
                  <Layers :size="16" aria-hidden="true" />
                  Elegir talles
                  <span v-if="tallesHabilitados.length > 0" class="cat-prod-btn-elegir-contador">
                    {{ tallesHabilitados.length }}
                  </span>
                </button>
              </div>

              <div
                v-if="!desdeCompraActivo && tallesHabilitados.length > 0"
                class="cat-prod-var-tabla cat-prod-var-tabla--cb"
                role="group"
                aria-label="Códigos de barras por talle"
              >
                <div class="cat-prod-var-tabla-cab">
                  <span class="cat-prod-seccion-tit">Códigos de barras</span>
                  <button
                    type="button"
                    class="pg-btn cat-prod-btn-gen-cb"
                    :disabled="!puedeGestionarCatalogo"
                    @click="generarCodigosBarrasFaltantes"
                  >
                    <Barcode :size="15" aria-hidden="true" />
                    Generar faltantes
                  </button>
                </div>
                <div
                  v-for="(fila, indice) in tallesHabilitados"
                  :key="`cb-${fila.talle}-${fila.id ?? 'nuevo'}`"
                  class="cat-prod-var-fila cat-prod-var-fila--solo-talle"
                >
                  <span class="cat-prod-talle-etiq">{{ etiquetaTalleModal(fila.talle) }}</span>
                  <div class="cat-prod-var-lab cat-prod-var-lab--cb">
                    <span class="pg-sr">Código de barras talle {{ indice + 1 }}</span>
                    <input
                      v-model="fila.codigoBarras"
                      type="text"
                      class="pg-filtro-inp pg-mono"
                      maxlength="48"
                      inputmode="numeric"
                      placeholder="EAN-13 opcional"
                      :disabled="!puedeGestionarCatalogo"
                    />
                  </div>
                  <div class="cat-prod-var-acciones">
                    <button
                      type="button"
                      class="cat-prod-var-accion cat-prod-var-accion--gen"
                      title="Generar código EAN-13 interno"
                      :aria-label="`Generar código de barras talle ${etiquetaTalleModal(fila.talle)}`"
                      :disabled="!puedeGestionarCatalogo"
                      @click="solicitarGenerarCodigoBarrasParaFila(fila)"
                    >
                      <Barcode :size="16" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer class="cat-prod-modal-pie">
            <button type="button" class="pg-btn pg-btn--ghost pg-btn--lg" @click="cerrarModal">
              Cancelar
            </button>
            <button type="submit" class="pg-btn-primario" :disabled="guardando">
              {{
                guardando
                  ? 'Guardando…'
                  : desdeCompraActivo
                    ? 'Guardar y usar en compra'
                    : 'Guardar producto'
              }}
            </button>
          </footer>
        </form>
      </div>
    </dialog>

    <dialog
      ref="refDialogoTalles"
      class="cat-prod-modal cat-prod-modal--talles"
      aria-labelledby="cat-prod-talles-titulo"
      @close="tallePersonalizadoNuevo = ''"
    >
      <div class="cat-prod-modal-panel cat-prod-modal-panel--talles" @click.stop>
        <header class="cat-prod-modal-cap">
          <div>
            <h2 id="cat-prod-talles-titulo" class="cat-prod-modal-titulo">Elegir talles</h2>
            <p class="cat-prod-modal-sub">
              Marcá los talles que vas a vender. Podés sumar uno personalizado si no está en la lista.
            </p>
          </div>
          <button
            type="button"
            class="cat-prod-modal-x"
            aria-label="Cerrar selector de talles"
            @click="cerrarSelectorTalles"
          >
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <div class="cat-prod-talles-selector-cuerpo">
          <section
            v-if="tallesPredefinidosLetra.length > 0"
            class="cat-prod-talles-grupo"
            aria-labelledby="cat-prod-talles-letra"
          >
            <h3 id="cat-prod-talles-letra" class="cat-prod-talles-grupo-tit">Letras</h3>
            <div class="cat-prod-talles-matriz" role="group" aria-label="Talles en letras">
              <button
                v-for="fila in tallesPredefinidosLetra"
                :key="fila.talle"
                type="button"
                class="cat-prod-talle-opcion"
                :class="{ 'cat-prod-talle-opcion--activa': fila.habilitado }"
                :aria-pressed="fila.habilitado"
                @click="alternarTalle(fila)"
              >
                {{ etiquetaTalleModal(fila.talle) }}
              </button>
            </div>
          </section>

          <section
            v-if="tallesPredefinidosNumero.length > 0"
            class="cat-prod-talles-grupo"
            aria-labelledby="cat-prod-talles-numero"
          >
            <h3 id="cat-prod-talles-numero" class="cat-prod-talles-grupo-tit">Números</h3>
            <div class="cat-prod-talles-matriz cat-prod-talles-matriz--num" role="group" aria-label="Talles numéricos">
              <button
                v-for="fila in tallesPredefinidosNumero"
                :key="fila.talle"
                type="button"
                class="cat-prod-talle-opcion"
                :class="{ 'cat-prod-talle-opcion--activa': fila.habilitado }"
                :aria-pressed="fila.habilitado"
                @click="alternarTalle(fila)"
              >
                {{ etiquetaTalleModal(fila.talle) }}
              </button>
            </div>
          </section>

          <section class="cat-prod-talles-grupo" aria-labelledby="cat-prod-talles-personalizado">
            <h3 id="cat-prod-talles-personalizado" class="cat-prod-talles-grupo-tit">
              Talle personalizado
            </h3>
            <div class="cat-prod-talle-personalizado-fila">
              <input
                id="modal-prod-talle-nuevo"
                v-model="tallePersonalizadoNuevo"
                type="text"
                class="pg-filtro-inp"
                maxlength="24"
                placeholder="Ej. 2XL"
                @keydown.enter.prevent="agregarTallePersonalizado"
              />
              <button type="button" class="pg-btn" @click="agregarTallePersonalizado">
                Agregar
              </button>
            </div>
            <div
              v-if="tallesPersonalizados.length > 0"
              class="cat-prod-talles-matriz cat-prod-talles-matriz--personalizado"
            >
              <div
                v-for="fila in tallesPersonalizados"
                :key="`p-${fila.talle}`"
                class="cat-prod-talle-personalizado-item"
              >
                <button
                  type="button"
                  class="cat-prod-talle-opcion cat-prod-talle-opcion--personalizado"
                  :class="{ 'cat-prod-talle-opcion--activa': fila.habilitado }"
                  :aria-pressed="fila.habilitado"
                  @click="alternarTalle(fila)"
                >
                  {{ etiquetaTalleModal(fila.talle) }}
                </button>
                <button
                  type="button"
                  class="cat-prod-talle-quitar"
                  title="Quitar talle personalizado"
                  @click="quitarTallePersonalizado(fila)"
                >
                  <Trash2 :size="14" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer class="cat-prod-modal-pie">
          <p class="cat-prod-talles-selector-resumen">
            <template v-if="tallesHabilitados.length === 0">Sin talles seleccionados</template>
            <template v-else>
              {{ tallesHabilitados.length }}
              {{ tallesHabilitados.length === 1 ? 'talle seleccionado' : 'talles seleccionados' }}
            </template>
          </p>
          <button type="button" class="pg-btn-primario" @click="cerrarSelectorTalles">
            Listo
          </button>
        </footer>
      </div>
    </dialog>

    <dialog
      ref="refDialogoReemplazarCb"
      class="cat-prod-modal cat-prod-modal--confirm"
      aria-labelledby="cat-prod-confirm-cb-titulo"
      @close="filaPendienteGenerarCb = null"
    >
      <div class="cat-prod-confirm-panel">
        <h2 id="cat-prod-confirm-cb-titulo" class="cat-prod-confirm-titulo">
          Va a reemplazar el código de barras
        </h2>
        <p class="cat-prod-confirm-texto">¿Desea seguir?</p>
        <footer class="cat-prod-confirm-pie">
          <button type="button" class="pg-btn pg-btn--ghost" @click="cerrarDialogoReemplazarCb">
            Cancelar
          </button>
          <button type="button" class="pg-btn-primario" @click="confirmarReemplazoCodigoBarras">
            Sí, reemplazar
          </button>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.cat-prod-aviso {
  margin: 0.75rem 0 0;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.cat-prod-aviso--error {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
  border: 1px solid var(--color-peligro-borde);
}

.cat-prod-modal {
  margin: auto;
  padding: 0;
  max-width: calc(100vw - 1.25rem);
  width: min(44rem, 100%);
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow: var(--sombra-suave);
}

.cat-prod-modal::backdrop {
  background: var(--color-scrim);
}

.cat-prod-modal-panel {
  display: flex;
  flex-direction: column;
  max-height: min(92dvh, 44rem);
  min-height: 0;
}

.cat-prod-modal-cap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.15rem clamp(1rem, 3vw, 1.35rem) 0.85rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cat-prod-modal-titulo {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.cat-prod-modal-sub {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
  max-width: 32rem;
}

.cat-prod-modal-x {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  cursor: pointer;
}

.cat-prod-modal-x:hover {
  color: var(--color-texto);
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.cat-prod-formulario {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.cat-prod-formulario-cuerpo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 clamp(1rem, 3vw, 1.35rem) 0.75rem;
}

.cat-prod-seccion {
  padding-top: 1rem;
}

.cat-prod-seccion-tit {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-texto-apagado);
}

.cat-prod-seccion-enc {
  margin-bottom: 0.65rem;
}

.cat-prod-seccion-enc--variantes {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.cat-prod-btn-gen-cb {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  font-size: 0.8rem;
}

.cat-prod-seccion-ayuda {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.cat-prod-rejilla {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 560px) {
  .cat-prod-rejilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.cat-prod-rejilla--precios {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
}

@media (min-width: 720px) {
  .cat-prod-rejilla--precios {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.cat-prod-campo {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
}

.cat-prod-campo--ancho {
  margin-top: 0.75rem;
}

.cat-prod-campo-ayuda {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-texto-apagado);
}

.cat-prod-precio-sugerido {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem 0.65rem;
  margin-top: 0.35rem;
}

.cat-prod-btn-sugerido {
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
}

.cat-prod-valor-ref {
  display: flex;
  align-items: center;
  min-height: 2.35rem;
  margin: 0;
  font-weight: 600;
  color: var(--color-texto-suave);
  background: var(--color-scrim);
  border-style: dashed;
  cursor: default;
}

.cat-prod-valor-ref--neutro {
  color: var(--color-texto-apagado);
}

.cat-prod-valor-ref--bajo {
  color: var(--color-peligro);
  border-color: var(--color-peligro-borde);
  background: var(--color-peligro-suave);
}

.cat-prod-valor-ref--medio {
  color: var(--color-advertencia);
  border-color: var(--color-advertencia-borde);
  background: var(--color-advertencia-suave);
}

.cat-prod-valor-ref--alto {
  color: var(--color-exito);
  border-color: var(--color-exito-borde);
  background: var(--color-exito-suave);
}

.cat-prod-textarea {
  resize: vertical;
  min-height: 4.5rem;
}

.cat-prod-seccion--variantes {
  margin-top: 0.35rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--color-borde);
}

.cat-prod-var-tabla {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cat-prod-var-cab {
  display: none;
}

@media (min-width: 640px) {
  .cat-prod-var-cab {
    display: grid;
    grid-template-columns: 0.85fr 0.85fr 1.3fr 5rem;
    gap: 0.45rem;
    padding: 0 0.15rem 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-texto-apagado);
  }
}

.cat-prod-var-fila {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
  align-items: end;
  padding-bottom: 0.45rem;
  border-bottom: 1px dashed var(--color-borde);
}

.cat-prod-var-fila:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

@media (min-width: 640px) {
  .cat-prod-var-fila {
    grid-template-columns: 0.85fr 0.85fr 1.3fr 5rem;
    padding-bottom: 0;
    border-bottom: none;
  }
}

.cat-prod-var-lab--cb {
  grid-column: 1 / -1;
}

@media (min-width: 640px) {
  .cat-prod-var-lab--cb {
    grid-column: auto;
  }
}

.cat-prod-var-acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  align-self: end;
}

@media (max-width: 639px) {
  .cat-prod-var-acciones {
    grid-column: 2;
  }
}

.cat-prod-var-accion {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.38rem;
  border-radius: 10px;
  border: 1px solid;
  background: transparent;
  cursor: pointer;
}

.cat-prod-var-accion:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cat-prod-var-accion--gen {
  border-color: var(--color-acento-borde);
  color: var(--color-acento);
}

.cat-prod-var-accion--gen:hover:not(:disabled) {
  background: var(--color-acento-suave);
}

.cat-prod-var-accion--quitar {
  border-color: var(--color-peligro-borde);
  color: var(--color-peligro);
}

.cat-prod-var-accion--quitar:hover:not(:disabled) {
  background: var(--color-peligro-suave);
}

.cat-prod-var-lab {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  min-width: 0;
}

.cat-prod-modal--confirm {
  max-width: 22rem;
}

.cat-prod-confirm-panel {
  padding: 1.25rem clamp(1rem, 3vw, 1.35rem);
}

.cat-prod-confirm-titulo {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
}

.cat-prod-confirm-texto {
  margin: 0.65rem 0 0;
  font-size: 0.92rem;
  color: var(--color-texto-apagado);
}

.cat-prod-confirm-pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.15rem;
}

.cat-prod-btn-add-var {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.65rem;
  margin-bottom: 0.25rem;
}

.cat-prod-talles-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cat-prod-talles-resumen {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cat-prod-talles-vacio {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-texto-apagado);
}

.cat-prod-talles-etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.cat-prod-talle-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-acento-hover);
  font-variant-numeric: tabular-nums;
}

.cat-prod-btn-elegir-talles {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.5rem 0.85rem;
  font-size: 0.84rem;
}

.cat-prod-btn-elegir-contador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}

.cat-prod-var-tabla-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.cat-prod-modal--talles {
  width: min(26rem, 100%);
}

.cat-prod-modal-panel--talles {
  max-height: min(88dvh, 36rem);
}

.cat-prod-talles-selector-cuerpo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.85rem clamp(1rem, 3vw, 1.35rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cat-prod-talles-grupo-tit {
  margin: 0 0 0.45rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.cat-prod-talles-matriz {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.4rem;
}

.cat-prod-talles-matriz--num {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.cat-prod-talles-matriz--personalizado {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.55rem;
}

.cat-prod-talle-opcion {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.35rem;
  padding: 0.35rem 0.25rem;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  color: var(--color-texto-suave);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.cat-prod-talle-opcion:hover {
  border-color: var(--color-acento-borde);
  color: var(--color-texto);
}

.cat-prod-talle-opcion--activa {
  border-color: var(--color-acento);
  background: var(--color-acento);
  color: var(--color-texto-sobre-acento);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
}

.cat-prod-talle-opcion--personalizado {
  flex: 1;
  min-width: 0;
}

.cat-prod-talle-personalizado-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.cat-prod-talle-personalizado-fila {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.cat-prod-talle-personalizado-fila .pg-filtro-inp {
  flex: 1;
  min-width: 8rem;
}

.cat-prod-talle-quitar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  border: 1px solid var(--color-peligro-borde);
  border-radius: 8px;
  background: transparent;
  color: var(--color-peligro);
  cursor: pointer;
}

.cat-prod-talle-quitar:hover {
  background: var(--color-peligro-suave);
}

.cat-prod-talles-selector-resumen {
  margin: 0;
  flex: 1;
  font-size: 0.82rem;
  color: var(--color-texto-apagado);
}

.cat-prod-modal-pie:has(.cat-prod-talles-selector-resumen) {
  align-items: center;
}

@media (max-width: 420px) {
  .cat-prod-talles-matriz {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .cat-prod-talles-matriz--num {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .cat-prod-btn-elegir-talles {
    width: 100%;
    justify-content: center;
  }
}

.cat-prod-var-tabla--cb {
  margin-top: 0.85rem;
}

.cat-prod-var-fila--solo-talle {
  grid-template-columns: 4.5rem 1fr 3rem;
  align-items: center;
}

.cat-prod-talle-etiq {
  font-weight: 700;
  font-size: 0.86rem;
  color: var(--color-texto-suave);
}

@media (min-width: 640px) {
  .cat-prod-var-fila--solo-talle {
    grid-template-columns: 4.5rem 1.3fr 3rem;
  }

  .cat-prod-var-tabla--cb .cat-prod-var-cab {
    display: grid;
    grid-template-columns: 4.5rem 1.3fr 3rem;
  }
}

.cat-prod-modal-pie {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.85rem clamp(1rem, 3vw, 1.35rem) 1.15rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}
</style>
