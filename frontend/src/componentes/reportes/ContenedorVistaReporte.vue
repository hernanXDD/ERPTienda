<script setup lang="ts">
import type { Component } from 'vue';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import type { FiltrosReporteVista, OpcionEntidadReporte } from '../../modulos/reportes/filtroEntidadReporte';
import { useEsMovil } from '../../composables/useEsMovil';
import {
  exportarVistaReporteComoPdf,
  nombreArchivoReportePdf,
} from '../../modulos/reportes/impresionReporte';
import { generarEstilosReporteNegocio } from '../../modulos/reportes/estilosReporteCss';
import { useNegocioStore } from '../../stores/negocio';
import BarraFiltrosReporte from './BarraFiltrosReporte.vue';
import { notificarError } from '../../utilidades/notificacion';

const props = withDefaults(
  defineProps<{
    titulo: string;
    descripcion: string;
    icono: Component;
    htmlReporte: string;
    errorFiltro?: string;
    tituloImpresion: string;
    mostrarFiltroCliente?: boolean;
    mostrarFiltroProveedor?: boolean;
    mostrarFiltroEstadoFacturacion?: boolean;
    opcionesCliente?: OpcionEntidadReporte[];
    opcionesProveedor?: OpcionEntidadReporte[];
    opcionesEstadoFacturacion?: OpcionEntidadReporte[];
  }>(),
  {
    mostrarFiltroCliente: false,
    mostrarFiltroProveedor: false,
    mostrarFiltroEstadoFacturacion: false,
    opcionesCliente: () => [],
    opcionesProveedor: () => [],
    opcionesEstadoFacturacion: () => [],
  }
);

const negocioStore = useNegocioStore();

const filtro = defineModel<FiltrosReporteVista>({ required: true });

const emit = defineEmits<{
  actualizar: [];
}>();

const refVistaReporte = ref<HTMLElement | null>(null);
const refEscalaMovil = ref<HTMLElement | null>(null);
const exportandoPdf = ref(false);
const errorExportacionPdf = ref('');

const esMovil = useEsMovil();
const escalaMovil = ref(1);
const anchoReportePx = ref(0);
const altoReportePx = ref(0);

const vistaPreviaReducidaMovil = computed(
  () => esMovil.value && escalaMovil.value < 0.999 && anchoReportePx.value > 0,
);

const estilosPistaMovil = computed(() => {
  if (!vistaPreviaReducidaMovil.value) return undefined;
  return {
    width: `${anchoReportePx.value * escalaMovil.value}px`,
    height: `${altoReportePx.value * escalaMovil.value}px`,
  };
});

const estilosPreviewMovil = computed(() => {
  if (!vistaPreviaReducidaMovil.value) return undefined;
  return {
    width: `${anchoReportePx.value}px`,
    maxWidth: 'none',
    transform: `scale(${escalaMovil.value})`,
    transformOrigin: 'top left',
  };
});

let observadorRecursosReporte: MutationObserver | undefined;

const ID_ESTILOS_VISTA_PREVIA = 'rep-vista-previa-estilos';

const estilosVistaPreviaReporte = computed(() =>
  generarEstilosReporteNegocio(negocioStore.negocio),
);

function asegurarEstilosVistaPreviaReporte(): void {
  let hoja = document.getElementById(ID_ESTILOS_VISTA_PREVIA) as HTMLStyleElement | null;
  if (!hoja) {
    hoja = document.createElement('style');
    hoja.id = ID_ESTILOS_VISTA_PREVIA;
    document.head.appendChild(hoja);
  }
  hoja.textContent = estilosVistaPreviaReporte.value;
}

function desconectarObservadorRecursosReporte(): void {
  observadorRecursosReporte?.disconnect();
  observadorRecursosReporte = undefined;
}

function observarRecursosReporte(vista: HTMLElement): void {
  desconectarObservadorRecursosReporte();

  const recalcular = () => void actualizarEscalaVistaPreviaMovil();
  vista.querySelectorAll('img').forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', recalcular, { once: true });
      img.addEventListener('error', recalcular, { once: true });
    }
  });

  observadorRecursosReporte = new MutationObserver(recalcular);
  observadorRecursosReporte.observe(vista, { childList: true, subtree: true });
}

async function actualizarEscalaVistaPreviaMovil(): Promise<void> {
  await nextTick();
  asegurarEstilosVistaPreviaReporte();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!esMovil.value || !refEscalaMovil.value || !refVistaReporte.value) {
        escalaMovil.value = 1;
        anchoReportePx.value = 0;
        altoReportePx.value = 0;
        desconectarObservadorRecursosReporte();
        return;
      }

      const contenedor = refEscalaMovil.value;
      const vista = refVistaReporte.value;
      const anchoDisponible = contenedor.clientWidth;
      const documento = vista.querySelector('.rep-doc');

      if (!(documento instanceof HTMLElement)) {
        escalaMovil.value = 1;
        anchoReportePx.value = 0;
        altoReportePx.value = 0;
        return;
      }

      const anchoReporte = documento.offsetWidth || documento.scrollWidth;
      const altoReporte = Math.max(
        vista.scrollHeight,
        documento.offsetHeight,
        documento.scrollHeight,
      );

      if (anchoDisponible <= 0 || anchoReporte <= 0 || altoReporte <= 0) return;

      const escala = Math.min(1, anchoDisponible / anchoReporte);
      escalaMovil.value = escala;
      anchoReportePx.value = anchoReporte;
      altoReportePx.value = altoReporte;
      observarRecursosReporte(vista);
    });
  });
}

useResizeObserver(refEscalaMovil, () => void actualizarEscalaVistaPreviaMovil());
useResizeObserver(refVistaReporte, () => void actualizarEscalaVistaPreviaMovil());

watch([() => props.htmlReporte, esMovil], () => void actualizarEscalaVistaPreviaMovil(), {
  flush: 'post',
});

watch(estilosVistaPreviaReporte, () => asegurarEstilosVistaPreviaReporte());

onMounted(async () => {
  await negocioStore.asegurarCargado();
  asegurarEstilosVistaPreviaReporte();
  void actualizarEscalaVistaPreviaMovil();
});

onUnmounted(() => {
  desconectarObservadorRecursosReporte();
});

async function exportarPdf(): Promise<void> {
  if (!props.htmlReporte.trim() || exportandoPdf.value) return;

  exportandoPdf.value = true;
  errorExportacionPdf.value = '';

  try {
    const nombreArchivo = nombreArchivoReportePdf(props.tituloImpresion, filtro.value);
    await exportarVistaReporteComoPdf(
      props.htmlReporte,
      nombreArchivo,
      refVistaReporte.value
    );
  } catch (error: unknown) {
    const mensaje =
      error instanceof Error ? error.message : 'No se pudo abrir el PDF en una nueva pestaña.';
    errorExportacionPdf.value = mensaje;
    notificarError(mensaje);
  } finally {
    exportandoPdf.value = false;
  }
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="rep-vista-titulo">
    <div class="pg-marco pg-marco--reporte-vista">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <component :is="icono" :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <RouterLink :to="{ name: 'reportes-panel' }" class="rep-volver">
                <ArrowLeft :size="14" aria-hidden="true" />
                Panel de reportes
              </RouterLink>
              <h1 id="rep-vista-titulo" class="pg-titulo">{{ titulo }}</h1>
              <p class="pg-sub">{{ descripcion }}</p>
            </div>
          </div>
        </div>
        <div class="pg-cab-acciones">
          <button
            type="button"
            class="pg-btn-primario rep-btn-imprimir"
            :disabled="!htmlReporte.trim() || exportandoPdf"
            :aria-busy="exportandoPdf"
            @click="exportarPdf"
          >
            <Loader2 v-if="exportandoPdf" :size="16" class="rep-btn-imprimir-ico--girar" aria-hidden="true" />
            <ExternalLink v-else :size="16" aria-hidden="true" />
            {{ exportandoPdf ? 'Generando PDF…' : 'Abrir PDF' }}
          </button>
        </div>
      </header>

      <BarraFiltrosReporte
        v-model="filtro"
        :error-mensaje="errorFiltro"
        :mostrar-filtro-cliente="mostrarFiltroCliente"
        :mostrar-filtro-proveedor="mostrarFiltroProveedor"
        :mostrar-filtro-estado-facturacion="mostrarFiltroEstadoFacturacion"
        :opciones-cliente="opcionesCliente"
        :opciones-proveedor="opcionesProveedor"
        :opciones-estado-facturacion="opcionesEstadoFacturacion"
        @actualizar="emit('actualizar')"
      />

      <div class="rep-preview-envoltorio">
        <p v-if="vistaPreviaReducidaMovil && htmlReporte" class="rep-preview-aviso-movil">
          Vista reducida para ver la página completa. Usá «Abrir PDF» para el tamaño real.
        </p>
        <div
          v-if="htmlReporte"
          ref="refEscalaMovil"
          class="rep-preview-escala"
          :class="{ 'rep-preview-escala--activa': vistaPreviaReducidaMovil }"
        >
          <div class="rep-preview-pista" :style="estilosPistaMovil">
            <div
              ref="refVistaReporte"
              :key="tituloImpresion"
              class="rep-preview"
              :style="estilosPreviewMovil"
              role="document"
              aria-label="Vista previa del reporte"
              v-html="htmlReporte"
            />
          </div>
        </div>
        <p v-else class="rep-preview-vacio">
          {{ errorFiltro || 'Ajustá el rango de fechas y pulsá «Actualizar».' }}
        </p>
        <p v-if="errorExportacionPdf" class="rep-export-error" role="alert">
          {{ errorExportacionPdf }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg-marco--reporte-vista {
  min-height: min(70vh, 720px);
}

.pg-cab-acciones {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.rep-volver {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0 0 0.35rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-acento);
  text-decoration: none;
}

.rep-volver:hover {
  text-decoration: underline;
}

.rep-btn-imprimir {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 10.5rem;
  justify-content: center;
}

.rep-btn-imprimir-ico--girar {
  animation: rep-girar 0.85s linear infinite;
}

@keyframes rep-girar {
  to {
    transform: rotate(360deg);
  }
}

.rep-export-error {
  margin: 0.75rem auto 0;
  max-width: 28rem;
  text-align: center;
  font-size: 0.82rem;
  color: #f87171;
}

.rep-preview-envoltorio {
  flex: 1;
  overflow: auto;
  padding: 1rem clamp(0.75rem, 2vw, 1.25rem) 1.25rem;
  background: #e8ecf1;
}

.rep-preview-aviso-movil {
  margin: 0 0 0.55rem;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.4;
  color: #64748b;
}

.rep-preview-escala {
  width: 100%;
}

.rep-preview-escala--activa {
  display: flex;
  justify-content: center;
}

.rep-preview-pista {
  position: relative;
  flex-shrink: 0;
  max-width: 100%;
}

.rep-preview-escala--activa .rep-preview {
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  overflow: visible;
}

.rep-preview {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(0, 0, 0, 0.06);
}

.rep-preview :deep(.rep-pie-pagina) {
  display: none !important;
}

.rep-preview-vacio {
  margin: 2rem auto;
  max-width: 28rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.92rem;
}

@media (max-width: 900px) {
  .pg-marco--reporte-vista {
    min-height: min(62vh, 640px);
  }

  .pg-marco--reporte-vista .pg-cab {
    padding: 0.65rem 0.65rem 0.7rem;
    gap: 0.55rem;
  }

  .pg-marco--reporte-vista .pg-titulo {
    font-size: 1.05rem;
  }

  .pg-marco--reporte-vista .pg-sub {
    display: none;
  }

  .pg-marco--reporte-vista .pg-cab-acciones {
    width: 100%;
  }

  .pg-marco--reporte-vista .rep-btn-imprimir {
    width: 100%;
    min-width: 0;
    min-height: 2.35rem;
    font-size: 0.84rem;
  }

  .rep-preview-envoltorio {
    overflow-x: hidden;
    padding: 0.45rem 0.35rem 0.65rem;
  }

  .rep-preview-aviso-movil {
    margin-bottom: 0.4rem;
    font-size: 0.66rem;
  }
}
</style>
