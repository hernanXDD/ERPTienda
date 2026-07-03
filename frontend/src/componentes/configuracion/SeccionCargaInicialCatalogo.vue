<script setup lang="ts">
import { FileDown, Upload } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { etiquetaTalleColor } from '../../modulos/catalogo/catalogoPresentacion';
import {
  contarProductosUnicosCargaStock,
  contarVariantesNuevasProductoExistente,
  descargarPlantillaCargaStockInicial,
  parsearArchivoCargaStockInicial,
  type LineaActualizacionStockPrevista,
  type LineaCargaStockInicialPrevista,
} from '../../modulos/inventario/plantillaCargaStockInicial';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useCatalogoStore } from '../../stores/catalogo';
import { useStockStore } from '../../stores/stock';
import { cargarDatosMaestros } from '../../stores/inicializacionDatos';

const catalogoStore = useCatalogoStore();
const stockStore = useStockStore();
const { categorias, productos, variantes } = storeToRefs(catalogoStore);

const refInputImportar = useTemplateRef('refInputImportar');
const refModalConfirmar = useTemplateRef('refModalConfirmar');

const lineasPendientes = ref<LineaCargaStockInicialPrevista[]>([]);
const actualizacionesStock = ref<LineaActualizacionStockPrevista[]>([]);
const erroresParseo = ref<string[]>([]);
const advertenciasParseo = ref<string[]>([]);
const resumenParseo = ref({ filasIgnoradasVacias: 0, filasSinCambio: 0 });
const nombreArchivo = ref('');
const observacionImportacion = ref('');
const mensajeModal = ref('');
const importando = ref(false);
const mensajeToast = ref('');
const tipoMensajeToast = ref<'error' | 'ok'>('ok');
let idToast: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  void cargarDatosMaestros();
});

const filasStockCeroParaPlantilla = computed(() =>
  variantes.value
    .map((variante) => {
      const producto = catalogoStore.productoPorId(variante.productoId);
      if (!producto) return null;
      const stock = stockStore.cantidadActual(variante.id);
      if (stock !== 0) return null;
      return {
        producto,
        variante,
        nombreCategoria: catalogoStore.nombreCategoria(producto.categoriaId),
        stock,
      };
    })
    .filter((fila): fila is NonNullable<typeof fila> => fila !== null)
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
    }),
);

const totalUnidades = computed(() =>
  lineasPendientes.value.reduce((suma, fila) => suma + fila.stock, 0),
);

const variantesNuevasProductoExistente = computed(() =>
  contarVariantesNuevasProductoExistente(lineasPendientes.value),
);

const productosUnicos = computed(() => contarProductosUnicosCargaStock(lineasPendientes.value));

const puedeConfirmar = computed(
  () =>
    !importando.value &&
    erroresParseo.value.length === 0 &&
    (lineasPendientes.value.length > 0 || actualizacionesStock.value.length > 0),
);

function mostrarToast(texto: string, tipo: 'error' | 'ok'): void {
  mensajeToast.value = texto;
  tipoMensajeToast.value = tipo;
  if (idToast) clearTimeout(idToast);
  idToast = setTimeout(() => {
    mensajeToast.value = '';
  }, 5000);
}

function generarPlantilla(): void {
  try {
    const filasStockCero = filasStockCeroParaPlantilla.value;
    descargarPlantillaCargaStockInicial(categorias.value, filasStockCero);
    const detalleStockCero =
      filasStockCero.length > 0
        ? ` Incluye ${filasStockCero.length} artículo(s) con stock 0 para completar.`
        : '';
    mostrarToast(
      `Plantilla descargada.${detalleStockCero} Enviásela al cliente para que complete la hoja «Productos».`,
      'ok',
    );
  } catch (error) {
    const texto = error instanceof Error ? error.message : 'No se pudo generar la plantilla.';
    mostrarToast(texto, 'error');
  }
}

function abrirSelectorImportar(): void {
  refInputImportar.value?.click();
}

function limpiarEstadoConfirmacion(): void {
  lineasPendientes.value = [];
  actualizacionesStock.value = [];
  erroresParseo.value = [];
  advertenciasParseo.value = [];
  resumenParseo.value = { filasIgnoradasVacias: 0, filasSinCambio: 0 };
  nombreArchivo.value = '';
  observacionImportacion.value = '';
  mensajeModal.value = '';
  importando.value = false;
}

function cerrarModal(): void {
  refModalConfirmar.value?.close();
}

function alCerrarModal(): void {
  limpiarEstadoConfirmacion();
}

async function alSeleccionarArchivo(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;

  limpiarEstadoConfirmacion();
  nombreArchivo.value = archivo.name;

  const codigosBarrasEnUso = new Set(
    variantes.value
      .map((variante) => variante.codigoBarras.trim())
      .filter((codigo) => Boolean(codigo)),
  );

  try {
    const resultado = await parsearArchivoCargaStockInicial(
      archivo,
      categorias.value,
      codigosBarrasEnUso,
      productos.value.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        marca: producto.marca,
        categoriaId: producto.categoriaId,
      })),
      variantes.value.map((variante) => ({
        id: variante.id,
        productoId: variante.productoId,
        talle: variante.talle,
        color: variante.color,
        codigoBarras: variante.codigoBarras,
      })),
      (varianteId) => stockStore.cantidadActual(varianteId),
    );

    lineasPendientes.value = resultado.lineas;
    actualizacionesStock.value = resultado.actualizacionesStock;
    erroresParseo.value = resultado.errores;
    advertenciasParseo.value = resultado.advertencias;
    resumenParseo.value = {
      filasIgnoradasVacias: resultado.filasIgnoradasVacias,
      filasSinCambio: resultado.filasSinCambio,
    };

    if (resultado.errores.length > 0) {
      mostrarToast('Revisá los errores del archivo antes de confirmar la importación.', 'error');
    } else if (resultado.lineas.length === 0 && resultado.actualizacionesStock.length === 0) {
      mostrarToast('No hay productos ni cambios de stock para aplicar en el archivo.', 'error');
    }

    nextTick(() => refModalConfirmar.value?.showModal());
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudo leer el archivo Excel.'), 'error');
  }
}

async function confirmarImportacion(): Promise<void> {
  if (!puedeConfirmar.value) return;

  importando.value = true;
  mensajeModal.value = '';

  try {
    const observacion = observacionImportacion.value.trim() || undefined;
    let productosCreados = 0;
    let variantesCreadas = 0;
    let unidadesStockNuevas = 0;
    let cantidadActualizacionesStock = 0;

    if (actualizacionesStock.value.length > 0) {
      const resultadoConteo = await stockStore.aplicarImportacionConteoMasivo(
        actualizacionesStock.value.map((linea) => ({
          varianteId: linea.varianteId,
          cantidadFisicaContada: linea.stockNuevo,
        })),
        observacion,
      );
      cantidadActualizacionesStock = resultadoConteo.lineasProcesadas;
    }

    if (lineasPendientes.value.length > 0) {
      const resultado = await catalogoStore.aplicarImportacionStockInicial(
        lineasPendientes.value.map((linea) => ({
          productoId: linea.productoId,
          nombre: linea.nombre,
          marca: linea.marca,
          categoriaId: linea.categoriaId,
          precioVenta: linea.precioVenta,
          descripcion: linea.descripcion,
          talle: linea.talle,
          codigoBarras: linea.codigoBarras,
          stock: linea.stock,
        })),
        observacion,
      );
      productosCreados = resultado.productosCreados;
      variantesCreadas = resultado.variantesCreadas;
      unidadesStockNuevas = resultado.unidadesStock;
    }

    await Promise.all([
      catalogoStore.cargar({ forzar: true }),
      stockStore.cargar({ forzar: true }),
    ]);

    cerrarModal();
    limpiarEstadoConfirmacion();

    const partes: string[] = [];
    if (productosCreados > 0) partes.push(`${productosCreados} producto(s) nuevo(s)`);
    if (variantesCreadas > 0) partes.push(`${variantesCreadas} artículo(s) creado(s)`);
    if (unidadesStockNuevas > 0) partes.push(`${unidadesStockNuevas} unidades en alta`);
    if (cantidadActualizacionesStock > 0) {
      partes.push(`${cantidadActualizacionesStock} stock(s) actualizado(s)`);
    }
    mostrarToast(
      partes.length > 0 ? `Carga inicial aplicada: ${partes.join(', ')}.` : 'Carga inicial completada.',
      'ok',
    );
  } catch (error) {
    mensajeModal.value = mensajeErrorHttp(
      error,
      'No se pudo aplicar la carga inicial. Intentá de nuevo.',
    );
  } finally {
    importando.value = false;
  }
}
</script>

<template>
  <section class="ci-seccion" aria-labelledby="ci-titulo">
    <h2 id="ci-titulo" class="ci-titulo">Carga inicial de catálogo</h2>

    <ol class="ci-pasos">
      <li>Descargá la plantilla Excel con el formato oficial.</li>
      <li>Enviásela al cliente para que complete la hoja «Productos» (sin cambiar columnas ni nombres).</li>
      <li>Cuando te devuelvan el archivo, importalo acá y revisá el resumen antes de confirmar.</li>
    </ol>

    <div class="ci-acciones" aria-label="Acciones de carga inicial">
      <button
        type="button"
        class="pg-btn-primario ci-btn"
        :disabled="categorias.length === 0"
        @click="generarPlantilla"
      >
        <FileDown :size="18" stroke-width="2" aria-hidden="true" />
        Descargar plantilla
      </button>
      <button type="button" class="ci-btn-importar" @click="abrirSelectorImportar">
        <Upload :size="18" stroke-width="2" aria-hidden="true" />
        Importar Excel del cliente
      </button>
      <input
        ref="refInputImportar"
        type="file"
        class="ci-input-archivo"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        @change="alSeleccionarArchivo"
      />
    </div>

    <p v-if="categorias.length === 0" class="ci-aviso" role="status">
      Cargando categorías del catálogo… Si el mensaje persiste, revisá la conexión con la API.
    </p>

    <p
      v-if="mensajeToast"
      class="ci-toast"
      :class="`ci-toast--${tipoMensajeToast}`"
      role="status"
    >
      {{ mensajeToast }}
    </p>

    <dialog
      ref="refModalConfirmar"
      class="ci-dlg"
      aria-labelledby="ci-dlg-titulo"
      @close="alCerrarModal"
    >
      <div class="ci-dlg-pane" @click.stop>
        <header class="ci-dlg-cap">
          <div>
            <h3 id="ci-dlg-titulo">Confirmar carga inicial</h3>
            <p v-if="nombreArchivo" class="ci-dlg-archivo">{{ nombreArchivo }}</p>
          </div>
          <button
            type="button"
            class="ci-dlg-x"
            aria-label="Cerrar"
            :disabled="importando"
            @click="cerrarModal"
          >
            ×
          </button>
        </header>

        <p class="ci-dlg-ley">
          Se darán de alta productos nuevos con sus talles y stock inicial. Los movimientos quedarán
          registrados en
          <RouterLink class="ci-enlace" :to="{ name: 'stock-auditorias' }">
            Auditorías de stock
          </RouterLink>.
        </p>

        <div v-if="erroresParseo.length" class="ci-alerta ci-alerta--error" role="alert">
          <p class="ci-alerta-tit">Errores en el archivo</p>
          <ul class="ci-lista">
            <li v-for="(error, i) in erroresParseo" :key="`err-${i}`">{{ error }}</li>
          </ul>
        </div>

        <div v-if="advertenciasParseo.length" class="ci-alerta ci-alerta--aviso" role="status">
          <p class="ci-alerta-tit">Advertencias</p>
          <ul class="ci-lista">
            <li v-for="(aviso, i) in advertenciasParseo" :key="`av-${i}`">{{ aviso }}</li>
          </ul>
        </div>

        <div class="ci-resumen" role="status">
          <span><strong>{{ productosUnicos }}</strong> producto(s) nuevo(s)</span>
          <span><strong>{{ variantesNuevasProductoExistente }}</strong> talle(s) en productos existentes</span>
          <span><strong>{{ lineasPendientes.length }}</strong> artículo(s) en total</span>
          <span><strong>{{ actualizacionesStock.length }}</strong> stock(s) a actualizar</span>
          <span><strong>{{ totalUnidades }}</strong> unidades en altas</span>
        </div>

        <div
          v-if="actualizacionesStock.length > 0"
          class="ci-tabla-wrap"
          role="region"
          aria-label="Actualizaciones de stock previstas"
        >
          <p class="ci-alerta-tit">Stock a actualizar</p>
          <table class="ci-tabla">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Producto</th>
                <th scope="col" class="ci-der">Actual</th>
                <th scope="col" class="ci-der">Nuevo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in actualizacionesStock" :key="`act-${fila.varianteId}`">
                <td class="ci-mono">{{ fila.codigoBarras || '—' }}</td>
                <td>{{ fila.nombreVariante }}</td>
                <td class="ci-der ci-mono">{{ fila.stockAnterior }}</td>
                <td class="ci-der ci-mono ci-cant">{{ fila.stockNuevo }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ci-tabla-wrap" role="region" aria-label="Productos a importar">
          <table class="ci-tabla">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col">Talle</th>
                <th scope="col" class="ci-der">Precio</th>
                <th scope="col" class="ci-der">Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fila, indice) in lineasPendientes" :key="`linea-${indice}`">
                <td>{{ fila.nombre }} · {{ fila.marca }}</td>
                <td>{{ fila.nombreCategoria }}</td>
                <td>{{ fila.talle }}</td>
                <td class="ci-der ci-mono">{{ fila.precioVenta }}</td>
                <td class="ci-der ci-mono ci-cant">{{ fila.stock }}</td>
              </tr>
              <tr v-if="lineasPendientes.length === 0">
                <td colspan="5" class="ci-vacio">
                  {{
                    erroresParseo.length
                      ? 'Corregí el archivo para continuar.'
                      : actualizacionesStock.length
                        ? 'No hay productos nuevos para crear.'
                        : 'No hay productos para importar.'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <label class="ci-lab" for="ci-observacion">
          <span class="pg-filtro-etiq">Observación para auditoría (opcional)</span>
          <textarea
            id="ci-observacion"
            v-model="observacionImportacion"
            class="ci-txt"
            rows="2"
            maxlength="240"
            placeholder="Ej. Apertura Local Centro — inventario inicial junio 2026"
            :disabled="importando"
          />
        </label>

        <p v-if="mensajeModal" class="ci-msg" role="alert">{{ mensajeModal }}</p>

        <footer class="ci-dlg-acc">
          <button type="button" class="pg-btn" :disabled="importando" @click="cerrarModal">
            Cancelar
          </button>
          <button
            type="button"
            class="pg-btn-primario"
            :disabled="!puedeConfirmar"
            @click="confirmarImportacion"
          >
            {{ importando ? 'Importando…' : 'Confirmar y aplicar carga' }}
          </button>
        </footer>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.ci-seccion {
  padding: 0 0 0.5rem;
}

.ci-titulo {
  margin: 0 0 0.65rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.ci-pasos {
  margin: 0 0 1rem;
  padding-left: 1.2rem;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--color-texto-suave);
}

.ci-pasos li + li {
  margin-top: 0.35rem;
}

.ci-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: stretch;
}

.ci-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.ci-btn-importar {
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
}

.ci-btn-importar:hover {
  filter: brightness(1.06);
}

.ci-input-archivo {
  display: none;
}

.ci-aviso {
  margin: 0.75rem 0 0;
  font-size: 0.84rem;
  color: var(--color-texto-apagado);
}

.ci-toast {
  margin: 0.85rem 0 0;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  font-size: 0.84rem;
  line-height: 1.45;
}

.ci-toast--ok {
  background: var(--color-exito-suave);
  border: 1px solid var(--color-exito-borde);
  color: var(--color-exito);
}

.ci-toast--error {
  background: var(--color-peligro-suave);
  border: 1px solid var(--color-peligro-borde);
  color: var(--color-peligro);
}

.ci-dlg {
  border: none;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: min(52rem, 100%);
  border-radius: 14px;
  box-shadow: var(--color-sombra-elevada);
  background: transparent;
}

.ci-dlg::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(3px);
}

.ci-dlg-pane {
  max-height: min(92dvh, 44rem);
  display: flex;
  flex-direction: column;
  padding: 1.1rem clamp(1rem, 3vw, 1.35rem);
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  border-radius: 14px;
}

.ci-dlg-cap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}

.ci-dlg-cap h3 {
  margin: 0;
  font-size: clamp(1.02rem, 2.8vw, 1.22rem);
  font-weight: 700;
}

.ci-dlg-archivo {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
  word-break: break-all;
}

.ci-dlg-x {
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

.ci-dlg-ley {
  margin: 0 0 0.82rem;
  font-size: 0.795rem;
  line-height: 1.53;
  color: var(--color-texto-apagado);
}

.ci-enlace {
  color: var(--color-acento);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ci-alerta {
  margin-bottom: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  font-size: 0.8rem;
  line-height: 1.45;
}

.ci-alerta--error {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
  border: 1px solid var(--color-peligro-borde);
}

.ci-alerta--aviso {
  color: var(--color-advertencia);
  background: var(--color-advertencia-suave);
  border: 1px solid var(--color-advertencia-borde);
}

.ci-alerta-tit {
  margin: 0 0 0.35rem;
  font-weight: 700;
}

.ci-lista {
  margin: 0;
  padding-left: 1.1rem;
}

.ci-resumen {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1rem;
  margin-bottom: 0.65rem;
  font-size: 0.82rem;
  color: var(--color-texto-suave);
}

.ci-tabla-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-bottom: 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.ci-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.ci-tabla th,
.ci-tabla td {
  padding: 0.52rem 0.72rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.ci-tabla th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-elevado);
}

.ci-der {
  text-align: right;
}

.ci-mono {
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, monospace;
}

.ci-cant {
  font-weight: 700;
}

.ci-vacio {
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.84rem;
}

.ci-lab {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ci-txt {
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

.ci-msg {
  margin-top: 0.65rem;
  font-size: 0.8rem;
  color: var(--color-peligro);
}

.ci-dlg-acc {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.05rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-borde);
}
</style>
