<script setup lang="ts">
import { BarChart3, ChevronRight, FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { catalogoReportes } from '../../modulos/reportes/catalogoReportes';

const reportesProximos = computed(() => catalogoReportes.filter((r) => !r.disponible));
const reportesActivos = computed(() => catalogoReportes.filter((r) => r.disponible));
</script>

<template>
  <section class="pg-wrap" aria-labelledby="tit-panel-reportes">
    <div class="pg-marco pg-marco--reportes">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <BarChart3 :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Análisis e impresión</p>
              <h1 id="tit-panel-reportes" class="pg-titulo">Panel de reportes</h1>
              <p class="pg-sub">
                Consultas exportables e imprimibles con plantillas
                <strong>EtaJS</strong>. Cada reporte permite filtrar por fechas (y cliente o proveedor) y abrir el resultado en PDF en una nueva pestaña.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section v-if="reportesActivos.length" class="rep-seccion" aria-labelledby="rep-tit-activos">
        <h2 id="rep-tit-activos" class="rep-seccion-tit">Disponibles</h2>
        <ul class="rep-grilla">
          <li v-for="reporte in reportesActivos" :key="reporte.id">
            <RouterLink
              :to="{ name: reporte.nombreRuta }"
              class="rep-tarjeta rep-tarjeta--activa rep-tarjeta--enlace"
            >
              <FileText :size="20" class="rep-tarjeta-ico" aria-hidden="true" stroke-width="1.75" />
              <h3 class="rep-tarjeta-tit">{{ reporte.titulo }}</h3>
              <p class="rep-tarjeta-desc">{{ reporte.descripcion }}</p>
              <span class="rep-tarjeta-cta">
                Abrir reporte
                <ChevronRight :size="16" aria-hidden="true" />
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <section
        v-if="reportesProximos.length"
        class="rep-seccion"
        aria-labelledby="rep-tit-proximos"
      >
        <h2 id="rep-tit-proximos" class="rep-seccion-tit">Próximamente</h2>
        <ul class="rep-grilla">
          <li
            v-for="reporte in reportesProximos"
            :key="reporte.id"
            class="rep-tarjeta rep-tarjeta--proximo"
          >
            <FileText :size="20" class="rep-tarjeta-ico" aria-hidden="true" stroke-width="1.75" />
            <h3 class="rep-tarjeta-tit">{{ reporte.titulo }}</h3>
            <p class="rep-tarjeta-desc">{{ reporte.descripcion }}</p>
            <span class="rep-etiq-proximo">En desarrollo</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.pg-marco--reportes {
  gap: 1.25rem;
  padding: 0 0 1.25rem;
}

.pg-marco--reportes .rep-seccion {
  padding: 0 clamp(1rem, 3vw, 1.5rem);
}

.rep-seccion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rep-seccion-tit {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.rep-grilla {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr));
  gap: 0.85rem;
}

.rep-tarjeta {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem 1.05rem;
  border-radius: var(--radio-borde, 10px);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  min-height: 7.5rem;
}

.rep-tarjeta--proximo {
  opacity: 0.92;
  border-style: dashed;
}

.rep-tarjeta--enlace {
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.rep-tarjeta--enlace:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.rep-tarjeta--activa {
  border-color: var(--color-primario, #2563eb);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primario, #2563eb) 25%, transparent);
}

.rep-tarjeta-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-acento);
}

.rep-tarjeta-ico {
  color: var(--color-primario, #2563eb);
  flex-shrink: 0;
}

.rep-tarjeta-tit {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.rep-tarjeta-desc {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
  flex: 1;
}

.rep-etiq-proximo {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-texto-apagado) 12%, transparent);
  color: var(--color-texto-apagado);
}
</style>
