<script setup lang="ts">
import { Layers, Package, Plus, RefreshCw, Trash2, X } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import {
  calcularPorcentajeGanancia,
  calcularPrecioVentaSugerido,
  obtenerUltimoCostoCompraProducto,
} from '../../modulos/catalogo/costosProducto';
import { etiquetaTalleColor } from '../../modulos/catalogo/catalogoPresentacion';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useCatalogoStore } from '../../stores/catalogo';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useRegistroComprasStore } from '../../stores/registroCompras';
import { useStockStore } from '../../stores/stock';
import type { Producto, Variante } from '../../tipos/catalogo';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('productos-catalogo');

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const formatoPorcentaje = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const catalogo = useCatalogoStore();
const configuracionSistemaStore = useConfiguracionSistemaStore();
const stockStore = useStockStore();
const registroCompras = useRegistroComprasStore();
const { tienePermiso } = usePermisosOperador();
const puedeGestionarCatalogo = computed(() => tienePermiso('puedeGestionarCatalogoProductos'));
const { categorias, productos, variantes } = storeToRefs(catalogo);
const { compras } = storeToRefs(registroCompras);
const { parametros: parametrosSistema } = storeToRefs(configuracionSistemaStore);

const refDialogo = useTemplateRef('refDialogo');

interface BorradorVariante {
  claveLocal: string;
  id?: string;
  talle: string;
  color: string;
  codigoBarras: string;
}

const formulario = reactive({
  nombre: '',
  marca: '',
  descripcion: '',
  categoriaId: '',
  precioVenta: '' as string | number,
});

const variantesBorrador = ref<BorradorVariante[]>([]);
const idEdicion = ref<string | null>(null);
const busqueda = ref('');
const categoriaFiltro = ref('');
const mensajeToast = ref('');
const tipoMensajeToast = ref<'error' | 'ok'>('ok');
let idToast: ReturnType<typeof setTimeout> | null = null;

const productosOrdenados = computed(() => {
  return [...productos.value].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
  );
});

const totalVariantesActivas = computed(() =>
  variantes.value.filter((v) => v.activa).length,
);

const productosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase();
  const idCat = categoriaFiltro.value.trim();
  return productosOrdenados.value.filter((p) => {
    if (idCat && p.categoriaId !== idCat) return false;
    if (!texto) return true;
    const categoria = catalogo.nombreCategoria(p.categoriaId).toLowerCase();
    const agregado = `${p.nombre} ${p.marca} ${p.descripcion} ${categoria}`.toLowerCase();
    return agregado.includes(texto);
  });
});

const hayFiltrosActivos = computed(
  () => Boolean(busqueda.value.trim() || categoriaFiltro.value.trim()),
);

const idsVariantesProductoEnModal = computed(() => {
  if (!idEdicion.value) return [] as string[];
  return catalogo.todasVariantesDeProducto(idEdicion.value).map((v) => v.id);
});

const precioCompraReferencia = computed(() =>
  obtenerUltimoCostoCompraProducto(idsVariantesProductoEnModal.value, compras.value),
);

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
  return formatoPeso.format(costo);
});

const textoPorcentajeGanancia = computed(() => {
  const pct = porcentajeGananciaReferencia.value;
  if (pct === null) return '—';
  const prefijo = pct > 0 ? '+' : '';
  return `${prefijo}${formatoPorcentaje.format(pct)} %`;
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
  return formatoPeso.format(sugerido);
});

const puedeAplicarPrecioSugerido = computed(
  () => precioVentaSugerido.value !== null && puedeGestionarCatalogo.value,
);

function aplicarPrecioVentaSugerido(): void {
  const sugerido = precioVentaSugerido.value;
  if (sugerido === null) return;
  formulario.precioVenta = sugerido;
}

function limpiarFiltros(): void {
  busqueda.value = '';
  categoriaFiltro.value = '';
}

function resumenDescripcion(texto: string): string {
  const t = texto.trim();
  if (!t) return '—';
  return t.length > 56 ? `${t.slice(0, 53)}…` : t;
}

function mostrarToast(texto: string, tipo: 'error' | 'ok') {
  mensajeToast.value = texto;
  tipoMensajeToast.value = tipo;
  if (idToast) clearTimeout(idToast);
  idToast = setTimeout(() => {
    mensajeToast.value = '';
  }, 4000);
}

function nuevaClaveLocal(): string {
  return crypto.randomUUID();
}

function filaVarianteVacia(): BorradorVariante {
  return { claveLocal: nuevaClaveLocal(), talle: '', color: '', codigoBarras: '' };
}

function resetFormulario() {
  formulario.nombre = '';
  formulario.marca = '';
  formulario.descripcion = '';
  formulario.categoriaId = categorias.value[0]?.id ?? '';
  formulario.precioVenta = '';
  variantesBorrador.value = [filaVarianteVacia()];
  idEdicion.value = null;
}

function tituloModal() {
  return idEdicion.value ? 'Modificar producto' : 'Nuevo producto';
}

function abrirNuevo() {
  resetFormulario();
  refDialogo.value?.showModal();
}

function abrirModificar(p: Producto) {
  idEdicion.value = p.id;
  formulario.nombre = p.nombre;
  formulario.marca = p.marca;
  formulario.descripcion = p.descripcion;
  formulario.categoriaId = p.categoriaId;
  formulario.precioVenta = p.precioVenta;
  const existentes = catalogo.todasVariantesDeProducto(p.id);
  variantesBorrador.value =
    existentes.length > 0
      ? existentes.map((v) => ({
          claveLocal: nuevaClaveLocal(),
          id: v.id,
          talle: v.talle,
          color: v.color,
          codigoBarras: v.codigoBarras,
        }))
      : [filaVarianteVacia()];
  refDialogo.value?.showModal();
}

function agregarFilaVariante() {
  variantesBorrador.value = [...variantesBorrador.value, filaVarianteVacia()];
}

function quitarFilaVariante(claveLocal: string) {
  if (variantesBorrador.value.length <= 1) {
    mostrarToast('El producto debe tener al menos una variante (talle y color).', 'error');
    return;
  }
  variantesBorrador.value = variantesBorrador.value.filter((f) => f.claveLocal !== claveLocal);
}

function cerrarModal() {
  refDialogo.value?.close();
}

function alCerrarDialogo() {
  resetFormulario();
}

function cantidadVariantesProducto(productoId: string): number {
  return catalogo.cantidadVariantesActivas(productoId);
}

function validarVariantesBorrador(): BorradorVariante[] | null {
  const validas: BorradorVariante[] = [];
  const claves = new Set<string>();
  for (const fila of variantesBorrador.value) {
    const talle = fila.talle.trim();
    const color = fila.color.trim();
    if (!talle || !color) {
      mostrarToast('Cada variante necesita talle y color.', 'error');
      return null;
    }
    const clave = `${talle.toLowerCase()}|${color.toLowerCase()}`;
    if (claves.has(clave)) {
      mostrarToast('No puede haber dos variantes con el mismo talle y color.', 'error');
      return null;
    }
    claves.add(clave);
    validas.push({ ...fila, talle, color, codigoBarras: fila.codigoBarras.trim() });
  }
  if (validas.length === 0) {
    mostrarToast('Agregá al menos una variante.', 'error');
    return null;
  }
  return validas;
}

async function persistirVariantes(productoId: string, filas: BorradorVariante[]): Promise<boolean> {
  const idsEnFormulario = new Set(filas.filter((f) => f.id).map((f) => f.id as string));
  const actuales = catalogo.todasVariantesDeProducto(productoId);

  try {
    for (const existente of actuales) {
      if (!idsEnFormulario.has(existente.id)) {
        const ok = await catalogo.eliminarVariante(existente.id);
        if (!ok) {
          mostrarToast('No se puede quitar la única variante activa del producto.', 'error');
          return false;
        }
        stockStore.quitarVariante(existente.id);
      }
    }

    for (const fila of filas) {
      const datos: Omit<Variante, 'id'> = {
        productoId,
        talle: fila.talle,
        color: fila.color,
        codigoBarras: fila.codigoBarras,
        activa: true,
      };
      if (fila.id) {
        const ok = await catalogo.actualizarVariante(fila.id, datos);
        if (!ok) {
          mostrarToast('Ya existe otra variante con ese talle y color.', 'error');
          return false;
        }
      } else {
        const creada = await catalogo.agregarVariante(datos);
        if (!creada) {
          mostrarToast('Ya existe una variante con ese talle y color.', 'error');
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudieron guardar las variantes.'), 'error');
    return false;
  }
}

async function guardar() {
  const nombre = formulario.nombre.trim();
  const marca = formulario.marca.trim();
  if (!nombre || !marca) {
    mostrarToast('Completá nombre y marca.', 'error');
    return;
  }
  if (!formulario.categoriaId) {
    mostrarToast('Elegí una categoría (tipo de producto).', 'error');
    return;
  }
  const precio =
    typeof formulario.precioVenta === 'number'
      ? formulario.precioVenta
      : Number(String(formulario.precioVenta).replace(',', '.'));
  if (!Number.isFinite(precio) || precio < 0) {
    mostrarToast('Indicá un precio de venta válido (mayor o igual a 0).', 'error');
    return;
  }

  const filasVariante = validarVariantesBorrador();
  if (!filasVariante) return;

  const datosProducto = {
    nombre,
    marca,
    descripcion: formulario.descripcion.trim(),
    categoriaId: formulario.categoriaId,
    precioVenta: precio,
  };

  try {
    if (idEdicion.value) {
      await catalogo.actualizarProducto(idEdicion.value, datosProducto);
      if (!(await persistirVariantes(idEdicion.value, filasVariante))) return;
      mostrarToast('Producto y variantes actualizados.', 'ok');
    } else {
      const nuevoProducto = await catalogo.agregarProducto(datosProducto);
      if (!(await persistirVariantes(nuevoProducto.id, filasVariante))) {
        await catalogo.eliminarProducto(nuevoProducto.id);
        stockStore.quitarVariantes(
          catalogo.todasVariantesDeProducto(nuevoProducto.id).map((v) => v.id),
        );
        return;
      }
      mostrarToast('Producto creado con sus variantes.', 'ok');
    }
    await stockStore.cargar();
    cerrarModal();
    resetFormulario();
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudo guardar el producto.'), 'error');
  }
}

async function borrar(p: Producto) {
  if (!globalThis.confirm(`¿Borrar el producto «${p.nombre}» y todas sus variantes?`)) return;
  try {
    const idsVariantes = await catalogo.eliminarProducto(p.id);
    stockStore.quitarVariantes(idsVariantes);
    await stockStore.cargar();
    mostrarToast('Producto borrado.', 'ok');
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudo borrar el producto.'), 'error');
  }
}

onMounted(() => {
  resetFormulario();
});
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-prod">
    <div class="pg-marco pg-marco--catalogo">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Package :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Productos · Catálogo</p>
              <h1 id="titulo-prod" class="pg-titulo">Catálogo de productos</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
        <div class="pg-kpis" aria-label="Resumen del catálogo">
          <div class="pg-kpi pg-kpi--acento">
            <span class="pg-kpi-etiq">Productos</span>
            <span class="pg-kpi-valor pg-mono">{{ productos.length }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Variantes activas</span>
            <span class="pg-kpi-valor pg-mono">{{ totalVariantesActivas }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Categorías</span>
            <span class="pg-kpi-valor pg-mono">{{ categorias.length }}</span>
          </div>
        </div>
      </header>

      <p v-if="!puedeGestionarCatalogo" class="cat-prod-banner-lectura" role="status">
        Tenés acceso de lectura al catálogo. Para crear o modificar productos necesitás el permiso
        correspondiente.
      </p>

      <div class="pg-barra">
        <div class="pg-barra-fila">
          <div class="pg-barra-col pg-barra-col--busq">
            <label class="pg-filtro-etiq" for="cat-prod-busq">Buscar</label>
            <input
              id="cat-prod-busq"
              v-model="busqueda"
              type="search"
              class="pg-filtro-inp"
              placeholder="Nombre, marca, categoría…"
              autocomplete="off"
            />
          </div>
          <div class="pg-barra-col pg-barra-col--cat">
            <label class="pg-filtro-etiq" for="cat-prod-filtro-cat">Categoría</label>
            <select
              id="cat-prod-filtro-cat"
              v-model="categoriaFiltro"
              class="pg-filtro-inp pg-filtro-sel"
            >
              <option value="">Todas</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="pg-barra-col pg-barra-col--reinicio">
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
          <div class="pg-barra-col pg-barra-col--accion">
            <span class="pg-filtro-etiq pg-sr">Acción</span>
            <button
              v-if="puedeGestionarCatalogo"
              type="button"
              class="pg-btn-primario cat-prod-btn-nuevo"
              @click="abrirNuevo"
            >
              <Plus :size="18" stroke-width="2" aria-hidden="true" />
              Nuevo producto
            </button>
          </div>
        </div>
        <p
          v-if="mensajeToast"
          class="cat-prod-aviso"
          :class="`cat-prod-aviso--${tipoMensajeToast}`"
          role="status"
        >
          {{ mensajeToast }}
        </p>
      </div>

      <p class="pg-resumen pg-resumen--flex" role="status">
        <span>
          Mostrando <strong>{{ productosFiltrados.length }}</strong>
          {{
            productosFiltrados.length === 1 ? 'producto' : 'productos'
          }}
          <template v-if="hayFiltrosActivos"> (filtros activos)</template>
        </span>
        <span v-if="productos.length > 0">
          Total en catálogo: <strong>{{ productos.length }}</strong>
        </span>
      </p>

      <section class="pg-tabla-cuerpo" role="region" aria-label="Listado de productos">
        <div class="pg-tabla-cab">
          <h2 class="pg-tabla-h2">Productos registrados</h2>
          <span class="pg-tabla-meta pg-mono">{{ productosFiltrados.length }} filas</span>
        </div>
        <div class="pg-tabla-scroll cat-tabla-scroll">
          <table class="pg-tabla pg-tabla--estado">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col">Descripción</th>
                <th scope="col" class="pg-der">Variantes</th>
                <th scope="col" class="pg-der">Precio ref.</th>
                <th v-if="puedeGestionarCatalogo" scope="col" class="pg-acc">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in productosFiltrados" :key="p.id">
                <td>
                  <div class="cat-prod-cel-nombre">
                    <span class="cat-prod-nombre">{{ p.nombre }}</span>
                    <span class="cat-prod-marca">{{ p.marca }}</span>
                  </div>
                </td>
                <td>
                  <span class="cat-prod-chip">
                    <Layers :size="12" aria-hidden="true" />
                    {{ catalogo.nombreCategoria(p.categoriaId) }}
                  </span>
                </td>
                <td class="cat-prod-cel-desc" :title="p.descripcion.trim() || undefined">
                  {{ resumenDescripcion(p.descripcion) }}
                </td>
                <td class="pg-der pg-mono">{{ cantidadVariantesProducto(p.id) }}</td>
                <td class="pg-der pg-mono">{{ formatoPeso.format(p.precioVenta) }}</td>
                <td v-if="puedeGestionarCatalogo" class="pg-acc">
                  <div class="cat-prod-acciones">
                    <button type="button" class="pg-btn" @click="abrirModificar(p)">
                      Editar
                    </button>
                    <button type="button" class="pg-btn cat-prod-btn-peligro" @click="borrar(p)">
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="productosFiltrados.length === 0">
                <td colspan="6" class="pg-vacio">
                  <template v-if="productos.length === 0">
                    No hay productos cargados. Usá <strong>Nuevo producto</strong> para agregar el
                    primero.
                  </template>
                  <template v-else>
                    Ningún producto coincide con los filtros.
                    <button type="button" class="cat-prod-link-vacio" @click="limpiarFiltros">
                      Limpiar filtros
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <dialog ref="refDialogo" class="cat-prod-modal" @close="alCerrarDialogo">
      <div class="cat-prod-modal-panel" @click.stop>
        <header class="cat-prod-modal-cap">
          <div>
            <h2 id="titulo-modal-prod" class="cat-prod-modal-titulo">{{ tituloModal() }}</h2>
            <p class="cat-prod-modal-sub">
              Completá los datos del artículo y sus variantes vendibles (talle y color).
            </p>
          </div>
          <button type="button" class="cat-prod-modal-x" aria-label="Cerrar" @click="cerrarModal">
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <form class="cat-prod-formulario" @submit.prevent="guardar">
          <div class="cat-prod-formulario-cuerpo">
          <section class="cat-prod-seccion" aria-labelledby="cat-prod-sec-datos">
            <h3 id="cat-prod-sec-datos" class="cat-prod-seccion-tit">Datos del producto</h3>
            <div class="cat-prod-rejilla">
              <div class="cat-prod-campo">
                <label class="pg-filtro-etiq" for="modal-prod-nombre">Nombre</label>
                <input
                  id="modal-prod-nombre"
                  v-model="formulario.nombre"
                  type="text"
                  class="pg-filtro-inp"
                  required
                  maxlength="200"
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
                <span class="pg-filtro-etiq" id="modal-prod-costo-etiq">Precio de compra</span>
                <output
                  id="modal-prod-costo"
                  class="pg-filtro-inp pg-mono cat-prod-valor-ref"
                  aria-labelledby="modal-prod-costo-etiq"
                >
                  {{ textoPrecioCompraReferencia }}
                </output>
                <p class="cat-prod-campo-ayuda">Último costo en compras vinculadas a sus variantes.</p>
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
            <div class="cat-prod-campo cat-prod-campo--ancho">
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
            <div class="cat-prod-seccion-enc">
              <h3 id="cat-prod-sec-var" class="cat-prod-seccion-tit">Variantes (talle · color)</h3>
              <p class="cat-prod-seccion-ayuda">
                Cada fila es una combinación con stock propio. Un producto con un solo talle y color
                tiene una variante.
              </p>
            </div>

            <div class="cat-prod-var-tabla" role="group" aria-label="Variantes del producto">
              <div class="cat-prod-var-cab" aria-hidden="true">
                <span>Talle</span>
                <span>Color</span>
                <span>Código de barras</span>
                <span class="cat-prod-var-cab-acc" />
              </div>
              <div
                v-for="(fila, indice) in variantesBorrador"
                :key="fila.claveLocal"
                class="cat-prod-var-fila"
              >
                <label class="cat-prod-var-lab">
                  <span class="pg-sr">Talle fila {{ indice + 1 }}</span>
                  <input
                    v-model="fila.talle"
                    type="text"
                    class="pg-filtro-inp"
                    maxlength="24"
                    required
                    placeholder="Ej. M"
                  />
                </label>
                <label class="cat-prod-var-lab">
                  <span class="pg-sr">Color fila {{ indice + 1 }}</span>
                  <input
                    v-model="fila.color"
                    type="text"
                    class="pg-filtro-inp"
                    maxlength="48"
                    required
                    placeholder="Ej. Negro"
                  />
                </label>
                <label class="cat-prod-var-lab">
                  <span class="pg-sr">Código de barras fila {{ indice + 1 }}</span>
                  <input
                    v-model="fila.codigoBarras"
                    type="text"
                    class="pg-filtro-inp pg-mono"
                    maxlength="48"
                    inputmode="numeric"
                    placeholder="Opcional"
                  />
                </label>
                <button
                  type="button"
                  class="cat-prod-var-quitar"
                  :aria-label="`Quitar variante ${etiquetaTalleColor(fila.talle, fila.color)}`"
                  @click="quitarFilaVariante(fila.claveLocal)"
                >
                  <Trash2 :size="16" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="pg-btn cat-prod-btn-add-var"
              @click="agregarFilaVariante"
            >
              <Plus :size="16" aria-hidden="true" />
              Agregar variante
            </button>
          </section>
          </div>

          <footer class="cat-prod-modal-pie">
            <button type="button" class="pg-btn pg-btn--ghost pg-btn--lg" @click="cerrarModal">
              Cancelar
            </button>
            <button type="submit" class="pg-btn-primario">Guardar producto</button>
          </footer>
        </form>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.cat-tabla-scroll {
  --pg-cap-de-filas: 8;
  --pg-altura-cap-fila: 3.15rem;
}

.cat-prod-banner-lectura,
.cat-gest-banner-lectura {
  margin: 0 0 1rem;
  padding: 0.65rem 0.82rem;
  border-radius: 10px;
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.06);
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}
.pg-marco--catalogo {
  --pg-reserva-vertical-vista: clamp(14rem, 28dvh, 21rem);
}

.cat-prod-btn-nuevo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  justify-content: center;
}

@media (min-width: 720px) {
  .cat-prod-btn-nuevo {
    width: auto;
  }
}

.cat-prod-aviso {
  flex: 1 1 100%;
  margin: 0;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.cat-prod-aviso--ok {
  color: var(--color-exito);
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.28);
}

.cat-prod-aviso--error {
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.32);
}

.cat-prod-cel-nombre {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 8rem;
}

.cat-prod-nombre {
  font-weight: 600;
  color: var(--color-texto);
  line-height: 1.25;
}

.cat-prod-marca {
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.cat-prod-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  background: rgba(124, 140, 240, 0.1);
  border: 1px solid rgba(124, 140, 240, 0.22);
  white-space: nowrap;
}

.cat-prod-cel-desc {
  max-width: 14rem;
  color: var(--color-texto-suave);
  font-size: 0.84rem;
}

.cat-prod-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.cat-prod-btn-peligro {
  border-color: rgba(251, 113, 133, 0.45);
  color: var(--color-peligro);
}

.cat-prod-btn-peligro:hover {
  background: rgba(251, 113, 133, 0.1);
  border-color: rgba(251, 113, 133, 0.55);
}

.cat-prod-link-vacio {
  display: inline;
  margin-left: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-acento-hover);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
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
  box-shadow:
    0 4px 28px rgba(0, 0, 0, 0.32),
    0 0 1px rgba(124, 140, 240, 0.15);
}

.cat-prod-modal::backdrop {
  background: rgba(0, 0, 0, 0.55);
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
  background: linear-gradient(
    165deg,
    rgba(7, 11, 20, 0.35) 0%,
    rgba(21, 29, 46, 0.15) 100%
  );
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
  border: 1px solid rgba(124, 140, 240, 0.18);
  background: rgba(124, 140, 240, 0.04);
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
  background: rgba(7, 11, 20, 0.35);
  border-style: dashed;
  cursor: default;
}

.cat-prod-valor-ref--neutro {
  color: var(--color-texto-apagado);
}

.cat-prod-valor-ref--bajo {
  color: var(--color-peligro);
  border-color: rgba(251, 113, 133, 0.35);
  background: rgba(251, 113, 133, 0.06);
}

.cat-prod-valor-ref--medio {
  color: #fbbf24;
  border-color: rgba(234, 179, 8, 0.35);
  background: rgba(234, 179, 8, 0.06);
}

.cat-prod-valor-ref--alto {
  color: var(--color-exito);
  border-color: rgba(74, 222, 128, 0.35);
  background: rgba(74, 222, 128, 0.06);
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
    grid-template-columns: 0.85fr 0.85fr 1.3fr 2.25rem;
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
  border-bottom: 1px dashed rgba(42, 58, 84, 0.45);
}

.cat-prod-var-fila:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

@media (min-width: 640px) {
  .cat-prod-var-fila {
    grid-template-columns: 0.85fr 0.85fr 1.3fr 2.25rem;
    padding-bottom: 0;
    border-bottom: none;
  }
}

.cat-prod-var-lab:nth-child(3) {
  grid-column: 1 / -1;
}

@media (min-width: 640px) {
  .cat-prod-var-lab:nth-child(3) {
    grid-column: auto;
  }
}

.cat-prod-var-lab {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  min-width: 0;
}

.cat-prod-var-quitar {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.38rem;
  border-radius: 10px;
  border: 1px solid rgba(251, 113, 133, 0.4);
  background: transparent;
  color: var(--color-peligro);
  cursor: pointer;
}

@media (max-width: 639px) {
  .cat-prod-var-quitar {
    grid-column: 2;
  }
}

.cat-prod-var-quitar:hover {
  background: rgba(251, 113, 133, 0.1);
}

.cat-prod-btn-add-var {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.65rem;
  margin-bottom: 0.25rem;
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
