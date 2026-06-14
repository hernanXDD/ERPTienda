<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ToastGlobal from '../componentes/nucleo/ToastGlobal.vue';
import ModalBienvenidaCambioContrasena from '../componentes/autenticacion/ModalBienvenidaCambioContrasena.vue';
import BarraLateralMovil from '../componentes/navegacion/BarraLateralMovil.vue';
import BarraLateral from '../componentes/navegacion/BarraLateral.vue';
import BarraSubmenuMovil from '../componentes/navegacion/BarraSubmenuMovil.vue';
import BarraSuperior from '../componentes/navegacion/BarraSuperior.vue';
import { useBarraContextoMovil } from '../composables/useBarraContextoMovil';
import { useEsMovil } from '../composables/useEsMovil';
import { refrescarDatosPorRuta } from '../modulos/nucleo/refrescarDatosPorRuta';
import { useApariencia } from '../composables/useApariencia';
import { cargarDatosMaestros, errorCargaDatosMaestros, reintentarCargaDatosMaestros } from '../stores/inicializacionDatos';
import { useSesionStore } from '../stores/sesion';

const esMovil = useEsMovil();
const { mostrarBarraContextoMovil } = useBarraContextoMovil();
const sesion = useSesionStore();
const route = useRoute();
const router = useRouter();

useApariencia();

const requiereCambioContrasena = computed(
  () => sesion.usuario?.debeCambiarContrasena === true,
);

function cargarDatosSiCorresponde(): void {
  if (!requiereCambioContrasena.value) {
    void cargarDatosMaestros();
  }
}

function refrescarPantallaActual(): void {
  if (!sesion.estaAutenticado || requiereCambioContrasena.value) return;
  refrescarDatosPorRuta(route);
}

function alRecuperarFocoVentana(): void {
  refrescarPantallaActual();
}

function reintentarCargaMaestros(): void {
  void reintentarCargaDatosMaestros().then(() => {
    refrescarPantallaActual();
  });
}

onMounted(() => {
  cargarDatosSiCorresponde();
  refrescarPantallaActual();
  window.addEventListener('focus', alRecuperarFocoVentana);
});

onUnmounted(() => {
  window.removeEventListener('focus', alRecuperarFocoVentana);
});

watch(requiereCambioContrasena, (pendiente) => {
  if (!pendiente) {
    void cargarDatosMaestros();
    refrescarPantallaActual();
  }
});

router.afterEach((to) => {
  if (requiereCambioContrasena.value) return;
  refrescarDatosPorRuta(to);
});
</script>

<template>
  <div
    class="shell"
    :class="{
      'shell--contrasena-pendiente': requiereCambioContrasena,
      'shell--contexto-movil': mostrarBarraContextoMovil,
    }"
  >
    <ModalBienvenidaCambioContrasena :visible="requiereCambioContrasena" />

    <template v-if="!requiereCambioContrasena">
      <BarraSuperior />
      <div class="cuerpo">
        <BarraLateral v-if="!esMovil" />
        <div class="columna-principal">
          <BarraSubmenuMovil />
          <main
            class="contenido"
            id="contenido-principal"
            tabindex="-1"
          >
            <div v-if="errorCargaDatosMaestros" class="aviso-carga-maestros" role="alert">
              <p class="aviso-carga-maestros-txt">{{ errorCargaDatosMaestros }}</p>
              <button type="button" class="aviso-carga-maestros-btn" @click="reintentarCargaMaestros">
                Reintentar carga
              </button>
            </div>
            <div class="relleno">
              <router-view />
            </div>
          </main>
        </div>
      </div>
      <BarraLateralMovil />
      <ToastGlobal />
    </template>

    <div v-else class="shell-bloqueo-contrasena" aria-hidden="true" />
  </div>
</template>

<style scoped>
.shell {
  height: 100dvh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-fondo);
  color: var(--color-texto);
  overflow-x: hidden;
}

.shell--contrasena-pendiente {
  overflow: hidden;
}

.shell-bloqueo-contrasena {
  flex: 1;
  min-height: 0;
  background: var(--color-fondo);
}

.cuerpo {
  flex: 1;
  display: flex;
  min-height: 0;
}

.columna-principal {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.contenido {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.relleno {
  padding: 1rem 1.1rem 1.25rem;
  max-width: 1200px;
  margin-inline: auto;
  width: 100%;
}

.relleno:has(.pg-wrap) {
  max-width: none;
  padding-inline: clamp(0.35rem, 1.5vw, 0.75rem);
}

.relleno:has(.cfg-ficha-vista) {
  max-width: none;
  padding: 0.35rem clamp(0.35rem, 1.2vw, 0.65rem) 0.4rem;
}

@media (min-width: 901px) {
  .relleno {
    padding: 1.25rem 1.5rem 1.5rem;
  }

  .relleno:has(.cfg-ficha-vista) {
    padding: 0.45rem 0.75rem 0.5rem;
  }
}

.aviso-carga-maestros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 0.85rem;
  margin: 0 0 0.85rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-peligro-borde);
  background: var(--color-peligro-suave);
  color: var(--color-peligro);
  font-size: 0.9375rem;
  line-height: 1.45;
}

.aviso-carga-maestros-txt {
  margin: 0;
  flex: 1 1 12rem;
}

.aviso-carga-maestros-btn {
  flex-shrink: 0;
  padding: 0.38rem 0.72rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-peligro-borde);
  background: var(--color-hover-neutro);
  color: inherit;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.aviso-carga-maestros-btn:hover {
  background: var(--color-hover-neutro);
}

@media (max-width: 900px) {
  .shell {
    height: 100dvh;
    min-height: 100dvh;
  }

  .contenido {
    overscroll-behavior-y: contain;
  }
}
</style>
