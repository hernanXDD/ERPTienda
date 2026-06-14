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
import '../../estilos/formularioConfiguracion.css';

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
    movimientoManual: normalizado.movimientoManualStockHabilitado,
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
  <section class="pg-wrap" aria-labelledby="titulo-config-sistema">
    <div class="pg-marco pg-marco--permisos">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Settings :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Configuración · Sistema</p>
              <h1 id="titulo-config-sistema" class="pg-titulo">Parámetros del sistema</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
        <div class="pg-kpis" aria-label="Resumen de parámetros">
          <div class="pg-kpi pg-kpi--acento">
            <span class="pg-kpi-etiq">Máx. CC</span>
            <span class="pg-kpi-valor pg-mono">
              $ {{ vistaPreviaResumen.max.toLocaleString('es-AR') }}
            </span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Ganancia sugerida</span>
            <span class="pg-kpi-valor pg-mono">+{{ vistaPreviaResumen.pct }} %</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Días deuda</span>
            <span class="pg-kpi-valor pg-mono">{{ vistaPreviaResumen.dias }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Stock mínimo</span>
            <span class="pg-kpi-valor pg-mono">{{ vistaPreviaResumen.stock }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Entrada manual</span>
            <span class="pg-kpi-valor">
              {{ vistaPreviaResumen.movimientoManual ? 'Habilitada' : 'Deshabilitada' }}
            </span>
          </div>
        </div>
      </header>

      <form id="form-config-sistema" @submit.prevent="manejarAccionPie">
        <div class="pg-barra">
          <div class="pg-barra-fila">
            <div class="pg-barra-col pg-barra-col--accion">
              <span class="pg-filtro-etiq pg-sr">Acción</span>
              <button
                v-if="puedeEditarConfiguracionSistema"
                type="submit"
                class="pg-btn-primario"
                :disabled="guardando || cargandoInicial"
              >
                {{
                  guardando
                    ? 'Guardando…'
                    : modoEdicion
                      ? 'Guardar configuración'
                      : 'Editar configuración'
                }}
              </button>
            </div>
          </div>
          <p v-if="mensajeExito" class="perm-aviso perm-aviso--ok" role="status">
            {{ mensajeExito }}
          </p>
          <p v-if="mensajeError" class="perm-aviso perm-aviso--error" role="alert">
            {{ mensajeError }}
          </p>
        </div>

        <div v-if="!cargandoInicial" class="perm-ficha" aria-label="Estado de la configuración">
          <div class="perm-ficha-ident">
            <p class="perm-ficha-nombre">Preferencias operativas del negocio</p>
            <p class="perm-ficha-login">
              Cuentas corrientes, alertas de stock y márgenes sugeridos en catálogo.
            </p>
          </div>
          <div class="perm-ficha-chips">
            <span class="perm-chip perm-chip--rol">Parámetros globales</span>
            <span v-if="modoEdicion" class="perm-chip perm-chip--edicion">Modo edición</span>
            <span v-else class="perm-chip">Solo lectura</span>
          </div>
        </div>

        <div v-if="cargandoInicial" class="cfg-ficha-carga" role="status">
          <div class="cfg-ficha-carga-pulso" />
          <p>Cargando parámetros del sistema…</p>
        </div>

        <fieldset
          v-else
          class="perm-cuerpo perm-cuerpo--dos-bloques"
          :class="{ 'perm-cuerpo--solo-lectura': !modoEdicion }"
          :disabled="!modoEdicion || guardando"
        >
          <section class="perm-bloque" aria-labelledby="cfg-sys-sec-cc">
            <header class="perm-bloque-enc">
              <span class="perm-bloque-ico" aria-hidden="true">
                <Wallet :size="16" stroke-width="2" />
              </span>
              <h2 id="cfg-sys-sec-cc" class="perm-bloque-tit">Cuentas corrientes</h2>
            </header>
            <div class="perm-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--vertical">
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

              <section class="perm-bloque" aria-labelledby="cfg-sys-sec-operacion">
                <header class="perm-bloque-enc">
                  <span class="perm-bloque-ico" aria-hidden="true">
                    <Package :size="16" stroke-width="2" />
                  </span>
                  <h2 id="cfg-sys-sec-operacion" class="perm-bloque-tit">
                    Inventario y precios
                  </h2>
                </header>
                <div class="perm-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--sistema-inv">
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

                  <div class="cfg-ficha-campo cfg-ficha-campo--ancho">
                    <div class="cfg-ficha-opcion">
                      <div class="cfg-ficha-opcion-info">
                        <label class="cfg-ficha-etiq" for="cfg-mov-manual">
                          Movimiento manual de stock
                        </label>
                        <p class="cfg-ficha-ayuda cfg-ficha-ayuda--inline">
                          Permite registrar entradas manuales en Stock actual. Requiere además el
                          permiso por usuario; las compras y conteos siguen disponibles.
                        </p>
                      </div>
                      <div class="cfg-ficha-opcion-accion">
                        <span
                          class="cfg-ficha-red-sw-txt"
                          :class="{
                            'cfg-ficha-red-sw-txt--activa': borrador.movimientoManualStockHabilitado,
                          }"
                        >
                          {{
                            borrador.movimientoManualStockHabilitado
                              ? 'Habilitado'
                              : 'Deshabilitado'
                          }}
                        </span>
                        <label class="perm-sw">
                          <input
                            id="cfg-mov-manual"
                            v-model="borrador.movimientoManualStockHabilitado"
                            type="checkbox"
                            class="perm-sw-input"
                            role="switch"
                            aria-label="Habilitar movimiento manual de stock"
                            :disabled="!modoEdicion || guardando"
                          />
                          <span class="perm-sw-ui" aria-hidden="true" />
                        </label>
                      </div>
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
        </fieldset>
      </form>
    </div>
  </section>
</template>
