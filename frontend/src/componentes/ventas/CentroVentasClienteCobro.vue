<script setup lang="ts">
import { FORMAS_PAGO } from '../../datos/formasPago';
import { usarCentroVentasContexto } from './centroVentasContexto';

const {
  textoBusquedaCliente,
  desplegableClienteAbierto,
  clienteId,
  consumidorFinalElegido,
  esConsumidorFinal,
  mostrarOpcionConsumidorFinal,
  clientesSugeridos,
  consumidorFinalDocumento,
  consumidorFinalNombreApellido,
  nombreClienteMostrar,
  formaPago,
  puedeCuentaCorriente,
  creditoDisponibleCliente,
  saldoDeudorClienteSeleccionado,
  tieneLimiteCuentaCorriente,
  excedeCreditoCuentaCorriente,
  abrirDesplegableCliente,
  cerrarDesplegableCliente,
  alEscribirBusquedaCliente,
  seleccionarConsumidorFinal,
  seleccionarClienteRegistrado,
  alEscribirDocumentoConsumidorFinal,
} = usarCentroVentasContexto();

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

let idCierreDesplegable: ReturnType<typeof setTimeout> | null = null;

function alEnfocarCliente() {
  if (idCierreDesplegable) {
    clearTimeout(idCierreDesplegable);
    idCierreDesplegable = null;
  }
  abrirDesplegableCliente();
}

function alDesenfocarCliente() {
  idCierreDesplegable = setTimeout(() => {
    cerrarDesplegableCliente();
  }, 200);
}

function elegirConsumidorFinal() {
  if (idCierreDesplegable) {
    clearTimeout(idCierreDesplegable);
    idCierreDesplegable = null;
  }
  seleccionarConsumidorFinal();
}

function elegirCliente(id: string) {
  if (idCierreDesplegable) {
    clearTimeout(idCierreDesplegable);
    idCierreDesplegable = null;
  }
  seleccionarClienteRegistrado(id);
}

function alPegarDocumento(event: ClipboardEvent) {
  event.preventDefault();
  alEscribirDocumentoConsumidorFinal(event.clipboardData?.getData('text') ?? '');
}
</script>

<template>
  <section class="cv-contexto" aria-labelledby="cv-titulo-contexto">
    <h2 id="cv-titulo-contexto" class="cv-seccion-tit">Cliente y cobro</h2>

    <div class="cv-contexto-grid">
      <div class="cv-bloque">
        <p class="cv-bloque-etiq">Receptor</p>
        <p class="cv-bloque-valor" :class="{ 'cv-bloque-valor--cf': esConsumidorFinal }">
          {{ nombreClienteMostrar }}
        </p>

        <div class="cv-campo">
          <label class="cv-campo-etiq" for="cv-inp-cliente">Cliente</label>
          <div class="cv-combo">
            <input
              id="cv-inp-cliente"
              v-model="textoBusquedaCliente"
              type="text"
              class="cv-inp"
              placeholder="Nombre, documento o «consumidor final»…"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="cv-lista-clientes"
              :aria-expanded="desplegableClienteAbierto"
              @focus="alEnfocarCliente"
              @blur="alDesenfocarCliente"
              @input="alEscribirBusquedaCliente"
            />

            <ul
              v-show="desplegableClienteAbierto"
              id="cv-lista-clientes"
              class="cv-combo-lista"
              role="listbox"
              aria-label="Opciones de cliente"
              @mousedown.prevent
            >
              <li v-if="mostrarOpcionConsumidorFinal" role="presentation">
                <button
                  type="button"
                  class="cv-combo-opc"
                  :class="{ 'cv-combo-opc--on': esConsumidorFinal && consumidorFinalElegido }"
                  role="option"
                  :aria-selected="esConsumidorFinal && consumidorFinalElegido"
                  @pointerdown.prevent.stop="elegirConsumidorFinal"
                  @click.prevent.stop="elegirConsumidorFinal"
                >
                  <span class="cv-combo-opc-nom">Consumidor final</span>
                  <span class="cv-combo-opc-det">Venta sin cliente registrado</span>
                </button>
              </li>

              <li v-for="c in clientesSugeridos" :key="c.id" role="presentation">
                <button
                  type="button"
                  class="cv-combo-opc"
                  :class="{ 'cv-combo-opc--on': clienteId === c.id }"
                  role="option"
                  :aria-selected="clienteId === c.id"
                  @pointerdown.prevent.stop="elegirCliente(c.id)"
                  @click.prevent.stop="elegirCliente(c.id)"
                >
                  <span class="cv-combo-opc-nom">{{ c.nombre }}</span>
                  <span class="cv-combo-opc-det">{{ c.documento }}</span>
                </button>
              </li>

              <li
                v-if="!mostrarOpcionConsumidorFinal && clientesSugeridos.length === 0"
                class="cv-combo-vacio"
                role="presentation"
              >
                Sin coincidencias
              </li>
            </ul>
          </div>
        </div>

        <div v-if="esConsumidorFinal" class="cv-cf-campos">
          <label class="cv-campo" for="cv-cf-documento">
            <span class="cv-campo-etiq">Documento</span>
            <input
              id="cv-cf-documento"
              :value="consumidorFinalDocumento"
              type="text"
              class="cv-inp"
              placeholder="DNI, CUIT, etc."
              autocomplete="off"
              inputmode="numeric"
              @input="alEscribirDocumentoConsumidorFinal(($event.target as HTMLInputElement).value)"
              @paste="alPegarDocumento"
            />
          </label>

          <label class="cv-campo" for="cv-cf-nombre">
            <span class="cv-campo-etiq">Nombre y apellido</span>
            <input
              id="cv-cf-nombre"
              v-model="consumidorFinalNombreApellido"
              type="text"
              class="cv-inp"
              placeholder="Opcional"
              autocomplete="name"
            />
          </label>
        </div>
      </div>

      <div class="cv-bloque">
        <label class="cv-campo" for="cv-sel-pago">
          <span class="cv-campo-etiq">Forma de pago</span>
          <select id="cv-sel-pago" v-model="formaPago" class="cv-inp cv-sel">
            <option
              v-for="fp in FORMAS_PAGO"
              :key="fp.id"
              :value="fp.id"
              :disabled="fp.id === 'CUENTA_CORRIENTE' && !puedeCuentaCorriente"
            >
              {{ fp.etiqueta }}
            </option>
          </select>
        </label>

        <p v-if="!puedeCuentaCorriente" class="cv-ayuda">
          Cuenta corriente disponible solo con un cliente registrado que tenga crédito habilitado.
        </p>

        <div
          v-else-if="formaPago === 'CUENTA_CORRIENTE' && tieneLimiteCuentaCorriente"
          class="cv-credito"
          :class="{ 'cv-credito--alerta': excedeCreditoCuentaCorriente }"
          role="status"
        >
          <div class="cv-credito-item">
            <span class="cv-credito-etiq">Saldo deudor</span>
            <span class="cv-credito-val">{{ formatoPeso.format(saldoDeudorClienteSeleccionado) }}</span>
          </div>
          <div class="cv-credito-item">
            <span class="cv-credito-etiq">Crédito disponible</span>
            <span class="cv-credito-val">{{ formatoPeso.format(creditoDisponibleCliente ?? 0) }}</span>
          </div>
          <p v-if="excedeCreditoCuentaCorriente" class="cv-credito-alerta">
            El total del ticket supera el crédito disponible del cliente.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cv-contexto {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-borde);
  background: rgba(0, 0, 0, 0.12);
  overflow: visible;
}

.cv-seccion-tit {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-contexto-grid {
  display: grid;
  gap: 0.85rem;
}

.cv-bloque {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  overflow: visible;
}

.cv-bloque-etiq {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-bloque-valor {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
}

.cv-bloque-valor--cf {
  color: var(--color-texto-suave);
  font-weight: 500;
}

.cv-campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cv-campo-etiq {
  font-size: 0.78rem;
  color: var(--color-texto-suave);
}

.cv-inp {
  width: 100%;
  min-height: 2.35rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
}

.cv-inp:focus {
  outline: none;
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 2px var(--color-acento-suave);
}

.cv-sel {
  cursor: pointer;
}

.cv-combo {
  position: relative;
  overflow: visible;
}

.cv-combo-lista {
  position: absolute;
  z-index: 30;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  max-height: min(14rem, 40vh);
  overflow: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
}

.cv-combo-opc {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  width: 100%;
  padding: 0.5rem 0.55rem;
  border: none;
  border-radius: calc(var(--radio-control) - 2px);
  background: transparent;
  color: inherit;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.cv-combo-opc:hover,
.cv-combo-opc--on {
  background: var(--color-acento-suave);
}

.cv-combo-opc-nom {
  font-size: 0.84rem;
  font-weight: 600;
}

.cv-combo-opc-det {
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
  line-height: 1.3;
}

.cv-combo-vacio {
  padding: 0.65rem 0.55rem;
  font-size: 0.8rem;
  color: var(--color-texto-apagado);
  text-align: center;
}

.cv-cf-campos {
  display: grid;
  gap: 0.55rem;
}

.cv-ayuda {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-texto-apagado);
}

.cv-credito {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 0.65rem;
  padding: 0.62rem 0.72rem;
  border-radius: var(--radio-control);
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.08);
}

.cv-credito--alerta {
  border-color: rgba(251, 113, 133, 0.42);
  background: rgba(251, 113, 133, 0.1);
}

.cv-credito-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.cv-credito-etiq {
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-credito-val {
  font-size: 0.92rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cv-credito-alerta {
  grid-column: 1 / -1;
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-peligro);
}

@media (min-width: 801px) {
  .cv-contexto-grid {
    grid-template-columns: 1.25fr 0.85fr;
    gap: 0.75rem;
  }

  .cv-cf-campos {
    grid-template-columns: 1fr 1.2fr;
    gap: 0.65rem;
  }
}
</style>
