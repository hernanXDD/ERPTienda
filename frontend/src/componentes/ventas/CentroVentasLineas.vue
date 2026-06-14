<script setup lang="ts">
import { Minus, Plus, Trash2 } from 'lucide-vue-next';
import { usarCentroVentasContexto } from './centroVentasContexto';

const { lineas, subtotalLinea, cambiarCantidad, quitarLinea, vaciarLineas } =
  usarCentroVentasContexto();

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});
</script>

<template>
  <section class="cv-lineas" aria-labelledby="cv-titulo-lineas">
    <div class="cv-lineas-cab">
      <h2 id="cv-titulo-lineas" class="cv-seccion-tit">Detalle del ticket</h2>
      <button
        v-if="lineas.length"
        type="button"
        class="cv-vaciar"
        @click="vaciarLineas"
      >
        Vaciar todo
      </button>
    </div>

    <div class="cv-tabla-wrap">
      <table class="cv-tabla">
        <thead>
          <tr>
            <th scope="col" class="cv-col-desc">Artículo</th>
            <th scope="col" class="cv-col-cant">Cant.</th>
            <th scope="col" class="cv-col-pu">P. unit.</th>
            <th scope="col" class="cv-col-sub">Importe</th>
            <th class="cv-col-acc" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="lineas.length === 0">
            <td colspan="5" class="cv-vacio">
              Sin productos. Usá el lector o la búsqueda para agregar líneas.
            </td>
          </tr>
          <tr v-for="l in lineas" :key="l.varianteId" class="cv-fila">
            <td class="cv-col-desc">
              <span class="cv-nom">{{ l.nombre }}</span>
            </td>
            <td class="cv-col-cant">
              <span class="cv-cant-ctrl">
                <button
                  type="button"
                  class="cv-pm"
                  :aria-label="`Menos ${l.nombre}`"
                  @click="cambiarCantidad(l.varianteId, -1)"
                >
                  <Minus :size="15" stroke-width="2" aria-hidden="true" />
                </button>
                <span class="cv-cant-num">{{ l.cantidad }}</span>
                <button
                  type="button"
                  class="cv-pm"
                  :aria-label="`Más ${l.nombre}`"
                  @click="cambiarCantidad(l.varianteId, 1)"
                >
                  <Plus :size="15" stroke-width="2" aria-hidden="true" />
                </button>
              </span>
            </td>
            <td class="cv-col-pu cv-num">{{ formatoPeso.format(l.precioUnitario) }}</td>
            <td class="cv-col-sub cv-num">{{ formatoPeso.format(subtotalLinea(l)) }}</td>
            <td class="cv-col-acc">
              <button
                type="button"
                class="cv-quitar"
                :aria-label="`Quitar ${l.nombre}`"
                @click="quitarLinea(l.varianteId)"
              >
                <Trash2 :size="15" stroke-width="2" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.cv-lineas {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  padding: 0.85rem 1rem;
  overflow: hidden;
}

.cv-lineas-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
  flex-shrink: 0;
}

.cv-seccion-tit {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-vaciar {
  padding: 0.25rem 0.55rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-peligro);
  font-size: 0.74rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.cv-vaciar:hover {
  background: var(--color-peligro-suave);
}

.cv-tabla-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
}

.cv-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.cv-tabla thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-fondo-cabecera);
}

.cv-tabla th {
  padding: 0.5rem 0.65rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
  border-bottom: 1px solid var(--color-borde);
}

.cv-tabla td {
  padding: 0.55rem 0.65rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.cv-fila:last-child td {
  border-bottom: none;
}

.cv-vacio {
  padding: 2rem 1rem !important;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.82rem;
  line-height: 1.45;
}

.cv-col-desc {
  min-width: 8rem;
}

.cv-col-cant,
.cv-col-pu,
.cv-col-sub {
  width: 1%;
  white-space: nowrap;
}

.cv-col-acc {
  width: 2.25rem;
}

.cv-nom {
  display: block;
  font-weight: 500;
  line-height: 1.35;
}

.cv-num {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.cv-cant-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.15rem;
  border-radius: 999px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.cv-pm {
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

.cv-pm:hover {
  color: var(--color-texto);
  background: var(--color-hover-neutro);
}

.cv-cant-num {
  min-width: 1.5rem;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cv-quitar {
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

.cv-quitar:hover {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
}

@media (max-width: 640px) {
  .cv-col-pu {
    display: none;
  }

  .cv-tabla th.cv-col-pu {
    display: none;
  }
}
</style>
