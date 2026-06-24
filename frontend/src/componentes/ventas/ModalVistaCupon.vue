<script setup lang="ts">
import { Download, Loader2, X } from 'lucide-vue-next';
import { onMounted, ref, useTemplateRef } from 'vue';
import { generarBlobJpgCupon, descargarBlobComoJpg } from '../../modulos/cupones/capturaCuponImagen';
import { mensajeErrorCupon } from '../../modulos/postventa/mensajesErrorPostventa';
import { renderizarCuponDescuento } from '../../modulos/cupones/renderizarCuponDescuento';
import { useCuponesDescuentoStore } from '../../stores/cuponesDescuento';
import type { CuponDescuentoRegistrado } from '../../tipos/cuponDescuento';
import VistaCuponImpreso from './VistaCuponImpreso.vue';

const props = defineProps<{
  cupon: CuponDescuentoRegistrado;
}>();

const emit = defineEmits<{
  cerrar: [];
}>();

const refDialogo = useTemplateRef<HTMLDialogElement>('refDialogo');
const cuponesStore = useCuponesDescuentoStore();

const htmlCupon = ref('');
const cargando = ref(true);
const descargando = ref(false);
const mensajeError = ref('');

onMounted(() => {
  refDialogo.value?.showModal();
  void cargarVista();
});

async function cargarVista(): Promise<void> {
  cargando.value = true;
  mensajeError.value = '';
  htmlCupon.value = '';
  try {
    const codigo = await cuponesStore.obtenerCodigoBarras(props.cupon.id);
    htmlCupon.value = await renderizarCuponDescuento(props.cupon, codigo);
  } catch (error: unknown) {
    mensajeError.value = mensajeErrorCupon(error, 'vista');
  } finally {
    cargando.value = false;
  }
}

function cerrarDialogo(): void {
  refDialogo.value?.close();
}

function alCerrarDialogo(): void {
  emit('cerrar');
}

async function descargarImagen(): Promise<void> {
  if (!htmlCupon.value || descargando.value) return;
  descargando.value = true;
  try {
    const blob = await generarBlobJpgCupon(htmlCupon.value);
    descargarBlobComoJpg(blob, props.cupon.numero);
  } catch {
    mensajeError.value = 'No se pudo descargar la imagen. Intentá de nuevo en unos segundos.';
  } finally {
    descargando.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="refDialogo"
      class="cup-modal-ver"
      :aria-labelledby="`cup-ver-titulo-${cupon.id}`"
      @close="alCerrarDialogo"
    >
      <article class="cup-modal-ver-doc">
        <header class="cup-modal-ver-cab">
          <div>
            <p class="cup-modal-ver-etiq">Vista del cupón</p>
            <h2 :id="`cup-ver-titulo-${cupon.id}`" class="cup-modal-ver-tit">{{ cupon.numero }}</h2>
          </div>
          <button type="button" class="cup-modal-ver-cerrar" aria-label="Cerrar" @click="cerrarDialogo">
            <X :size="20" stroke-width="2" aria-hidden="true" />
          </button>
        </header>

        <div class="cup-modal-ver-cuerpo">
          <p v-if="cargando" class="cup-modal-ver-carga" role="status">
            <Loader2 :size="18" class="lv-btn-cargar-fact-ico--girar" aria-hidden="true" />
            Generando cupón con tu plantilla configurada…
          </p>
          <p v-else-if="mensajeError" class="cup-modal-ver-error" role="alert">
            {{ mensajeError }}
          </p>
          <VistaCuponImpreso v-else :html="htmlCupon" />
        </div>

        <footer class="cup-modal-ver-pie">
          <button type="button" class="cup-btn-sec" @click="cerrarDialogo">Cerrar</button>
          <button
            type="button"
            class="pg-btn-primario cup-modal-ver-desc"
            :disabled="cargando || !htmlCupon || descargando"
            @click="descargarImagen"
          >
            <Loader2 v-if="descargando" :size="16" class="lv-btn-cargar-fact-ico--girar" aria-hidden="true" />
            <Download v-else :size="16" aria-hidden="true" />
            Descargar imagen
          </button>
        </footer>
      </article>
    </dialog>
  </Teleport>
</template>

<style scoped>
.cup-modal-ver {
  margin: auto;
  padding: 0;
  width: min(30rem, calc(100vw - 1.25rem));
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--color-texto);
}

.cup-modal-ver::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(4px);
}

.cup-modal-ver-doc {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
}

.cup-modal-ver-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.15rem 0.85rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cup-modal-ver-etiq {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cup-modal-ver-tit {
  margin: 0.2rem 0 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.cup-modal-ver-cerrar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: transparent;
  color: var(--color-texto-suave);
  cursor: pointer;
}

.cup-modal-ver-cuerpo {
  flex: 1;
  overflow: visible;
  padding: 1.5rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-fondo-cabecera);
}

.cup-modal-ver-carga,
.cup-modal-ver-error {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.cup-modal-ver-carga {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-texto-apagado);
}

.cup-modal-ver-error {
  color: var(--color-peligro);
}

.cup-modal-ver-pie {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.85rem 1.15rem 1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cup-modal-ver-desc {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
</style>
