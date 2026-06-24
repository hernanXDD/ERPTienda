<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { ScanBarcode, Search } from 'lucide-vue-next';
import { usarCentroVentasContexto } from './centroVentasContexto';

const {
  refInputLector,
  refInputNombre,
  esMovil,
  modoProducto,
  codigoLector,
  busquedaNombre,
  varianteSeleccionadaId,
  resultadosVariante,
  setModoProducto,
  agregarPorLector,
  seleccionarVarianteNombre,
  agregarVarianteNombreSeleccionada,
} = usarCentroVentasContexto();

function enlazarLector(el: Element | ComponentPublicInstance | null) {
  refInputLector.value = el instanceof HTMLInputElement ? el : null;
}

function enlazarBusqueda(el: Element | ComponentPublicInstance | null) {
  refInputNombre.value = el instanceof HTMLInputElement ? el : null;
}

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});
</script>

<template>
  <section class="cv-ingreso" aria-labelledby="cv-titulo-ingreso">
    <h2 id="cv-titulo-ingreso" class="cv-seccion-tit">Agregar productos</h2>

    <div v-if="!esMovil" class="cv-modo" role="radiogroup" aria-label="Modo de ingreso">
      <button
        type="button"
        role="radio"
        class="cv-modo-btn"
        :class="{ 'cv-modo-btn--on': modoProducto === 'LECTOR' }"
        :aria-checked="modoProducto === 'LECTOR'"
        @click="setModoProducto('LECTOR')"
      >
        <ScanBarcode :size="17" stroke-width="2" aria-hidden="true" />
        Lector
      </button>
      <button
        type="button"
        role="radio"
        class="cv-modo-btn"
        :class="{ 'cv-modo-btn--on': modoProducto === 'NOMBRE' }"
        :aria-checked="modoProducto === 'NOMBRE'"
        @click="setModoProducto('NOMBRE')"
      >
        <Search :size="17" stroke-width="2" aria-hidden="true" />
        Buscar
      </button>
    </div>

    <div v-show="!esMovil && modoProducto === 'LECTOR'" class="cv-panel cv-panel--lector">
      <div class="cv-ingreso-fila">
        <label class="cv-campo cv-campo--barra" for="cv-inp-lector">
          <span class="cv-campo-etiq">Código de barras</span>
          <input
            id="cv-inp-lector"
            :ref="enlazarLector"
            v-model="codigoLector"
            type="text"
            class="cv-inp cv-inp--lector"
            placeholder="Escanear o escribir…"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="done"
            @keydown.enter.prevent="agregarPorLector"
          />
        </label>
        <span class="cv-btn-agregar cv-btn-agregar--reserva" aria-hidden="true">
          Agregar al ticket
        </span>
      </div>
      <p class="cv-ayuda cv-ayuda--barra">
        El lector envía <kbd>Enter</kbd> al finalizar el código.
      </p>
    </div>

    <div v-show="esMovil || modoProducto === 'NOMBRE'" class="cv-panel cv-panel--buscar">
      <div class="cv-ingreso-fila">
        <label class="cv-campo cv-campo--barra" for="cv-inp-buscar">
          <span class="cv-campo-etiq">Buscar artículo</span>
          <div class="cv-busq-wrap">
            <Search class="cv-busq-ico" :size="18" stroke-width="2" aria-hidden="true" />
            <input
              id="cv-inp-buscar"
              :ref="enlazarBusqueda"
              v-model="busquedaNombre"
              type="search"
              class="cv-inp cv-inp--busq"
              placeholder="Nombre, marca, talle…"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
        </label>

        <button
          type="button"
          class="cv-btn-agregar"
          :disabled="!varianteSeleccionadaId"
          @click="agregarVarianteNombreSeleccionada"
        >
          Agregar al ticket
        </button>
      </div>

      <p v-if="!busquedaNombre.trim()" class="cv-ayuda cv-ayuda--barra">
        Escribí para buscar y elegí un artículo en la lista.
      </p>

      <ul
        v-else-if="resultadosVariante.length"
        class="cv-resultados"
        role="listbox"
        aria-label="Resultados de búsqueda"
      >
        <li v-for="f in resultadosVariante" :key="f.variante.id">
          <button
            type="button"
            class="cv-res-fila"
            :class="{ 'cv-res-fila--sel': varianteSeleccionadaId === f.variante.id }"
            role="option"
            :aria-selected="varianteSeleccionadaId === f.variante.id"
            @click="seleccionarVarianteNombre(f)"
          >
            <span class="cv-res-txt">
              <span class="cv-res-nom">{{ f.nombreLinea }}</span>
              <span v-if="f.variante.codigoBarras" class="cv-res-cod">{{
                f.variante.codigoBarras
              }}</span>
            </span>
            <span class="cv-res-pre">{{ formatoPeso.format(f.precioUnitario) }}</span>
          </button>
        </li>
      </ul>

      <p v-else class="cv-ayuda cv-ayuda--vacio">Sin coincidencias.</p>
    </div>
  </section>
</template>

<style scoped>
.cv-ingreso {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.cv-seccion-tit {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-modo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  padding: 0.2rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cv-modo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.2rem;
  border: none;
  border-radius: calc(var(--radio-control) - 2px);
  background: transparent;
  color: var(--color-texto-apagado);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.cv-modo-btn--on {
  color: var(--color-texto);
  background: var(--color-acento-suave);
}

.cv-panel {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-height: 0;
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

.cv-inp--lector {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.cv-busq-wrap {
  position: relative;
}

.cv-busq-ico {
  position: absolute;
  left: 0.55rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-texto-apagado);
  pointer-events: none;
}

.cv-inp--busq {
  padding-left: 2.1rem;
}

.cv-ayuda {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-texto-apagado);
}

.cv-ayuda--vacio {
  color: var(--color-peligro);
}

.cv-resultados {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: min(14rem, 40vh);
  overflow: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
}

.cv-res-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: none;
  border-bottom: 1px solid var(--color-borde);
  background: transparent;
  color: inherit;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.cv-res-fila:last-child {
  border-bottom: none;
}

.cv-res-fila:hover,
.cv-res-fila--sel {
  background: var(--color-acento-suave);
}

.cv-res-txt {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.cv-res-nom {
  font-size: 0.84rem;
  font-weight: 500;
}

.cv-res-cod {
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
}

.cv-res-pre {
  flex-shrink: 0;
  font-size: 0.82rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cv-btn-agregar {
  min-height: 2.35rem;
  border: 1px solid var(--color-acento-borde);
  border-radius: var(--radio-control);
  background: var(--color-acento-suave);
  color: var(--color-texto);
  font-size: 0.84rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.cv-btn-agregar:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cv-btn-agregar--reserva {
  display: none;
}

.cv-ingreso-fila {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.cv-ingreso-fila .cv-campo {
  flex: 1;
  min-width: 0;
}

.cv-ingreso-fila .cv-btn-agregar {
  flex-shrink: 0;
  align-self: stretch;
  white-space: nowrap;
}

@media (min-width: 900px) {
  .cv-ingreso {
    display: grid;
    grid-template-columns: auto auto minmax(14rem, 1fr) auto;
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: 0.75rem;
    row-gap: 0.45rem;
    padding: 0.6rem 1rem;
  }

  .cv-seccion-tit {
    grid-column: 1;
    grid-row: 1;
    white-space: nowrap;
  }

  .cv-modo {
    display: inline-flex;
    grid-column: 2;
    grid-row: 1;
    width: auto;
    gap: 0.2rem;
  }

  .cv-modo-btn {
    min-width: 5.5rem;
    min-height: 2.05rem;
    padding: 0 0.7rem;
  }

  .cv-panel--lector,
  .cv-panel--buscar {
    display: contents;
  }

  .cv-ingreso-fila {
    display: contents;
  }

  .cv-btn-agregar--reserva {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    visibility: hidden;
    pointer-events: none;
  }

  .cv-campo--barra {
    grid-column: 3;
    grid-row: 1;
    gap: 0;
  }

  .cv-campo-etiq {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .cv-panel--lector .cv-ayuda--barra,
  .cv-panel--buscar .cv-ayuda--barra,
  .cv-panel--buscar .cv-resultados,
  .cv-panel--buscar .cv-ayuda--vacio {
    grid-column: 3 / 5;
    grid-row: 2;
  }

  .cv-panel--lector .cv-ayuda--barra,
  .cv-panel--buscar .cv-ayuda--barra {
    align-self: start;
    font-size: 0.72rem;
    line-height: 1.35;
    margin: 0;
  }

  .cv-panel--buscar .cv-btn-agregar:not(.cv-btn-agregar--reserva),
  .cv-panel--lector .cv-btn-agregar--reserva {
    grid-column: 4;
    grid-row: 1;
    justify-self: end;
    align-self: center;
    min-height: 2.35rem;
    padding: 0 0.85rem;
  }

  .cv-panel--buscar .cv-resultados {
    max-height: min(11rem, 32vh);
  }

  .cv-panel--buscar .cv-ayuda--vacio {
    margin: 0;
  }
}
</style>
