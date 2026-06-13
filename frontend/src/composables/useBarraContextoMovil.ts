import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { catalogoReportes } from '../modulos/reportes/catalogoReportes';
import { obtenerDescripcionPagina } from '../modulos/nucleo/descripcionesPaginas';
import type { ElementoMenuPrincipal } from '../modulos/nucleo/elementosNavegacion';
import { useElementosMenuFiltrados } from './useElementosMenuFiltrados';

function rutaMuestraBarraContextoMovil(
  nombreRuta: string | symbol | undefined,
  modulo: ElementoMenuPrincipal | undefined,
): boolean {
  if (!modulo || typeof nombreRuta !== 'string') return false;
  if (nombreRuta === 'inicio') return false;

  if (modulo.subelementos?.some((sub) => sub.nombreRuta === nombreRuta)) {
    return true;
  }

  if (modulo.claveMenuPrincipal === 'reportes') {
    return true;
  }

  return false;
}

function obtenerDescripcionContextoMovil(
  nombreRuta: string | symbol | undefined,
  modulo: ElementoMenuPrincipal | undefined,
): string {
  if (typeof nombreRuta !== 'string') return '';

  const reporte = catalogoReportes.find((item) => item.nombreRuta === nombreRuta);
  if (reporte?.descripcion) return reporte.descripcion;

  const descripcionRuta = obtenerDescripcionPagina(nombreRuta);
  if (descripcionRuta) return descripcionRuta;

  const subActivo = modulo?.subelementos?.find((sub) => sub.nombreRuta === nombreRuta);
  if (subActivo?.descripcion) return subActivo.descripcion;

  if (modulo?.descripcion && nombreRuta === modulo.nombreRuta) {
    return modulo.descripcion;
  }

  return '';
}

export function useBarraContextoMovil() {
  const esMovil = useMediaQuery('(max-width: 767px)');
  const rutaActiva = useRoute();
  const { elementoMenuActivo } = useElementosMenuFiltrados();

  const mostrarBarraContextoMovil = computed(() => {
    if (!esMovil.value) return false;
    return rutaMuestraBarraContextoMovil(rutaActiva.name, elementoMenuActivo.value);
  });

  const tituloContexto = computed(() => {
    const modulo = elementoMenuActivo.value;
    if (!modulo) return '';

    const nombreRuta = rutaActiva.name;
    if (typeof nombreRuta === 'string') {
      const reporte = catalogoReportes.find((item) => item.nombreRuta === nombreRuta);
      if (reporte) return reporte.titulo;
    }

    const subActivo = modulo.subelementos?.find((sub) => sub.nombreRuta === rutaActiva.name);
    return subActivo?.etiqueta ?? modulo.etiqueta;
  });

  const iconoModulo = computed(() => elementoMenuActivo.value?.icono ?? null);

  const descripcionContexto = computed(() =>
    obtenerDescripcionContextoMovil(rutaActiva.name, elementoMenuActivo.value),
  );

  return {
    mostrarBarraContextoMovil,
    tituloContexto,
    descripcionContexto,
    iconoModulo,
  };
}
