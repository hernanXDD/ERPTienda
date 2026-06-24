<script setup lang="ts">
import type { Component } from 'vue';
import { computed, ref } from 'vue';
import { ArrowLeft, Download, Loader2 } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import type { FiltrosReporteVista, OpcionEntidadReporte } from '../../modulos/reportes/filtroEntidadReporte';
import BarraFiltrosReporte from './BarraFiltrosReporte.vue';

const props = withDefaults(
  defineProps<{
    titulo: string;
    descripcion: string;
    icono: Component;
    errorFiltro?: string;
    mostrarFiltroCliente?: boolean;
    mostrarFiltroProveedor?: boolean;
    mostrarFiltroEstadoFacturacion?: boolean;
    opcionesCliente?: OpcionEntidadReporte[];
    opcionesProveedor?: OpcionEntidadReporte[];
    opcionesEstadoFacturacion?: OpcionEntidadReporte[];
    hayDatos: boolean;
    mensajeVacio?: string;
    resumen?: string;
    exportando?: boolean;
  }>(),
  {
    mostrarFiltroCliente: false,
    mostrarFiltroProveedor: false,
    mostrarFiltroEstadoFacturacion: false,
    opcionesCliente: () => [],
    opcionesProveedor: () => [],
    opcionesEstadoFacturacion: () => [],
    mensajeVacio: 'Ajustá el rango de fechas y pulsá «Actualizar».',
    exportando: false,
  },
);

const filtro = defineModel<FiltrosReporteVista>({ required: true });

const emit = defineEmits<{
  actualizar: [];
  exportar: [];
}>();

const errorExportacion = ref('');

const puedeExportar = computed(() => props.hayDatos && !props.exportando);

function solicitarExportacion(): void {
  if (!puedeExportar.value) return;
  errorExportacion.value = '';
  emit('exportar');
}

function registrarErrorExportacion(mensaje: string): void {
  errorExportacion.value = mensaje;
}

defineExpose({ registrarErrorExportacion });
</script>

<template>
  <section class="pg-wrap" aria-labelledby="rep-excel-titulo">
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
              <h1 id="rep-excel-titulo" class="pg-titulo">{{ titulo }}</h1>
              <p class="pg-sub">{{ descripcion }}</p>
            </div>
          </div>
        </div>
        <div class="pg-cab-acciones">
          <button
            type="button"
            class="pg-btn-primario rep-btn-exportar"
            :disabled="!puedeExportar"
            :aria-busy="exportando"
            @click="solicitarExportacion"
          >
            <Loader2 v-if="exportando" :size="16" class="rep-btn-exportar-ico--girar" aria-hidden="true" />
            <Download v-else :size="16" aria-hidden="true" />
            {{ exportando ? 'Generando Excel…' : 'Exportar Excel' }}
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

      <div class="rep-excel-cuerpo">
        <p v-if="resumen && hayDatos" class="rep-excel-resumen">{{ resumen }}</p>
        <p v-if="!hayDatos" class="rep-excel-vacio">
          {{ errorFiltro || mensajeVacio }}
        </p>
        <slot v-else />
        <p v-if="errorExportacion" class="rep-export-error" role="alert">
          {{ errorExportacion }}
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

.rep-btn-exportar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 11.5rem;
  justify-content: center;
}

.rep-btn-exportar-ico--girar {
  animation: rep-girar 0.85s linear infinite;
}

@keyframes rep-girar {
  to {
    transform: rotate(360deg);
  }
}

.rep-excel-cuerpo {
  flex: 1;
  overflow: auto;
  padding: 1rem clamp(0.75rem, 2vw, 1.25rem) 1.25rem;
}

.rep-excel-resumen {
  margin: 0 0 1rem;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  background: #eef2f7;
  border: 1px solid #cbd5e1;
  font-size: 0.88rem;
  color: #334155;
}

.rep-excel-vacio {
  margin: 2rem auto;
  max-width: 28rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.92rem;
}

.rep-export-error {
  margin: 0.75rem auto 0;
  max-width: 28rem;
  text-align: center;
  font-size: 0.82rem;
  color: #f87171;
}
</style>
