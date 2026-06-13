import { computed, onUnmounted, ref, watch, type Ref } from 'vue';

const ANCHO_ZONA_BORDE_PX = 32;
const FRACCION_APERTURA = 0.32;

interface OpcionesGestoMenuLateralMovil {
  esMovil: Ref<boolean>;
  menuAbierto: Ref<boolean>;
  abrirMenu: () => void;
  cerrarMenu: () => void;
}

export function useGestoDeslizarMenuLateralMovil(opciones: OpcionesGestoMenuLateralMovil) {
  const panelRef = ref<HTMLElement | null>(null);
  const posicionPanelPx = ref(0);
  const opacidadFondo = ref(0);
  const arrastrando = ref(false);
  const anchoPanelPx = ref(280);

  let inicioX = 0;
  let inicioY = 0;
  let posicionAlIniciar = 0;
  let modoArrastre: 'abrir' | 'cerrar' | null = null;
  let gestosActivos = false;

  function medirPanel(): void {
    const ancho = panelRef.value?.offsetWidth;
    if (ancho && ancho > 0) anchoPanelPx.value = ancho;
  }

  function sincronizarPosicionConEstado(): void {
    medirPanel();
    posicionPanelPx.value = opciones.menuAbierto.value ? 0 : -anchoPanelPx.value;
    opacidadFondo.value = opciones.menuAbierto.value ? 1 : 0;
  }

  function esDentroPanel(objetivo: EventTarget | null): boolean {
    if (!(objetivo instanceof Node)) return false;
    return panelRef.value?.contains(objetivo) ?? false;
  }

  function esFondoMenu(objetivo: EventTarget | null): boolean {
    return objetivo instanceof Element && objetivo.classList.contains('menu-movil-fondo');
  }

  function alIniciarToque(evento: TouchEvent): void {
    if (!opciones.esMovil.value || evento.touches.length !== 1) return;

    medirPanel();
    const toque = evento.touches[0];
    inicioX = toque.clientX;
    inicioY = toque.clientY;
    modoArrastre = null;

    if (!opciones.menuAbierto.value && toque.clientX <= ANCHO_ZONA_BORDE_PX) {
      modoArrastre = 'abrir';
      arrastrando.value = true;
      posicionAlIniciar = -anchoPanelPx.value;
      return;
    }

    if (
      opciones.menuAbierto.value &&
      (esDentroPanel(evento.target) || esFondoMenu(evento.target))
    ) {
      modoArrastre = 'cerrar';
      arrastrando.value = true;
      posicionAlIniciar = posicionPanelPx.value;
    }
  }

  function alMoverToque(evento: TouchEvent): void {
    if (!arrastrando.value || !modoArrastre) return;

    const toque = evento.touches[0];
    const deltaX = toque.clientX - inicioX;
    const deltaY = toque.clientY - inicioY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 14) return;

    const nuevaPosicion = Math.min(
      0,
      Math.max(-anchoPanelPx.value, posicionAlIniciar + deltaX),
    );
    posicionPanelPx.value = nuevaPosicion;
    opacidadFondo.value = (nuevaPosicion + anchoPanelPx.value) / anchoPanelPx.value;

    if (Math.abs(deltaX) > 10) {
      evento.preventDefault();
    }
  }

  function alTerminarToque(): void {
    if (!arrastrando.value) return;

    arrastrando.value = false;
    const fraccionVisible =
      (posicionPanelPx.value + anchoPanelPx.value) / Math.max(anchoPanelPx.value, 1);

    if (fraccionVisible >= FRACCION_APERTURA) {
      opciones.abrirMenu();
      posicionPanelPx.value = 0;
      opacidadFondo.value = 1;
    } else {
      opciones.cerrarMenu();
      posicionPanelPx.value = -anchoPanelPx.value;
      opacidadFondo.value = 0;
    }

    modoArrastre = null;
  }

  function engancharGestos(): void {
    if (gestosActivos) return;
    gestosActivos = true;
    window.addEventListener('touchstart', alIniciarToque, { passive: true });
    window.addEventListener('touchmove', alMoverToque, { passive: false });
    window.addEventListener('touchend', alTerminarToque);
    window.addEventListener('touchcancel', alTerminarToque);
    window.addEventListener('resize', medirPanel);
  }

  function desengancharGestos(): void {
    if (!gestosActivos) return;
    gestosActivos = false;
    window.removeEventListener('touchstart', alIniciarToque);
    window.removeEventListener('touchmove', alMoverToque);
    window.removeEventListener('touchend', alTerminarToque);
    window.removeEventListener('touchcancel', alTerminarToque);
    window.removeEventListener('resize', medirPanel);
  }

  watch(
    () => opciones.menuAbierto.value,
    () => {
      if (!arrastrando.value) sincronizarPosicionConEstado();
    },
  );

  watch(
    () => opciones.esMovil.value,
    (movil) => {
      if (movil) {
        engancharGestos();
        sincronizarPosicionConEstado();
      } else {
        desengancharGestos();
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    desengancharGestos();
  });

  const posicionPestanaPx = computed(() =>
    Math.max(0, posicionPanelPx.value + anchoPanelPx.value),
  );

  return {
    panelRef,
    posicionPanelPx,
    opacidadFondo,
    arrastrando,
    anchoPanelPx,
    posicionPestanaPx,
    medirPanel,
    sincronizarPosicionConEstado,
  };
}
