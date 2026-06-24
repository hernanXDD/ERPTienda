<script setup lang="ts">
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContextoProcesoDevolucion } from '../../composables/useProcesoDevolucion';
import { FORMAS_PAGO } from '../../datos/formasPago';

const props = defineProps<{
  proceso: ContextoProcesoDevolucion;
}>();

const emit = defineEmits<{
  finalizado: [];
}>();

const venta = computed(() => props.proceso.ventaOrigen.value);
const busquedaPrenda = props.proceso.busquedaPrenda;
const observaciones = props.proceso.observaciones;
const formaPagoCambio = props.proceso.formaPagoCambio;
const emitirCuponAlConfirmar = props.proceso.emitirCuponAlConfirmar;

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

async function confirmar(): Promise<void> {
  const resultado = await props.proceso.finalizarOperacion();
  if (resultado) emit('finalizado');
}

function subtotalLinea(cantidad: number, precio: number): number {
  return cantidad * precio;
}

function cambiarCantidadPrenda(varianteId: string, delta: number): void {
  const linea = props.proceso.lineasNuevas.value.find((ln) => ln.varianteId === varianteId);
  if (!linea) return;
  props.proceso.actualizarCantidadPrenda(varianteId, linea.cantidad + delta);
}
</script>

<template>
  <div v-if="venta" class="cambio">
    <header class="pg-cab cambio-cab" aria-label="Cambio por devolución">
      <div class="pg-cab-txt">
        <div class="pg-cab-izq">
          <RotateCcw :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
          <div>
            <p class="pg-eyebrow">Ventas · Postventa</p>
            <h1 class="pg-titulo">Cambio por devolución</h1>
            <p class="pg-sub cambio-cab-resumen">
              Venta <span class="cambio-num">{{ venta.numero }}</span>
              · {{ venta.nombreClienteMostrar }}
            </p>
          </div>
        </div>
      </div>

      <div class="cambio-cab-acciones">
        <button type="button" class="cambio-btn cambio-btn--sec" @click="proceso.volverAListado()">
          <ArrowLeft :size="16" stroke-width="2" aria-hidden="true" />
          Volver
        </button>
        <button
          type="button"
          class="cambio-btn cambio-btn--prim"
          :disabled="!proceso.puedeFinalizar.value"
          :aria-busy="proceso.registrando.value"
          @click="confirmar"
        >
          <Loader2
            v-if="proceso.registrando.value"
            :size="16"
            class="cambio-girar"
            aria-hidden="true"
          />
          <CheckCircle2 v-else :size="16" stroke-width="2" aria-hidden="true" />
          {{ proceso.registrando.value ? 'Registrando…' : 'Confirmar cambio' }}
        </button>
      </div>
    </header>

    <section class="cambio-contexto" aria-label="Datos del cliente">
      <div class="cambio-contexto-grid">
        <div class="cambio-bloque">
          <p class="cambio-bloque-etiq">Cliente</p>
          <p
            class="cambio-bloque-valor"
            :class="{ 'cambio-bloque-valor--cf': !venta.clienteId }"
          >
            {{ venta.nombreClienteMostrar }}
          </p>
          <p v-if="venta.documentoClienteMostrar.trim()" class="cambio-bloque-det lv-mono">
            {{ venta.documentoClienteMostrar }}
          </p>
        </div>
        <div class="cambio-bloque cambio-bloque--dev">
          <p class="cambio-bloque-etiq">Crédito por devolución</p>
          <p class="cambio-bloque-valor cambio-bloque-valor--dev lv-mono">
            −{{ formatoPeso.format(proceso.subtotalDevolucion.value) }}
          </p>
        </div>
      </div>
    </section>

    <div class="cambio-cuerpo">
      <section class="cambio-ingreso" aria-labelledby="cambio-titulo-ingreso">
        <h2 id="cambio-titulo-ingreso" class="cambio-seccion-tit">Agregar prendas nuevas</h2>

        <label class="cambio-campo" for="cambio-inp-buscar">
          <span class="cambio-campo-etiq">Buscar artículo</span>
          <div class="cambio-busq-wrap">
            <Search class="cambio-busq-ico" :size="18" stroke-width="2" aria-hidden="true" />
            <input
              id="cambio-inp-buscar"
              v-model="busquedaPrenda"
              type="search"
              class="cambio-inp cambio-inp--busq"
              placeholder="Nombre, talle, código…"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
        </label>

        <p v-if="!busquedaPrenda.trim()" class="cambio-ayuda">
          Buscá y tocá una fila para sumarla al cambio.
        </p>

        <ul
          v-else-if="proceso.resultadosPrenda.value.length"
          class="cambio-resultados"
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          <li v-for="fila in proceso.resultadosPrenda.value" :key="fila.variante.id">
            <button
              type="button"
              class="cambio-res-fila"
              role="option"
              @click="proceso.agregarPrenda(fila)"
            >
              <span class="cambio-res-nom">{{ fila.nombreLinea }}</span>
              <span class="cambio-res-precio lv-mono">{{ formatoPeso.format(fila.precioUnitario) }}</span>
            </button>
          </li>
        </ul>

        <p v-else class="cambio-ayuda cambio-ayuda--vacio">Sin coincidencias con stock disponible.</p>
      </section>

      <section class="cambio-detalle" aria-labelledby="cambio-titulo-detalle">
        <h2 id="cambio-titulo-detalle" class="cambio-seccion-tit">Detalle del cambio</h2>

        <div class="cambio-tabla-wrap">
          <table class="cambio-tabla">
            <colgroup>
              <col class="cambio-col-desc" />
              <col class="cambio-col-cant" />
              <col class="cambio-col-pu" />
              <col class="cambio-col-sub" />
              <col class="cambio-col-acc" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" class="cambio-col-desc">Artículo</th>
                <th scope="col" class="cambio-col-cant">Cant.</th>
                <th scope="col" class="cambio-col-pu">P. unit.</th>
                <th scope="col" class="cambio-col-sub">Importe</th>
                <th class="cambio-col-acc" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              <tr class="cambio-grupo">
                <td colspan="5">Prendas devueltas</td>
              </tr>
              <tr
                v-for="ln in proceso.lineasDevolucion.value"
                :key="ln.ventaLineaId"
                class="cambio-fila cambio-fila--dev"
              >
                <td class="cambio-col-desc">
                  <span class="cambio-nom">{{ ln.nombre }}</span>
                  <span class="cambio-meta-movil lv-mono">
                    {{ ln.cantidad }} × {{ formatoPeso.format(ln.precioUnitario) }}
                  </span>
                </td>
                <td class="cambio-col-cant">
                  <span class="cambio-cant-fija lv-mono">{{ ln.cantidad }}</span>
                </td>
                <td class="cambio-col-pu">
                  <span class="cambio-valor lv-mono">{{ formatoPeso.format(ln.precioUnitario) }}</span>
                </td>
                <td class="cambio-col-sub">
                  <span class="cambio-valor cambio-valor--dev lv-mono">
                    −{{ formatoPeso.format(subtotalLinea(ln.cantidad, ln.precioUnitario)) }}
                  </span>
                </td>
                <td class="cambio-col-acc" />
              </tr>

              <tr class="cambio-grupo">
                <td colspan="5">Prendas nuevas</td>
              </tr>
              <tr v-if="proceso.lineasNuevas.value.length === 0" class="cambio-fila-vacia">
                <td colspan="5">Sin prendas nuevas. Podés confirmar solo la devolución o emitir un cupón.</td>
              </tr>
              <tr
                v-for="ln in proceso.lineasNuevas.value"
                :key="ln.varianteId"
                class="cambio-fila"
              >
                <td class="cambio-col-desc">
                  <span class="cambio-nom">{{ ln.nombre }}</span>
                  <span class="cambio-meta-movil lv-mono">
                    {{ formatoPeso.format(ln.precioUnitario) }} c/u
                  </span>
                </td>
                <td class="cambio-col-cant">
                  <span class="cambio-cant-ctrl">
                    <button
                      type="button"
                      class="cambio-pm"
                      :aria-label="`Menos ${ln.nombre}`"
                      @click="cambiarCantidadPrenda(ln.varianteId, -1)"
                    >
                      <Minus :size="15" stroke-width="2" aria-hidden="true" />
                    </button>
                    <span class="cambio-cant-num">{{ ln.cantidad }}</span>
                    <button
                      type="button"
                      class="cambio-pm"
                      :aria-label="`Más ${ln.nombre}`"
                      @click="cambiarCantidadPrenda(ln.varianteId, 1)"
                    >
                      <Plus :size="15" stroke-width="2" aria-hidden="true" />
                    </button>
                  </span>
                </td>
                <td class="cambio-col-pu">
                  <span class="cambio-valor lv-mono">{{ formatoPeso.format(ln.precioUnitario) }}</span>
                </td>
                <td class="cambio-col-sub">
                  <span class="cambio-valor lv-mono">
                    {{ formatoPeso.format(subtotalLinea(ln.cantidad, ln.precioUnitario)) }}
                  </span>
                </td>
                <td class="cambio-col-acc">
                  <button
                    type="button"
                    class="cambio-quitar"
                    :aria-label="`Quitar ${ln.nombre}`"
                    @click="proceso.quitarPrenda(ln.varianteId)"
                  >
                    <Trash2 :size="15" stroke-width="2" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <footer class="cambio-pie" aria-label="Totales y confirmación">
      <div class="cambio-pie-grid">
        <div class="cambio-pie-izq">
          <div v-if="proceso.haySaldoAPagar.value" class="cambio-campo">
            <label class="cambio-campo-etiq" for="cambio-forma-pago">Forma de pago del saldo</label>
            <select id="cambio-forma-pago" v-model="formaPagoCambio" class="cambio-inp cambio-sel">
              <option v-for="fp in FORMAS_PAGO" :key="fp.id" :value="fp.id">{{ fp.etiqueta }}</option>
            </select>
          </div>

          <label
            v-if="proceso.haySaldoAFavor.value"
            class="cambio-cupon-opt"
            for="cambio-emitir-cupon"
          >
            <input
              id="cambio-emitir-cupon"
              v-model="emitirCuponAlConfirmar"
              type="checkbox"
            />
            <span>
              Emitir cupón por
              <strong>{{ formatoPeso.format(proceso.saldoAFavor.value) }}</strong>
              al confirmar
            </span>
          </label>

          <label class="cambio-obs" for="cambio-observaciones">
            <span class="cambio-obs-etiq">Observaciones</span>
            <textarea
              id="cambio-observaciones"
              v-model="observaciones"
              class="cambio-obs-inp"
              rows="2"
              maxlength="1000"
              placeholder="Notas sobre el cambio (opcional)"
            />
          </label>

          <p v-if="proceso.mensajeError.value" class="lv-alerta-carga cambio-error" role="alert">
            {{ proceso.mensajeError.value }}
          </p>
        </div>

        <div class="cambio-total-bloque" aria-live="polite">
          <div class="cambio-total-filas">
            <div class="cambio-total-fila">
              <span class="cambio-total-fila-etq">Crédito devolución</span>
              <span class="cambio-total-fila-val cambio-total-fila-val--dev lv-mono">
                −{{ formatoPeso.format(proceso.subtotalDevolucion.value) }}
              </span>
            </div>
            <div class="cambio-total-fila">
              <span class="cambio-total-fila-etq">Prendas nuevas</span>
              <span class="cambio-total-fila-val lv-mono">
                {{ formatoPeso.format(proceso.subtotalNuevasPrendas.value) }}
              </span>
            </div>
          </div>

          <p v-if="proceso.haySaldoAPagar.value" class="cambio-total-etiq">Saldo a cobrar</p>
          <p v-else-if="proceso.haySaldoAFavor.value" class="cambio-total-etiq">Saldo a favor</p>
          <p v-else class="cambio-total-etiq">Resultado</p>

          <p
            class="cambio-total-val lv-mono"
            :class="{
              'cambio-total-val--pago': proceso.haySaldoAPagar.value,
              'cambio-total-val--favor': proceso.haySaldoAFavor.value,
            }"
          >
            <template v-if="proceso.haySaldoAPagar.value">
              {{ formatoPeso.format(proceso.saldoAPagar.value) }}
            </template>
            <template v-else-if="proceso.haySaldoAFavor.value">
              {{ formatoPeso.format(proceso.saldoAFavor.value) }}
            </template>
            <template v-else>$ 0</template>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.cambio {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-fondo-elevado);
}

.cambio-cab {
  flex-shrink: 0;
}

.cambio-cab-resumen {
  margin-top: 0.35rem;
  max-width: none;
}

.cambio-num {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  font-size: 0.82em;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-acento-hover);
  background: var(--color-acento-suave);
  border: 1px solid var(--color-acento-borde);
}

.cambio-cab-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-self: end;
}

@media (width >= 900px) {
  .cambio-cab-acciones {
    justify-self: end;
  }
}

.cambio-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radio-control);
  font-size: 0.86rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.cambio-btn--sec {
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
  border-color: var(--color-borde);
}

.cambio-btn--sec:hover {
  color: var(--color-texto);
  background: var(--color-hover-neutro);
}

.cambio-btn--prim {
  color: var(--color-texto-inverso, #fff);
  background: var(--color-acento);
  border-color: var(--color-acento-borde);
}

.cambio-btn--prim:hover:not(:disabled) {
  filter: brightness(1.05);
}

.cambio-btn--prim:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cambio-contexto {
  flex-shrink: 0;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cambio-contexto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
}

.cambio-bloque-etiq {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cambio-bloque-valor {
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
}

.cambio-bloque-valor--cf {
  font-style: italic;
  color: var(--color-texto-suave);
}

.cambio-bloque-det {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.cambio-bloque-valor--dev {
  color: var(--color-peligro);
  font-weight: 700;
}

.cambio-cuerpo {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (min-width: 900px) {
  .cambio-cuerpo {
    flex-direction: row;
  }

  .cambio-ingreso {
    flex: 0 0 min(22rem, 32%);
    max-width: 22rem;
    border-bottom: none;
    border-right: 1px solid var(--color-borde);
    overflow: auto;
  }
}

.cambio-ingreso {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.cambio-seccion-tit {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cambio-campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cambio-campo-etiq {
  font-size: 0.78rem;
  color: var(--color-texto-suave);
}

.cambio-inp {
  width: 100%;
  min-height: 2.35rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
}

.cambio-inp:focus {
  outline: none;
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 2px var(--color-acento-suave);
}

.cambio-sel {
  cursor: pointer;
}

.cambio-busq-wrap {
  position: relative;
}

.cambio-busq-ico {
  position: absolute;
  left: 0.55rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-texto-apagado);
  pointer-events: none;
}

.cambio-inp--busq {
  padding-left: 2.1rem;
}

.cambio-ayuda {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-texto-apagado);
}

.cambio-ayuda--vacio {
  color: var(--color-texto-suave);
}

.cambio-resultados {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: min(14rem, 40vh);
  overflow: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
}

.cambio-res-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: none;
  border-bottom: 1px solid var(--color-borde);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.cambio-res-fila:last-child {
  border-bottom: none;
}

.cambio-res-fila:hover {
  background: var(--color-fila-hover);
}

.cambio-res-nom {
  font-size: 0.84rem;
  font-weight: 500;
  line-height: 1.35;
}

.cambio-res-precio {
  font-size: 0.78rem;
  color: var(--color-texto-suave);
  flex-shrink: 0;
}

.cambio-detalle {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  padding: 0.85rem 1rem;
  overflow: hidden;
}

.cambio-tabla-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
}

.cambio-tabla {
  width: 100%;
  min-width: 32rem;
  border-collapse: collapse;
  font-size: 0.84rem;
  table-layout: fixed;
}

.cambio-tabla thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-fondo-cabecera);
}

.cambio-tabla th {
  padding: 0.5rem 0.65rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
  border-bottom: 1px solid var(--color-borde);
}

.cambio-tabla th.cambio-col-cant,
.cambio-tabla th.cambio-col-pu,
.cambio-tabla th.cambio-col-sub {
  text-align: right;
}

.cambio-tabla td {
  padding: 0.55rem 0.65rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
  overflow: hidden;
}

.cambio-grupo td {
  padding: 0.4rem 0.65rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-elevado);
  border-bottom: 1px solid var(--color-borde);
}

.cambio-fila-vacia td {
  padding: 1.25rem 1rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.82rem;
  line-height: 1.45;
}

.cambio-fila--dev .cambio-nom {
  color: var(--color-peligro);
}

.cambio-col-desc {
  width: 38%;
  min-width: 7rem;
}

.cambio-col-cant {
  width: 7.5rem;
}

.cambio-col-pu,
.cambio-col-sub {
  width: 6.75rem;
}

.cambio-col-acc {
  width: 2.5rem;
}

.cambio-nom {
  display: block;
  font-weight: 500;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cambio-meta-movil {
  display: none;
  margin-top: 0.15rem;
  font-size: 0.74rem;
  color: var(--color-texto-apagado);
}

.cambio-valor {
  display: block;
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cambio-valor--dev {
  color: var(--color-peligro);
  font-weight: 600;
}

.cambio-col-cant {
  text-align: center;
}

.cambio-cant-fija {
  display: inline-block;
  min-width: 1.5rem;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cambio-cant-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.15rem;
  border-radius: 999px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.cambio-pm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.65rem;
  height: 1.65rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-texto-suave);
  cursor: pointer;
}

.cambio-pm:hover {
  color: var(--color-texto);
  background: var(--color-hover-neutro);
}

.cambio-cant-num {
  min-width: 1.5rem;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cambio-quitar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  padding: 0;
  border: none;
  border-radius: var(--radio-control);
  background: transparent;
  color: var(--color-texto-apagado);
  cursor: pointer;
}

.cambio-quitar:hover {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
}

.cambio-pie {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cambio-pie-grid {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .cambio-pie-grid {
    grid-template-columns: 1fr min(18rem, 42%);
    align-items: end;
  }
}

.cambio-pie-izq {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}

.cambio-btn-cupon {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: flex-start;
  min-height: 2.35rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--color-acento-borde);
  border-radius: var(--radio-control);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.cambio-btn-cupon:hover {
  filter: brightness(1.05);
}

.cambio-cupon-opt {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  font-size: 0.86rem;
  line-height: 1.45;
  cursor: pointer;
}

.cambio-cupon-opt input {
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.cambio-obs {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.cambio-obs-etiq {
  font-size: 0.78rem;
  color: var(--color-texto-suave);
}

.cambio-obs-inp {
  width: 100%;
  min-height: 2.5rem;
  max-height: 5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  font: inherit;
  resize: vertical;
}

.cambio-obs-inp:focus {
  outline: none;
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 2px var(--color-acento-suave);
}

.cambio-error {
  margin: 0;
}

.cambio-total-bloque {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-acento-borde);
  background: linear-gradient(
    135deg,
    var(--color-acento-suave) 0%,
    var(--color-fondo-elevado) 100%
  );
}

.cambio-total-filas {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.35rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--color-borde);
}

.cambio-total-fila {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  width: 100%;
  font-size: 0.78rem;
}

.cambio-total-fila-etq {
  color: var(--color-texto-suave);
}

.cambio-total-fila-val {
  font-weight: 600;
}

.cambio-total-fila-val--dev {
  color: var(--color-peligro);
}

.cambio-total-etiq {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cambio-total-val {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-acento-hover);
}

.cambio-total-val--pago {
  color: var(--color-acento-hover);
}

.cambio-total-val--favor {
  color: var(--color-exito);
}

.lv-mono {
  font-variant-numeric: tabular-nums;
}

.cambio-girar {
  animation: cambio-girar 0.8s linear infinite;
}

@keyframes cambio-girar {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .cambio-col-pu,
  .cambio-tabla th.cambio-col-pu,
  .cambio-tabla col.cambio-col-pu {
    display: none;
  }

  .cambio-meta-movil {
    display: block;
  }

  .cambio-tabla {
    min-width: 0;
    table-layout: auto;
  }

  .cambio-col-desc {
    width: auto;
  }

  .cambio-col-sub {
    width: 6.5rem;
  }
}
</style>
