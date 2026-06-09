<script setup lang="ts">
import { BarChart3, ChevronRight, FileText, Lock } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { obtenerGruposReportesPanel } from '../../modulos/reportes/catalogoReportes';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('reportes-panel');
const gruposPanel = computed(() => obtenerGruposReportesPanel());
</script>

<template>
  <section class="pg-wrap rep-wrap" aria-labelledby="tit-panel-reportes">
    <div class="pg-marco pg-marco--reportes">
      <header class="pg-cab rep-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <BarChart3 :size="20" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Análisis e impresión</p>
              <h1 id="tit-panel-reportes" class="pg-titulo">Reportes</h1>
              <p class="pg-sub rep-cab-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
      </header>

      <div class="rep-panel-cuerpo">
        <section
          v-for="grupo in gruposPanel"
          :key="grupo.id"
          class="rep-bloque"
          :aria-labelledby="`rep-grupo-${grupo.id}`"
        >
          <h2 :id="`rep-grupo-${grupo.id}`" class="rep-bloque-tit">{{ grupo.titulo }}</h2>

          <ul class="rep-lista">
            <li v-for="reporte in grupo.reportes" :key="reporte.id">
              <RouterLink
                v-if="reporte.disponible"
                :to="{ name: reporte.nombreRuta }"
                class="rep-item rep-item--activa"
              >
                <span class="rep-item-ico" aria-hidden="true">
                  <FileText :size="16" stroke-width="2" />
                </span>
                <span class="rep-item-cuerpo">
                  <span class="rep-item-tit">{{ reporte.titulo }}</span>
                  <span class="rep-item-desc">{{ reporte.descripcion }}</span>
                </span>
                <ChevronRight :size="16" class="rep-item-flecha" aria-hidden="true" />
              </RouterLink>

              <article v-else class="rep-item rep-item--proximo" aria-disabled="true">
                <span class="rep-item-ico rep-item-ico--prox" aria-hidden="true">
                  <Lock :size="15" stroke-width="2" />
                </span>
                <span class="rep-item-cuerpo">
                  <span class="rep-item-tit">{{ reporte.titulo }}</span>
                  <span class="rep-item-desc">{{ reporte.descripcion }}</span>
                </span>
                <span class="rep-etiq-proximo">Próximo</span>
              </article>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg-marco--reportes {
  gap: 0;
  padding: 0 0 0.85rem;
}

.rep-cab {
  padding-bottom: 0.75rem !important;
}

.rep-cab :deep(.pg-titulo) {
  font-size: clamp(1.08rem, 2vw, 1.3rem);
}

.rep-cab-sub {
  margin-top: 0.3rem !important;
  font-size: 0.8rem !important;
  line-height: 1.4 !important;
  max-width: 36rem;
}

.rep-panel-cuerpo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  padding: 0 clamp(0.85rem, 2.5vw, 1.25rem) 0.25rem;
  align-content: start;
}

@media (min-width: 960px) {
  .rep-panel-cuerpo {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 540px) {
  .rep-panel-cuerpo {
    grid-template-columns: 1fr;
  }
}

.rep-bloque {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.62rem 0.68rem 0.68rem;
  border-radius: 11px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.rep-bloque-tit {
  margin: 0;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--color-borde);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-texto-apagado);
}

.rep-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.rep-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 0.5rem 0.55rem;
  padding: 0.5rem 0.45rem;
  border-radius: 8px;
  box-sizing: border-box;
}

.rep-item--activa {
  text-decoration: none;
  color: inherit;
  border: 1px solid transparent;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

.rep-item--activa:hover {
  background: rgba(124, 140, 240, 0.09);
  border-color: rgba(124, 140, 240, 0.25);
}

.rep-item--activa:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 1px;
}

.rep-item--proximo {
  opacity: 0.78;
  cursor: default;
  border: 1px dashed color-mix(in srgb, var(--color-borde) 85%, transparent);
  background: rgba(0, 0, 0, 0.08);
}

.rep-item-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  margin-top: 0.05rem;
  border-radius: 7px;
  flex-shrink: 0;
  color: var(--color-acento-hover);
  background: rgba(124, 140, 240, 0.12);
}

.rep-item-ico--prox {
  color: var(--color-texto-apagado);
  background: color-mix(in srgb, var(--color-texto-apagado) 12%, transparent);
}

.rep-item-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}

.rep-item-tit {
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-texto);
}

.rep-item-desc {
  font-size: 0.72rem;
  line-height: 1.38;
  color: var(--color-texto-apagado);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.rep-item-flecha {
  flex-shrink: 0;
  margin-top: 0.35rem;
  color: var(--color-texto-apagado);
}

.rep-item--activa:hover .rep-item-flecha {
  color: var(--color-acento);
}

.rep-etiq-proximo {
  align-self: start;
  margin-top: 0.2rem;
  flex-shrink: 0;
  padding: 0.12rem 0.42rem;
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-texto-apagado) 14%, transparent);
  color: var(--color-texto-apagado);
  white-space: nowrap;
}
</style>
