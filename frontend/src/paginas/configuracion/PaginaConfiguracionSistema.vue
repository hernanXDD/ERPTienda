<script setup lang="ts">
import { CalendarClock, Package, Settings, Wallet } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';
import {
  normalizarConfiguracionSistemaEditable,
  normalizarDiasDeudaCuentaCorriente,
  normalizarPorcentajeGananciaSugerida,
  normalizarStockMinimoAlerta,
} from '../../modulos/configuracion/normalizarConfiguracionSistema';
import { normalizarLimiteCuentaCorriente } from '../../modulos/clientes/formateadorEntradaCliente';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import type { ConfiguracionSistemaEditable } from '../../tipos/configuracionSistema';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import { usePermisosOperador } from '../../composables/usePermisosOperador';

const descripcionPagina = obtenerDescripcionPagina('configuracion-sistema');
const { tienePermiso } = usePermisosOperador();
const puedeEditarConfiguracionSistema = computed(() =>
  tienePermiso('puedeEditarConfiguracionSistema'),
);

const configuracionSistemaStore = useConfiguracionSistemaStore();

const borrador = ref<ConfiguracionSistemaEditable>(
  configuracionSistemaStore.aplicarAlBorrador(),
);
const cargandoInicial = ref(true);
const guardando = ref(false);
const modoEdicion = ref(false);
const mensajeExito = ref('');
const mensajeError = ref('');

const vistaPreviaResumen = computed(() => {
  const normalizado = normalizarConfiguracionSistemaEditable(borrador.value);
  return {
    max: normalizado.maximoCuentaCorriente,
    pct: normalizado.porcentajeGananciaSugerida,
    dias: normalizado.diasDeudaCuentaCorriente,
    stock: normalizado.stockMinimoAlerta,
  };
});

onMounted(async () => {
  mensajeExito.value = '';
  mensajeError.value = '';
  try {
    await configuracionSistemaStore.cargar();
    borrador.value = configuracionSistemaStore.aplicarAlBorrador();
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(
      error,
      'No se pudo cargar la configuración del sistema.',
    );
  } finally {
    cargandoInicial.value = false;
  }
});

function alPerderFocoMaximo(): void {
  borrador.value.maximoCuentaCorriente = normalizarLimiteCuentaCorriente(
    borrador.value.maximoCuentaCorriente,
  );
}

function alPerderFocoPorcentaje(): void {
  borrador.value.porcentajeGananciaSugerida = normalizarPorcentajeGananciaSugerida(
    borrador.value.porcentajeGananciaSugerida,
  );
}

function alPerderFocoDias(): void {
  borrador.value.diasDeudaCuentaCorriente = normalizarDiasDeudaCuentaCorriente(
    borrador.value.diasDeudaCuentaCorriente,
  );
}

function alPerderFocoStockMinimo(): void {
  borrador.value.stockMinimoAlerta = normalizarStockMinimoAlerta(borrador.value.stockMinimoAlerta);
}

function iniciarEdicion(): void {
  mensajeExito.value = '';
  mensajeError.value = '';
  borrador.value = configuracionSistemaStore.aplicarAlBorrador();
  modoEdicion.value = true;
  void nextTick(() => document.getElementById('cfg-max-cc')?.focus());
}

function manejarAccionPie(): void {
  if (guardando.value || !puedeEditarConfiguracionSistema.value) return;
  if (!modoEdicion.value) {
    iniciarEdicion();
    return;
  }
  void guardarConfiguracion();
}

async function guardarConfiguracion(): Promise<void> {
  mensajeExito.value = '';
  mensajeError.value = '';

  alPerderFocoMaximo();
  alPerderFocoPorcentaje();
  alPerderFocoDias();
  alPerderFocoStockMinimo();

  const datos = normalizarConfiguracionSistemaEditable(borrador.value);

  guardando.value = true;
  try {
    await configuracionSistemaStore.actualizar(datos);
    borrador.value = configuracionSistemaStore.aplicarAlBorrador();
    modoEdicion.value = false;
    mensajeExito.value = 'Configuración del sistema guardada correctamente.';
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(
      error,
      'No se pudo guardar la configuración del sistema.',
    );
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <section class="pg-wrap cfg-ficha-vista" aria-labelledby="titulo-config-sistema">
    <div class="pg-marco cfg-sys-marco cfg-ficha-marco">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Settings :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Configuración · Sistema</p>
              <h1 id="titulo-config-sistema" class="pg-titulo">Parámetros del sistema</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
              <p class="cfg-sys-vista-previa" aria-live="polite">
                <span class="cfg-sys-chip">CC $ {{ vistaPreviaResumen.max.toLocaleString('es-AR') }}</span>
                <span class="cfg-sys-chip">+{{ vistaPreviaResumen.pct }} % venta</span>
                <span class="cfg-sys-chip">{{ vistaPreviaResumen.dias }} días deuda</span>
                <span class="cfg-sys-chip">Stock ≤ {{ vistaPreviaResumen.stock }}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div class="cfg-sys-bandera" aria-hidden="true" />

      <div class="cfg-ficha-panel">
        <div v-if="cargandoInicial" class="cfg-ficha-carga" role="status">
          <div class="cfg-ficha-carga-pulso" />
          <p>Cargando parámetros del sistema…</p>
        </div>

        <form
          v-else
          id="form-config-sistema"
          class="cfg-ficha-form"
          :class="{ 'cfg-ficha-form--solo-lectura': !modoEdicion }"
          @submit.prevent="manejarAccionPie"
        >
          <div class="cfg-ficha-scroll">
            <div class="cfg-ficha-contenido cfg-ficha-contenido--sistema">
              <section class="cfg-ficha-bloque" aria-labelledby="cfg-sys-sec-cc">
                <div class="cfg-ficha-bloque-enc">
                  <span class="cfg-ficha-bloque-ico" aria-hidden="true">
                    <Wallet :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-sys-sec-cc" class="cfg-ficha-bloque-tit">Cuentas corrientes</h2>
                </div>
                <div class="cfg-ficha-bloque-cuerpo cfg-ficha-grid">
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="cfg-max-cc">
                      Máximo en cuenta corriente (por defecto)
                    </label>
                    <p class="cfg-ficha-ayuda">
                      Tope sugerido al habilitar CC en un cliente nuevo.
                    </p>
                    <div class="cfg-ficha-inp-grupo cfg-ficha-inp-grupo--corto">
                      <span class="cfg-ficha-inp-prefijo" aria-hidden="true">$</span>
                      <input
                        id="cfg-max-cc"
                        v-model.number="borrador.maximoCuentaCorriente"
                        type="number"
                        class="cfg-ficha-inp cfg-ficha-inp-mono cfg-ficha-inp--prefijo"
                        min="0"
                        step="1000"
                        inputmode="numeric"
                        placeholder="500000"
                        :disabled="!modoEdicion || guardando"
                        @blur="alPerderFocoMaximo"
                      />
                    </div>
                  </div>

                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="cfg-dias-deuda">
                      Días para considerar deuda
                    </label>
                    <p class="cfg-ficha-ayuda">
                      Plazo desde el último cargo para marcar deuda vencida.
                    </p>
                    <div class="cfg-ficha-inp-grupo cfg-ficha-inp-grupo--corto">
                      <input
                        id="cfg-dias-deuda"
                        v-model.number="borrador.diasDeudaCuentaCorriente"
                        type="number"
                        class="cfg-ficha-inp cfg-ficha-inp-mono cfg-ficha-inp--sufijo"
                        min="1"
                        max="365"
                        step="1"
                        inputmode="numeric"
                        placeholder="30"
                        :disabled="!modoEdicion || guardando"
                        @blur="alPerderFocoDias"
                      />
                      <span class="cfg-ficha-inp-sufijo" aria-hidden="true">días</span>
                    </div>
                  </div>
                </div>
              </section>

              <section class="cfg-ficha-bloque" aria-labelledby="cfg-sys-sec-operacion">
                <div class="cfg-ficha-bloque-enc">
                  <span class="cfg-ficha-bloque-ico" aria-hidden="true">
                    <Package :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-sys-sec-operacion" class="cfg-ficha-bloque-tit">
                    Inventario y precios
                  </h2>
                </div>
                <div class="cfg-ficha-bloque-cuerpo cfg-ficha-grid">
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="cfg-stock-min">
                      Stock mínimo para alertas
                    </label>
                    <p class="cfg-ficha-ayuda">
                      Alertas en inicio, stock y reporte de stock crítico.
                    </p>
                    <div class="cfg-ficha-inp-grupo cfg-ficha-inp-grupo--corto">
                      <input
                        id="cfg-stock-min"
                        v-model.number="borrador.stockMinimoAlerta"
                        type="number"
                        class="cfg-ficha-inp cfg-ficha-inp-mono cfg-ficha-inp--sufijo"
                        min="0"
                        max="9999"
                        step="1"
                        inputmode="numeric"
                        placeholder="5"
                        :disabled="!modoEdicion || guardando"
                        @blur="alPerderFocoStockMinimo"
                      />
                      <span class="cfg-ficha-inp-sufijo" aria-hidden="true">unid.</span>
                    </div>
                  </div>

                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="cfg-pct-ganancia">
                      Porcentaje de ganancia sugerido
                    </label>
                    <p class="cfg-ficha-ayuda">
                      Margen sobre costo de compra para precio sugerido en catálogo.
                    </p>
                    <div class="cfg-ficha-inp-grupo cfg-ficha-inp-grupo--corto">
                      <input
                        id="cfg-pct-ganancia"
                        v-model.number="borrador.porcentajeGananciaSugerida"
                        type="number"
                        class="cfg-ficha-inp cfg-ficha-inp-mono cfg-ficha-inp--sufijo"
                        min="0"
                        max="999"
                        step="0.5"
                        inputmode="decimal"
                        placeholder="35"
                        :disabled="!modoEdicion || guardando"
                        @blur="alPerderFocoPorcentaje"
                      />
                      <span class="cfg-ficha-inp-sufijo" aria-hidden="true">%</span>
                    </div>
                  </div>

                  <div class="cfg-ficha-nota cfg-ficha-campo--ancho">
                    <CalendarClock
                      class="cfg-ficha-nota-ico"
                      aria-hidden="true"
                      :size="16"
                      stroke-width="2"
                    />
                    <p class="cfg-ficha-nota-txt">
                      Ejemplo con costo $ 10.000 y {{ vistaPreviaResumen.pct }} % de ganancia:
                      precio sugerido $
                      {{
                        Math.round(10_000 * (1 + vistaPreviaResumen.pct / 100)).toLocaleString(
                          'es-AR',
                        )
                      }}.
                    </p>
                  </div>
                </div>
              </section>

              <div v-if="mensajeError || mensajeExito" class="cfg-ficha-feedback">
                <p v-if="mensajeError" class="cfg-ficha-alerta cfg-ficha-alerta--error" role="alert">
                  {{ mensajeError }}
                </p>
                <p v-if="mensajeExito" class="cfg-ficha-alerta cfg-ficha-alerta--ok" role="status">
                  {{ mensajeExito }}
                </p>
              </div>
            </div>
          </div>

          <footer class="cfg-ficha-pie">
            <button
              v-if="puedeEditarConfiguracionSistema"
              type="submit"
              class="pg-btn-primario"
              :disabled="guardando"
            >
              {{
                guardando
                  ? 'Guardando…'
                  : modoEdicion
                    ? 'Guardar configuración'
                    : 'Editar configuración'
              }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cfg-sys-marco {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.cfg-sys-vista-previa {
  margin: 0.48rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  align-items: center;
}

.cfg-sys-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0.22rem 0.58rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-texto-suave);
  border: 1px solid rgba(124, 140, 240, 0.22);
  background: rgba(7, 11, 20, 0.45);
  font-variant-numeric: tabular-nums;
}

.cfg-sys-bandera {
  height: 4px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(124, 140, 240, 0.15),
    rgba(154, 124, 240, 0.55),
    rgba(124, 140, 240, 0.2)
  );
}
</style>

<style src="../../estilos/formularioConfiguracion.css"></style>
