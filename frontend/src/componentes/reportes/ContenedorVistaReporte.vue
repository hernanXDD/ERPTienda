<script setup lang="ts">
import type { Component } from 'vue';
import { ref } from 'vue';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import type { FiltrosReporteVista, OpcionEntidadReporte } from '../../modulos/reportes/filtroEntidadReporte';
import {
  exportarVistaReporteComoPdf,
  nombreArchivoReportePdf,
} from '../../modulos/reportes/impresionReporte';
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

const filtro = defineModel<FiltrosReporteVista>({ required: true });

const emit = defineEmits<{
  actualizar: [];
}>();

const refVistaReporte = ref<HTMLElement | null>(null);
const exportandoPdf = ref(false);
const errorExportacionPdf = ref('');

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
        <div
          v-if="htmlReporte"
          ref="refVistaReporte"
          :key="tituloImpresion"
          class="rep-preview"
          role="document"
          aria-label="Vista previa del reporte"
          v-html="htmlReporte"
        />
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
</style>
