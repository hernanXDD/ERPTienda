import { Eta } from 'eta/core';
import { estilosBaseReporteCss } from './estilosReporteCss';

const eta = new Eta({
  autoEscape: true,
  tags: ['<%', '%>'],
});

/** Renderiza plantilla en memoria (no usar `render`: interpreta el string como nombre de archivo). */
export function renderizarPlantillaReporte(plantilla: string, datos: object): string {
  return eta.renderString(plantilla, {
    ...datos,
    estilos: estilosBaseReporteCss,
  });
}
