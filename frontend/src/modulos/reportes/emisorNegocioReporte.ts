import { formatearDocumentoClienteAlEscribir } from '../clientes/formateadorDocumentoCliente';
import { useNegocioStore } from '../../stores/negocio';

export interface RedSocialPieReporte {
  etiqueta: string;
  texto: string;
  enlace: string;
}

export interface EmisorNegocioReporte {
  negocioNombre: string;
  negocioIniciales: string;
  tieneLogoImagen: boolean;
  negocioLogoDataUrl: string;
  negocioCuit: string;
  negocioDireccion: string;
  negocioLocalidad: string;
  negocioTelefono: string;
  negocioCorreo: string;
  tieneCuit: boolean;
  tieneDireccion: boolean;
  tieneLocalidad: boolean;
  tieneTelefono: boolean;
  tieneCorreo: boolean;
  tieneDatosContacto: boolean;
  redesSociales: RedSocialPieReporte[];
  tieneRedesSociales: boolean;
}

function inicialesDesdeNombre(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return 'NT';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return `${palabras[0][0] ?? ''}${palabras[1][0] ?? ''}`.toUpperCase();
}

function armarLineaLocalidad(ciudad: string, provincia: string, codigoPostal: string): string {
  const partes: string[] = [];
  if (ciudad) partes.push(ciudad);
  if (provincia) partes.push(provincia);
  let linea = partes.join(', ');
  if (codigoPostal) {
    linea = linea ? `${linea} · CP ${codigoPostal}` : `CP ${codigoPostal}`;
  }
  return linea;
}

type RedNegocio = 'instagram' | 'twitter' | 'tiktok';

const ETIQUETAS_RED_SOCIAL: Record<RedNegocio, string> = {
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  tiktok: 'TikTok',
};

function armarTextoRedSocialPie(valor: string): string {
  const limpio = valor.trim();
  if (!limpio) return '';
  if (/^https?:\/\//i.test(limpio)) {
    try {
      const url = new URL(limpio);
      const segmento = url.pathname.split('/').filter(Boolean).pop() ?? '';
      const usuario = segmento.replace(/^@+/, '');
      return usuario ? `@${usuario}` : limpio;
    } catch {
      return limpio;
    }
  }
  return limpio.startsWith('@') ? limpio : `@${limpio.replace(/^@+/, '')}`;
}

function armarEnlaceRedSocialPie(red: RedNegocio, valor: string): string {
  const limpio = valor.trim();
  if (!limpio) return '';
  if (/^https?:\/\//i.test(limpio)) return limpio;
  const usuario = limpio.replace(/^@+/, '');
  switch (red) {
    case 'instagram':
      return `https://instagram.com/${usuario}`;
    case 'twitter':
      return `https://x.com/${usuario}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${usuario}`;
  }
}

function obtenerRedesSocialesPieReporte(
  instagram: string,
  mostrarInstagram: boolean,
  twitter: string,
  mostrarTwitter: boolean,
  tiktok: string,
  mostrarTiktok: boolean,
): RedSocialPieReporte[] {
  const candidatas: { red: RedNegocio; valor: string; visible: boolean }[] = [
    { red: 'instagram', valor: instagram, visible: mostrarInstagram },
    { red: 'twitter', valor: twitter, visible: mostrarTwitter },
    { red: 'tiktok', valor: tiktok, visible: mostrarTiktok },
  ];

  const redes: RedSocialPieReporte[] = [];
  for (const item of candidatas) {
    if (!item.visible) continue;
    const texto = armarTextoRedSocialPie(item.valor);
    if (!texto) continue;
    redes.push({
      etiqueta: ETIQUETAS_RED_SOCIAL[item.red],
      texto,
      enlace: armarEnlaceRedSocialPie(item.red, item.valor),
    });
  }
  return redes;
}

function datosLogoEmisorReporte(): Pick<EmisorNegocioReporte, 'tieneLogoImagen' | 'negocioLogoDataUrl'> {
  const dataUrl = useNegocioStore().logoDataUrl ?? '';
  const tieneLogoImagen = dataUrl.startsWith('data:');
  return {
    tieneLogoImagen,
    negocioLogoDataUrl: tieneLogoImagen ? dataUrl : '',
  };
}

/** Datos del emisor para encabezados de reportes (desde Configuración → Negocio). */
export function obtenerEmisorNegocioReporte(): EmisorNegocioReporte {
  const negocio = useNegocioStore().negocio;
  const nombre = negocio?.nombre.trim() || useNegocioStore().nombreNegocio;
  const cuit = formatearDocumentoClienteAlEscribir(negocio?.cuit ?? '').trim();
  const direccion = negocio?.direccion.trim() ?? '';
  const localidad = armarLineaLocalidad(
    negocio?.ciudad.trim() ?? '',
    negocio?.provincia.trim() ?? '',
    negocio?.codigoPostal.trim() ?? '',
  );
  const telefono = negocio?.telefono.trim() ?? '';
  const correo = negocio?.correoElectronico.trim() ?? '';
  const redesSociales = obtenerRedesSocialesPieReporte(
    negocio?.instagram ?? '',
    negocio?.mostrarInstagram ?? false,
    negocio?.twitter ?? '',
    negocio?.mostrarTwitter ?? false,
    negocio?.tiktok ?? '',
    negocio?.mostrarTiktok ?? false,
  );

  return {
    negocioNombre: nombre,
    negocioIniciales: inicialesDesdeNombre(nombre),
    ...datosLogoEmisorReporte(),
    negocioCuit: cuit,
    negocioDireccion: direccion,
    negocioLocalidad: localidad,
    negocioTelefono: telefono,
    negocioCorreo: correo,
    tieneCuit: cuit.length > 0,
    tieneDireccion: direccion.length > 0,
    tieneLocalidad: localidad.length > 0,
    tieneTelefono: telefono.length > 0,
    tieneCorreo: correo.length > 0,
    tieneDatosContacto:
      direccion.length > 0 || localidad.length > 0 || telefono.length > 0 || correo.length > 0,
    redesSociales,
    tieneRedesSociales: redesSociales.length > 0,
  };
}

export function generarHtmlLogoEmisorReporte(
  emisor: EmisorNegocioReporte,
  opciones: { claseContenedor: string; claseImagen: string },
): string {
  if (emisor.tieneLogoImagen && emisor.negocioLogoDataUrl.startsWith('data:')) {
    return `<img class="${opciones.claseImagen}" src="${emisor.negocioLogoDataUrl}" alt="" />`;
  }
  return `<div class="${opciones.claseContenedor}" aria-hidden="true">${escaparTextoHtmlReporte(emisor.negocioIniciales)}</div>`;
}

export function escaparTextoHtmlReporte(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Bloque HTML del emisor para vistas imprimibles inline (cuenta corriente, recibos). */
export function generarHtmlEmisorReporteInline(
  emisor: EmisorNegocioReporte,
  opciones?: { tituloDocumento?: string; generadoEl?: string },
): string {
  const nombre = escaparTextoHtmlReporte(emisor.negocioNombre);
  const logoHtml = generarHtmlLogoEmisorReporte(emisor, {
    claseContenedor: 'rep-emisor-inline-logo',
    claseImagen: 'rep-emisor-inline-logo-img',
  });
  const titulo = escaparTextoHtmlReporte(opciones?.tituloDocumento ?? 'Documento');
  const fecha = opciones?.generadoEl ? escaparTextoHtmlReporte(opciones.generadoEl) : '';

  const cuitHtml = emisor.tieneCuit
    ? `<span class="rep-emisor-inline-sep" aria-hidden="true">·</span><span class="rep-emisor-inline-cuit">CUIT ${escaparTextoHtmlReporte(emisor.negocioCuit)}</span>`
    : '';

  const fechaHtml = fecha
    ? `<span class="rep-emisor-inline-sep" aria-hidden="true">·</span><time class="rep-emisor-inline-fecha">${fecha}</time>`
    : '';

  return `<div class="rep-emisor-inline">
  ${logoHtml}
  <div class="rep-emisor-inline-cuerpo">
    <p class="rep-emisor-inline-etiq">Reporte</p>
    <p class="rep-emisor-inline-reporte">${titulo}</p>
    <div class="rep-emisor-inline-resumen">
      <span class="rep-emisor-inline-nom">${nombre}</span>${cuitHtml}${fechaHtml}
    </div>
  </div>
</div>`;
}

export function generarHtmlPieContactoInline(emisor: EmisorNegocioReporte): string {
  if (!emisor.tieneDatosContacto && !emisor.tieneRedesSociales) return '';

  const partesContacto: string[] = [];
  if (emisor.tieneDireccion) {
    partesContacto.push(
      `<p class="rep-pie-inline-dir">${escaparTextoHtmlReporte(emisor.negocioDireccion)}</p>`,
    );
  }
  if (emisor.tieneLocalidad) {
    partesContacto.push(
      `<p class="rep-pie-inline-loc">${escaparTextoHtmlReporte(emisor.negocioLocalidad)}</p>`,
    );
  }
  if (emisor.tieneTelefono || emisor.tieneCorreo) {
    const medios: string[] = [];
    if (emisor.tieneTelefono) medios.push(`Tel. ${escaparTextoHtmlReporte(emisor.negocioTelefono)}`);
    if (emisor.tieneCorreo) medios.push(escaparTextoHtmlReporte(emisor.negocioCorreo));
    partesContacto.push(`<p class="rep-pie-inline-medios">${medios.join(' · ')}</p>`);
  }

  const redesHtml =
    emisor.tieneRedesSociales
      ? `<div class="rep-pie-inline-redes">${emisor.redesSociales
          .map(
            (red) =>
              `<span><strong>${escaparTextoHtmlReporte(red.etiqueta)}</strong> ${escaparTextoHtmlReporte(red.texto)}</span>`,
          )
          .join(' · ')}</div>`
      : '';

  return `<footer class="rep-pie-inline">${partesContacto.join('')}${redesHtml}</footer>`;
}

export const estilosEmisorReporteInlineCss = `
.rep-emisor-inline {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}
.rep-emisor-inline-logo {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(145deg, #1e3a5f 0%, #0f2744 100%);
  color: #f8fafc;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.rep-emisor-inline-logo-img {
  display: block;
  flex-shrink: 0;
  width: auto;
  height: auto;
  max-width: 3.25rem;
  max-height: 2.75rem;
  object-fit: contain;
  object-position: center;
  background: transparent;
}
.rep-emisor-inline-cuerpo { min-width: 0; flex: 1; }
.rep-emisor-inline-etiq {
  margin: 0 0 0.12rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
}
.rep-emisor-inline-reporte {
  margin: 0 0 0.28rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e3a5f;
  line-height: 1.25;
}
.rep-emisor-inline-resumen {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.4rem;
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.4;
}
.rep-emisor-inline-nom { font-weight: 700; color: #334155; }
.rep-emisor-inline-cuit { font-weight: 600; font-variant-numeric: tabular-nums; }
.rep-emisor-inline-fecha { font-variant-numeric: tabular-nums; }
.rep-emisor-inline-sep { color: #94a3b8; }
.rep-pie-inline {
  margin-top: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.45;
}
.rep-pie-inline-dir { margin: 0; font-weight: 600; color: #334155; }
.rep-pie-inline-loc { margin: 0.12rem 0 0; }
.rep-pie-inline-medios { margin: 0.12rem 0 0; }
.rep-pie-inline-redes { margin-top: 0.35rem; color: #1e3a5f; font-size: 0.74rem; }
@media print {
  .rep-emisor-inline, .rep-pie-inline { break-inside: avoid; page-break-inside: avoid; }
}
`;
