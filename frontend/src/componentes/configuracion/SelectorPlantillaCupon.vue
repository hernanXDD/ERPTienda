<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { normalizarTemaClaroNegocio } from '../../stores/tema';
import { useNegocioStore } from '../../stores/negocio';
import {
  CATALOGO_PLANTILLAS_CUPON,
  type PlantillaCupon,
} from '../../tipos/plantillaCupon';

const props = defineProps<{
  modelValue: PlantillaCupon;
  deshabilitado?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [valor: PlantillaCupon];
}>();

const negocioStore = useNegocioStore();
const { negocio, logoDataUrl } = storeToRefs(negocioStore);

onMounted(() => {
  void negocioStore.asegurarCargado();
  void negocioStore.asegurarLogoDataUrl();
});

const temaVistaPrevia = computed(() => normalizarTemaClaroNegocio(negocio.value ?? {}));

const inicialesNegocio = computed(() => {
  const nombre = negocio.value?.nombre ?? '';
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return 'NT';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return `${palabras[0][0] ?? ''}${palabras[1][0] ?? ''}`.toUpperCase();
});

function seleccionar(id: PlantillaCupon): void {
  if (props.deshabilitado) return;
  emit('update:modelValue', id);
}
</script>

<template>
  <div class="cfg-cup-plantillas" role="radiogroup" aria-label="Plantilla del cupón">
    <button
      v-for="plantilla in CATALOGO_PLANTILLAS_CUPON"
      :key="plantilla.id"
      type="button"
      class="cfg-cup-opc"
      :class="{ 'cfg-cup-opc--activa': modelValue === plantilla.id }"
      :aria-pressed="modelValue === plantilla.id"
      :disabled="deshabilitado"
      @click="seleccionar(plantilla.id)"
    >
      <div
        class="cfg-cup-prev cfg-cup-prev--credito"
        :class="`cfg-cup-prev--${plantilla.id}`"
        :style="{
          '--cfg-cup-acento': temaVistaPrevia.colorAcento,
          '--cfg-cup-fondo': temaVistaPrevia.colorFondo,
          '--cfg-cup-superficie': temaVistaPrevia.colorSuperficie,
          '--cfg-cup-cabecera': temaVistaPrevia.colorCabecera,
          '--cfg-cup-texto': temaVistaPrevia.colorTexto,
          '--cfg-cup-borde': temaVistaPrevia.colorBorde,
        }"
        aria-hidden="true"
      >
        <template v-if="plantilla.id === 'clasica'">
          <div class="cfg-prev-vale">
            <header class="cfg-prev-vale-cab">
              <span v-if="logoDataUrl" class="cfg-prev-logo cfg-prev-logo--md cfg-prev-logo--cab">
                <img :src="logoDataUrl" alt="" />
              </span>
              <span v-else class="cfg-prev-ini cfg-prev-ini--md cfg-prev-ini--cab">{{ inicialesNegocio }}</span>
              <span class="cfg-prev-nom cfg-prev-nom--claro">{{ negocio?.nombre || 'Tu tienda' }}</span>
            </header>
            <div class="cfg-prev-vale-cuerpo">
              <div class="cfg-prev-vale-benef">
                <span class="cfg-prev-val">$ 5.000</span>
                <span class="cfg-prev-tipo">Monto fijo</span>
              </div>
              <span class="cfg-prev-meta">Cliente · 19/07/26 · CD-00017</span>
            </div>
            <footer class="cfg-prev-vale-scan">
              <span class="cfg-prev-barcode cfg-prev-barcode--grow" />
              <span class="cfg-prev-cod">A1b2C3d4</span>
            </footer>
          </div>
        </template>

        <template v-else-if="plantilla.id === 'ticket'">
          <div class="cfg-prev-bol">
            <section class="cfg-prev-bol-izq">
              <span class="cfg-prev-bol-etiq">Cupón de descuento</span>
              <div class="cfg-prev-bol-marca">
                <span v-if="logoDataUrl" class="cfg-prev-logo cfg-prev-logo--sm">
                  <img :src="logoDataUrl" alt="" />
                </span>
                <span v-else class="cfg-prev-ini cfg-prev-ini--sm">{{ inicialesNegocio }}</span>
                <span class="cfg-prev-nom">{{ negocio?.nombre || 'Tu tienda' }}</span>
              </div>
              <span class="cfg-prev-val">15%</span>
              <div class="cfg-prev-chips">
                <span>CD-00017</span>
                <span>19/07/26</span>
                <span>Activo</span>
              </div>
            </section>
            <section class="cfg-prev-bol-der">
              <span class="cfg-prev-bol-canje">Presentar en caja</span>
              <span class="cfg-prev-barcode cfg-prev-barcode--grow" />
              <span class="cfg-prev-cod">A1b2C3d4</span>
              <span class="cfg-prev-bol-num">CD-00017</span>
            </section>
          </div>
        </template>

        <template v-else>
          <div class="cfg-prev-gift">
            <aside class="cfg-prev-gift-marca">
              <span v-if="logoDataUrl" class="cfg-prev-logo cfg-prev-logo--md cfg-prev-logo--blanco">
                <img :src="logoDataUrl" alt="" />
              </span>
              <span v-else class="cfg-prev-ini cfg-prev-ini--md cfg-prev-ini--claro">{{ inicialesNegocio }}</span>
              <span class="cfg-prev-nom cfg-prev-nom--claro cfg-prev-nom--centro">{{ negocio?.nombre || 'Tu tienda' }}</span>
              <span class="cfg-prev-val cfg-prev-val--claro">$ 5.000</span>
              <span class="cfg-prev-tipo cfg-prev-tipo--claro">Monto fijo</span>
            </aside>
            <section class="cfg-prev-gift-scan">
              <div class="cfg-prev-panel-meta">
                <span>CD-00017</span>
                <span>19/07/26</span>
              </div>
              <span class="cfg-prev-cli cfg-prev-cli--oscuro">Florencia Vega</span>
              <span class="cfg-prev-barcode cfg-prev-barcode--grow" />
              <span class="cfg-prev-cod">A1b2C3d4</span>
            </section>
          </div>
        </template>
      </div>

      <div class="cfg-cup-opc-txt">
        <span class="cfg-cup-opc-tit">
          {{ plantilla.etiqueta }}
          <Check
            v-if="modelValue === plantilla.id"
            :size="15"
            class="cfg-cup-opc-check"
            aria-hidden="true"
          />
        </span>
        <span class="cfg-cup-opc-desc">{{ plantilla.descripcion }}</span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.cfg-cup-plantillas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
}

.cfg-cup-opc {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 100%;
  padding: 0.85rem;
  border-radius: 14px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.cfg-cup-opc:hover:not(:disabled) {
  border-color: var(--color-acento-borde);
}

.cfg-cup-opc--activa {
  border-color: var(--color-acento);
  box-shadow: 0 0 0 2px var(--color-acento-suave);
}

.cfg-cup-opc:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.cfg-cup-prev {
  flex: 1;
  min-height: unset;
  padding: 0;
  border-radius: 12px;
  border: 1px solid var(--cfg-cup-borde);
  background: var(--cfg-cup-superficie);
}

.cfg-cup-prev--credito {
  aspect-ratio: 85.6 / 53.98;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  display: flex;
  background: transparent;
  border: none;
}

.cfg-prev-logo,
.cfg-prev-ini {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.18rem;
  overflow: hidden;
}

.cfg-prev-logo--md,
.cfg-prev-ini--md {
  width: 1.55rem;
  height: 1.55rem;
  font-size: 0.52rem;
  font-weight: 800;
}

.cfg-prev-logo {
  background: #fff;
}

.cfg-prev-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cfg-prev-logo--blanco {
  background: rgba(255, 255, 255, 0.95);
  padding: 0.06rem;
}

.cfg-prev-ini {
  background: var(--cfg-cup-acento);
  color: #fff;
}

.cfg-prev-ini--claro {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.cfg-prev-etiq {
  display: block;
  font-size: 0.28rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cfg-cup-texto);
  opacity: 0.55;
}

.cfg-prev-nom {
  display: block;
  font-size: 0.36rem;
  font-weight: 700;
  color: var(--cfg-cup-texto);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cfg-prev-nom--claro {
  color: #fff;
}

.cfg-prev-nom--col {
  font-size: 0.3rem;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

.cfg-prev-nom--centro {
  text-align: center;
  width: 100%;
}

.cfg-prev-val {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  color: var(--cfg-cup-acento);
}

.cfg-prev-val--oscuro {
  color: var(--cfg-cup-texto);
}

.cfg-prev-val--claro {
  color: #fff;
}

.cfg-prev-tipo {
  font-size: 0.32rem;
  font-weight: 600;
  color: var(--cfg-cup-texto);
  opacity: 0.65;
}

.cfg-prev-cli {
  font-size: 0.3rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.cfg-prev-pill {
  padding: 0.06rem 0.16rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cfg-cup-acento) 14%, #fff);
  font-size: 0.28rem;
  font-weight: 700;
  color: var(--cfg-cup-acento);
}

.cfg-prev-meta {
  font-size: 0.28rem;
  font-weight: 600;
  color: var(--cfg-cup-texto);
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cfg-prev-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.08rem;
}

.cfg-prev-chips span {
  padding: 0.05rem 0.12rem;
  border-radius: 0.12rem;
  background: var(--cfg-cup-cabecera);
  border: 1px solid var(--cfg-cup-borde);
  font-size: 0.24rem;
  font-weight: 650;
  color: var(--cfg-cup-texto);
  opacity: 0.7;
}

.cfg-prev-barcode {
  display: block;
  height: 0.75rem;
  border-radius: 0.14rem;
  background: #fff;
  border: 1px solid var(--cfg-cup-borde);
}

.cfg-prev-barcode--grow {
  flex: 1 1 auto;
  min-height: 0.85rem;
  height: auto;
}

.cfg-prev-cod {
  display: block;
  padding: 0.08rem 0.12rem;
  border-radius: 0.12rem;
  background: #fff;
  border: 1px solid var(--cfg-cup-borde);
  font-family: ui-monospace, monospace;
  font-size: 0.3rem;
  font-weight: 700;
  text-align: center;
  color: var(--cfg-cup-texto);
}

.cfg-prev-logo--sm,
.cfg-prev-ini--sm {
  width: 1.1rem;
  height: 1.1rem;
  font-size: 0.4rem;
}

.cfg-prev-logo--cab,
.cfg-prev-ini--cab {
  background: rgba(255, 255, 255, 0.95);
}

.cfg-prev-ini--cab {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.cfg-prev-tipo--claro {
  color: rgba(255, 255, 255, 0.88);
  opacity: 1;
}

.cfg-prev-cli--oscuro {
  color: var(--cfg-cup-texto);
  opacity: 0.75;
}

.cfg-prev-vale {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--cfg-cup-superficie);
  border: 1px solid var(--cfg-cup-borde);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
}

.cfg-prev-vale-cab {
  display: flex;
  align-items: center;
  gap: 0.18rem;
  flex: 0 0 24%;
  padding: 0 0.24rem;
  background: var(--cfg-cup-acento);
}

.cfg-prev-vale-cuerpo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.08rem;
  flex: 1 1 auto;
  padding: 0.18rem 0.24rem;
}

.cfg-prev-vale-benef {
  display: flex;
  align-items: baseline;
  gap: 0.12rem;
}

.cfg-prev-vale-scan {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.06rem;
  flex: 0 0 28%;
  padding: 0.16rem 0.22rem;
  background: #fff;
  border-top: 1px solid var(--cfg-cup-borde);
}

.cfg-prev-gift {
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14);
}

.cfg-prev-gift-marca {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
  flex: 0 0 44%;
  padding: 0.2rem 0.22rem;
  text-align: center;
  background: linear-gradient(180deg, var(--cfg-cup-acento) 0%, color-mix(in srgb, var(--cfg-cup-acento) 75%, #000) 100%);
}

.cfg-prev-gift-scan {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.06rem;
  flex: 1 1 auto;
  padding: 0.2rem 0.22rem;
  background: var(--cfg-cup-superficie);
}

.cfg-prev-bol {
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--cfg-cup-superficie);
  border: 1px solid var(--cfg-cup-borde);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.cfg-prev-bol-izq {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.08rem;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.2rem 0.22rem;
  border-right: 2px dashed color-mix(in srgb, var(--cfg-cup-acento) 40%, var(--cfg-cup-borde));
}

.cfg-prev-bol-etiq {
  font-size: 0.26rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cfg-cup-acento);
}

.cfg-prev-bol-marca {
  display: flex;
  align-items: center;
  gap: 0.14rem;
  min-width: 0;
}

.cfg-prev-bol-der {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
  flex: 0 0 32%;
  padding: 0.18rem 0.2rem;
  text-align: center;
  background: color-mix(in srgb, var(--cfg-cup-acento) 6%, var(--cfg-cup-cabecera));
}

.cfg-prev-bol-canje {
  font-size: 0.24rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cfg-cup-acento);
}

.cfg-prev-bol-num {
  font-size: 0.26rem;
  font-weight: 800;
  color: var(--cfg-cup-texto);
  opacity: 0.6;
}

.cfg-prev-panel-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.26rem;
  font-weight: 700;
  color: var(--cfg-cup-texto);
  opacity: 0.6;
}

.cfg-cup-opc:has(.cfg-cup-prev--credito) {
  align-items: stretch;
}

@media (min-width: 1101px) {
  .cfg-cup-opc {
    min-height: 10rem;
  }
}

.cfg-cup-opc-tit {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-texto);
}

.cfg-cup-opc-check {
  color: var(--color-acento);
}

.cfg-cup-opc-desc {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

@media (max-width: 1100px) {
  .cfg-cup-plantillas {
    grid-template-columns: 1fr;
  }

  .cfg-cup-opc {
    display: grid;
    grid-template-columns: minmax(9rem, 11rem) minmax(0, 1fr);
    align-items: stretch;
    gap: 1rem;
  }

  .cfg-cup-opc:has(.cfg-cup-prev--credito) {
    grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
  }

  .cfg-cup-prev--credito {
    min-height: unset;
    max-width: 100%;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .cfg-cup-opc {
    grid-template-columns: 1fr;
  }
}
</style>
