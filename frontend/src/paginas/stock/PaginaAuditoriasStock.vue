<script setup lang="ts">
import { RefreshCw, ScrollText } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { etiquetaMotivoMovimientoStock } from '../../modulos/inventario/etiquetasMovimientoStock';
import { useStockStore } from '../../stores/stock';
import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';

const stockStore = useStockStore();
const { movimientos } = storeToRefs(stockStore);

const busquedaProducto = ref('');
const fechaDesde = ref('');
const fechaHasta = ref('');

function movimientoEnRangoFecha(isoFecha: string): boolean {
  const ms = new Date(isoFecha).getTime();
  if (fechaDesde.value) {
    const inicio = new Date(`${fechaDesde.value}T00:00:00`).getTime();
    if (ms < inicio) return false;
  }
  if (fechaHasta.value) {
    const fin = new Date(`${fechaHasta.value}T23:59:59.999`).getTime();
    if (ms > fin) return false;
  }
  return true;
}

const movimientosFiltrados = computed(() => {
  const texto = busquedaProducto.value.trim().toLowerCase();
  return [...movimientos.value]
    .filter((m) => movimientoEnRangoFecha(m.fecha))
    .filter((m) => {
      if (!texto) return true;
      const agregado = `${m.nombreVariante} ${m.nota ?? ''} ${m.numeroVenta ?? ''} ${m.ejecutadoPorUsuario ?? ''}`
        .toLowerCase()
        .trim();
      return agregado.includes(texto);
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
});

function limpiarFiltros(): void {
  busquedaProducto.value = '';
  fechaDesde.value = '';
  fechaHasta.value = '';
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="tit-auditorias-stock">
    <div class="pg-marco">
    <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
        <ScrollText :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
        <div>
          <h1 id="tit-auditorias-stock" class="pg-titulo">Auditorías de stock</h1>
          <p class="pg-sub">
            Historial de variaciones de inventario (ventas, entradas manuales y ajustes por conteo).
            Para el saldo vigente volvé a
            <RouterLink class="aud-enlace-interno" :to="{ name: 'stock-actual' }">Stock actual</RouterLink>
            .
          </p>
        </div>
      </div>
            </div>
      </header>

    <div class="pg-barra">
      <div class="pg-barra-col pg-barra-col--busq">
        <label class="pg-filtro-bl" for="aud-busq-prod">
          <span class="pg-filtro-etiq">Buscar en descripción</span>
          <input
            id="aud-busq-prod"
            v-model="busquedaProducto"
            type="search"
            class="pg-filtro-inp"
            placeholder="Producto, nota o venta…"
            autocomplete="off"
          />
        </label>
      </div>

      <div class="pg-barra-col pg-barra-col--fecha">
        <label class="pg-filtro-bl" for="aud-fecha-desde">
          <span class="pg-filtro-etiq">Fecha desde</span>
          <input id="aud-fecha-desde" v-model="fechaDesde" type="date" class="pg-filtro-inp" />
        </label>
      </div>

      <div class="pg-barra-col pg-barra-col--fecha">
        <label class="pg-filtro-bl" for="aud-fecha-hasta">
          <span class="pg-filtro-etiq">Fecha hasta</span>
          <input id="aud-fecha-hasta" v-model="fechaHasta" type="date" class="pg-filtro-inp" />
        </label>
      </div>

      <div class="pg-barra-col pg-barra-col--reinicio">
        <div class="pg-filtro-bl">
          <span class="pg-filtro-etiq">Reinicio</span>
          <button type="button" class="pg-btn-reset-filtros" @click="limpiarFiltros">
            <RefreshCw :size="16" aria-hidden="true" />
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <p class="pg-resumen pg-resumen--flex" role="status">
      Mostrando {{ movimientosFiltrados.length }} de {{ movimientos.length }} movimientos cargados en esta sesión.
    </p>

    <div class="pg-tabla-cuerpo" role="region" aria-label="Registro de movimientos de stock">
      <table class="pg-tabla pg-tabla--estado">
        <thead>
          <tr>
            <th scope="col">Fecha / hora</th>
            <th scope="col">Producto</th>
            <th scope="col">Motivo</th>
            <th scope="col" class="aud-der">Variación</th>
            <th scope="col" class="aud-der">Stock resultante</th>
            <th scope="col">Usuario / notas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in movimientosFiltrados" :key="m.id">
            <td class="aud-mono aud-cel-fecha">{{ formatearFechaYHora(m.fecha) }}</td>
            <td>{{ m.nombreVariante }}</td>
            <td>
              {{ etiquetaMotivoMovimientoStock(m.motivo) }}
              <span v-if="m.numeroVenta" class="aud-mute aud-inline"> · {{ m.numeroVenta }}</span>
            </td>
            <td class="aud-der aud-mono" :data-subio="String(m.cantidadVariacion > 0)">
              {{ m.cantidadVariacion >= 0 ? '+' : '' }}{{ m.cantidadVariacion }}
            </td>
            <td class="aud-der aud-mono">{{ m.stockResultante }}</td>
            <td class="aud-mute aud-nota">
              <template v-if="m.ejecutadoPorUsuario">{{ m.ejecutadoPorUsuario }}</template>
              <template v-if="m.nota?.trim()">
                <span v-if="m.ejecutadoPorUsuario"> · </span>{{ m.nota }}
              </template>
              <template v-if="!m.ejecutadoPorUsuario && !m.nota?.trim()">—</template>
            </td>
          </tr>
          <tr v-if="movimientosFiltrados.length === 0">
            <td colspan="6" class="aud-vacio">
              <template v-if="movimientos.length === 0">
                Todavía no hay movimientos en esta sesión. Las ventas desde POS y los ajustes con permiso
                aparecerán aquí.
              </template>
              <template v-else> No hay movimientos para los filtros elegidos. </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  </section>
</template>

<style scoped>
.aud {
  width: 100%;
  max-width: 1120px;
  margin-inline: auto;
}

.pg-cab {
  margin-bottom: 1rem;
}

.pg-cab-izq {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.pg-cab-ico {
  flex-shrink: 0;
  color: var(--color-acento);
  margin-top: 0.1rem;
}

.pg-titulo {
  margin: 0;
  font-size: clamp(1.1rem, 2.6vw, 1.45rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.pg-sub {
  margin: 0.35rem 0 0;
  font-size: 0.845rem;
  line-height: 1.52;
  color: var(--color-texto-apagado);
  max-width: 58rem;
}

.aud-enlace-interno {
  color: var(--color-acento-hover);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(124, 140, 240, 0.45);
}

.aud-enlace-interno:hover {
  filter: brightness(1.08);
}

.pg-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.75rem 1.15rem;
  margin-bottom: 0.65rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.pg-barra-col {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
}

.pg-barra-col--busq {
  flex: 1 1 13rem;
  min-width: min(100%, 12rem);
}

.pg-barra-col--fecha {
  flex: 0 1 10.25rem;
  min-width: min(100%, 9.5rem);
}

.pg-barra-col--reinicio {
  flex: 0 0 auto;
  margin-left: auto;
}

.pg-barra-col--reinicio .aud-btn-reset {
  width: 100%;
  justify-content: center;
}

@media (min-width: 720px) {
  .pg-barra-col--reinicio .aud-btn-reset {
    width: auto;
    min-width: 10.5rem;
  }
}

@media (max-width: 719px) {
  .pg-barra-col--reinicio {
    margin-left: 0;
    flex: 1 1 100%;
  }
}

.pg-filtro-bl {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.pg-filtro-etiq {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.pg-filtro-inp {
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

.aud-btn-sec {
  cursor: pointer;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.45rem 0.92rem;
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto);
  white-space: nowrap;
  gap: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.38rem;
  box-sizing: border-box;
  padding-inline: 0.85rem;
}

.pg-resumen pg-resumen--flex {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.pg-tabla-cuerpo {
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  overflow-x: auto;
  background: var(--color-fondo-elevado);
}

.pg-tabla pg-tabla--estado {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.825rem;
  min-width: 720px;
}

.pg-tabla pg-tabla--estado th,
.pg-tabla pg-tabla--estado td {
  padding: 0.52rem 0.75rem;
  border-bottom: 1px solid var(--color-borde);
  text-align: left;
  vertical-align: top;
}

.pg-tabla pg-tabla--estado th {
  font-size: 0.695rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
  white-space: nowrap;
}

.aud-der {
  text-align: right;
}

.aud-mono {
  font-variant-numeric: tabular-nums;
}

.aud-cel-fecha {
  white-space: nowrap;
  font-size: 0.785rem;
}

.aud-mute {
  color: var(--color-texto-apagado);
}

.aud-inline {
  display: inline;
}

.aud-nota {
  font-size: 0.8rem;
  line-height: 1.45;
}

.pg-tabla pg-tabla--estado td[data-subio='true'] {
  color: var(--color-exito);
}

.aud-vacio {
  padding: 2rem 1rem !important;
  text-align: center !important;
  color: var(--color-texto-apagado);
  border-bottom: none !important;
  line-height: 1.5;
  max-width: 42rem;
  margin-inline: auto;
}
</style>
