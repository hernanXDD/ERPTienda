<script setup lang="ts">
import { IdCard, Image, MapPin, Palette, Phone, RotateCcw, Share2, Store, Trash2, Upload } from 'lucide-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { formatearDocumentoClienteAlEscribir } from '../../modulos/clientes/formateadorDocumentoCliente';
import {
  formatearCorreoClienteAlEscribir,
  formatearTelefonoClienteAlEscribir,
  formatearTelefonoClienteAlPerderFoco,
  normalizarCorreoClienteAlPerderFoco,
  normalizarDireccionClienteAlPerderFoco,
  normalizarNombreClienteAlPerderFoco,
} from '../../modulos/clientes/formateadorEntradaCliente';
import {
  normalizarRedSocialAlEscribir,
  normalizarRedSocialAlPerderFoco,
} from '../../modulos/negocio/normalizarRedSocial';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { obtenerLogoNegocioApi } from '../../servicios/negocio.servicio';
import { useNegocioStore } from '../../stores/negocio';
import type { DatosNegocioEditable } from '../../tipos/negocio';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import { normalizarTemaClaroNegocio } from '../../composables/useApariencia';
import { normalizarColorHex } from '../../modulos/tema/colorUtilidades';
import { datosTemaClaroNegocioPorDefecto, TEMA_CLARO_POR_DEFECTO } from '../../modulos/tema/temaClaroPorDefecto';
import { inicialesNombreNegocio } from '../../modulos/negocio/inicialesNombreNegocio';
import { variablesCssTemaClaro } from '../../modulos/tema/variablesTemaClaro';
import '../../estilos/formularioConfiguracion.css';

type CampoColorTemaClaro = keyof Pick<
  DatosNegocioEditable,
  | 'temaClaroColorAcento'
  | 'temaClaroColorFondo'
  | 'temaClaroColorSuperficie'
  | 'temaClaroColorCabecera'
  | 'temaClaroColorTexto'
  | 'temaClaroColorBorde'
>;

const definicionesColoresTemaClaroPrincipales: ReadonlyArray<{
  campo: CampoColorTemaClaro;
  id: string;
  etiqueta: string;
  ayuda: string;
  porDefecto: string;
}> = [
  {
    campo: 'temaClaroColorAcento',
    id: 'neg-tema-acento',
    etiqueta: 'Color de acento',
    ayuda: 'Botones, links e íconos activos en modo claro.',
    porDefecto: TEMA_CLARO_POR_DEFECTO.colorAcento,
  },
  {
    campo: 'temaClaroColorFondo',
    id: 'neg-tema-fondo',
    etiqueta: 'Color de fondo',
    ayuda: 'Fondo general de pantallas en modo claro.',
    porDefecto: TEMA_CLARO_POR_DEFECTO.colorFondo,
  },
  {
    campo: 'temaClaroColorTexto',
    id: 'neg-tema-texto',
    etiqueta: 'Color de texto',
    ayuda: 'Texto principal de pantallas en modo claro.',
    porDefecto: TEMA_CLARO_POR_DEFECTO.colorTexto,
  },
  {
    campo: 'temaClaroColorBorde',
    id: 'neg-tema-borde',
    etiqueta: 'Color de bordes',
    ayuda: 'Contornos de tarjetas, tablas, campos y separadores.',
    porDefecto: TEMA_CLARO_POR_DEFECTO.colorBorde,
  },
];

const definicionesColoresTemaClaroSuperficie: ReadonlyArray<{
  campo: CampoColorTemaClaro;
  id: string;
  etiqueta: string;
  ayuda: string;
  porDefecto: string;
}> = [
  {
    campo: 'temaClaroColorSuperficie',
    id: 'neg-tema-superficie',
    etiqueta: 'Color de tarjetas',
    ayuda: 'Paneles, tablas y bloques elevados.',
    porDefecto: TEMA_CLARO_POR_DEFECTO.colorSuperficie,
  },
  {
    campo: 'temaClaroColorCabecera',
    id: 'neg-tema-cabecera',
    etiqueta: 'Color de encabezados',
    ayuda: 'Barra superior, cabeceras de tablas y títulos de sección.',
    porDefecto: TEMA_CLARO_POR_DEFECTO.colorCabecera,
  },
];

const descripcionPagina = obtenerDescripcionPagina('configuracion-negocio');
const { tienePermiso } = usePermisosOperador();
const puedeEditarConfiguracionNegocio = computed(() =>
  tienePermiso('puedeEditarConfiguracionNegocio'),
);

const negocioStore = useNegocioStore();

const borrador = ref<DatosNegocioEditable>({
  nombre: '',
  cuit: '',
  correoElectronico: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  instagram: '',
  mostrarInstagram: false,
  twitter: '',
  mostrarTwitter: false,
  tiktok: '',
  mostrarTiktok: false,
  ...datosTemaClaroNegocioPorDefecto(),
});

const refInputLogo = useTemplateRef('refInputLogo');

const cargandoInicial = ref(true);
const guardando = ref(false);
const subiendoLogo = ref(false);
const eliminandoLogo = ref(false);
const modoEdicion = ref(false);
const mensajeExito = ref('');
const mensajeError = ref('');
const urlVistaPreviaLogo = ref('');
let urlLogoObjeto: string | null = null;

const TIPOS_LOGO_PERMITIDOS = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;

const tieneLogo = computed(() => negocioStore.negocio?.tieneLogo === true);
const nombreArchivoLogo = computed(() => negocioStore.negocio?.nombreArchivoLogo?.trim() ?? '');

const cantidadRedesVisibles = computed(() => {
  let total = 0;
  if (borrador.value.mostrarInstagram) total += 1;
  if (borrador.value.mostrarTwitter) total += 1;
  if (borrador.value.mostrarTiktok) total += 1;
  return total;
});

const vistaPreviaNombre = computed(() => borrador.value.nombre.trim());
const vistaPreviaCuit = computed(() => borrador.value.cuit.trim());
const inicialesVistaPreviaNegocio = computed(() => inicialesNombreNegocio(vistaPreviaNombre.value));

const estilosVistaPreviaTemaClaro = computed(() => {
  const tema = normalizarTemaClaroNegocio(borrador.value);
  return variablesCssTemaClaro(tema) as Record<string, string>;
});

const temaClaroEsPorDefecto = computed(() => {
  const actual = normalizarTemaClaroNegocio(borrador.value);
  const defecto = normalizarTemaClaroNegocio(datosTemaClaroNegocioPorDefecto());
  return (
    actual.colorAcento === defecto.colorAcento &&
    actual.colorFondo === defecto.colorFondo &&
    actual.colorSuperficie === defecto.colorSuperficie &&
    actual.colorCabecera === defecto.colorCabecera &&
    actual.colorTexto === defecto.colorTexto &&
    actual.colorBorde === defecto.colorBorde
  );
});

function restablecerTemaClaroPorDefecto(): void {
  Object.assign(borrador.value, datosTemaClaroNegocioPorDefecto());
}

function alEscribirColorHex(campo: CampoColorTemaClaro, valor: string): void {
  const limpio = valor.trim().replace(/[^#0-9a-fA-F]/g, '');
  const conHash = limpio.startsWith('#') ? limpio : `#${limpio}`;
  if (conHash.length <= 7) {
    borrador.value[campo] = conHash;
  }
}

function alPerderFocoColorHex(campo: CampoColorTemaClaro, porDefecto: string): void {
  borrador.value[campo] = normalizarColorHex(borrador.value[campo], porDefecto);
}

function aplicarNegocioAlBorrador(): void {
  const actual = negocioStore.negocio;
  if (!actual) return;
  borrador.value = {
    nombre: actual.nombre,
    cuit: formatearDocumentoClienteAlEscribir(actual.cuit),
    correoElectronico: actual.correoElectronico,
    telefono: formatearTelefonoClienteAlPerderFoco(actual.telefono),
    direccion: actual.direccion,
    ciudad: actual.ciudad,
    provincia: actual.provincia,
    codigoPostal: actual.codigoPostal,
    instagram: actual.instagram,
    mostrarInstagram: actual.mostrarInstagram,
    twitter: actual.twitter,
    mostrarTwitter: actual.mostrarTwitter,
    tiktok: actual.tiktok,
    mostrarTiktok: actual.mostrarTiktok,
    temaClaroColorAcento: actual.temaClaroColorAcento,
    temaClaroColorFondo: actual.temaClaroColorFondo,
    temaClaroColorSuperficie: actual.temaClaroColorSuperficie,
    temaClaroColorCabecera: actual.temaClaroColorCabecera,
    temaClaroColorTexto: actual.temaClaroColorTexto,
    temaClaroColorBorde: actual.temaClaroColorBorde,
  };
}

function liberarVistaPreviaLogo(): void {
  if (urlLogoObjeto) {
    URL.revokeObjectURL(urlLogoObjeto);
    urlLogoObjeto = null;
  }
  urlVistaPreviaLogo.value = '';
}

async function cargarVistaPreviaLogo(): Promise<void> {
  liberarVistaPreviaLogo();
  if (!negocioStore.negocio?.tieneLogo) return;
  try {
    const blob = await obtenerLogoNegocioApi();
    urlLogoObjeto = URL.createObjectURL(blob);
    urlVistaPreviaLogo.value = urlLogoObjeto;
  } catch {
    /* vista previa opcional */
  }
}

onMounted(async () => {
  mensajeExito.value = '';
  mensajeError.value = '';
  try {
    await negocioStore.cargar();
    aplicarNegocioAlBorrador();
    await cargarVistaPreviaLogo();
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudieron cargar los datos del negocio.');
  } finally {
    cargandoInicial.value = false;
  }
});

onUnmounted(() => {
  liberarVistaPreviaLogo();
});

function abrirSelectorLogo(): void {
  if (!puedeEditarConfiguracionNegocio.value || !modoEdicion.value || guardando.value || subiendoLogo.value) {
    return;
  }
  refInputLogo.value?.click();
}

async function alSeleccionarLogo(event: Event): Promise<void> {
  const entrada = event.target as HTMLInputElement;
  const archivo = entrada.files?.[0];
  entrada.value = '';
  if (!archivo || !puedeEditarConfiguracionNegocio.value || !modoEdicion.value) return;

  if (!TIPOS_LOGO_PERMITIDOS.includes(archivo.type as (typeof TIPOS_LOGO_PERMITIDOS)[number])) {
    mensajeError.value = 'Formato no permitido. Use PNG, JPG, WEBP o SVG.';
    return;
  }
  if (archivo.size > 2 * 1024 * 1024) {
    mensajeError.value = 'El logo no puede superar 2 MB.';
    return;
  }

  if (tieneLogo.value) {
    const continuar = globalThis.confirm('Va a reemplazar el logo del negocio.\n¿Desea seguir?');
    if (!continuar) return;
  }

  subiendoLogo.value = true;
  mensajeExito.value = '';
  mensajeError.value = '';
  try {
    await negocioStore.subirLogo(archivo);
    await cargarVistaPreviaLogo();
    mensajeExito.value = 'Logo del negocio actualizado correctamente.';
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo subir el logo.');
  } finally {
    subiendoLogo.value = false;
  }
}

async function quitarLogoNegocio(): Promise<void> {
  if (!puedeEditarConfiguracionNegocio.value || !modoEdicion.value || !tieneLogo.value) return;
  if (!globalThis.confirm('¿Eliminar el logo del negocio?')) return;

  eliminandoLogo.value = true;
  mensajeExito.value = '';
  mensajeError.value = '';
  try {
    await negocioStore.eliminarLogo();
    liberarVistaPreviaLogo();
    mensajeExito.value = 'Logo eliminado correctamente.';
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo eliminar el logo.');
  } finally {
    eliminandoLogo.value = false;
  }
}

function alEscribirCuit(texto: string): void {
  borrador.value.cuit = formatearDocumentoClienteAlEscribir(texto);
}

function alPerderFocoCuit(): void {
  borrador.value.cuit = formatearDocumentoClienteAlEscribir(borrador.value.cuit);
}

function alEscribirTelefono(texto: string): void {
  borrador.value.telefono = formatearTelefonoClienteAlEscribir(texto);
}

function alPerderFocoTelefono(): void {
  borrador.value.telefono = formatearTelefonoClienteAlPerderFoco(borrador.value.telefono);
}

function alEscribirCorreo(texto: string): void {
  borrador.value.correoElectronico = formatearCorreoClienteAlEscribir(texto);
}

function alPerderFocoCorreo(): void {
  borrador.value.correoElectronico = normalizarCorreoClienteAlPerderFoco(borrador.value.correoElectronico);
}

function alPerderFocoNombre(): void {
  borrador.value.nombre = normalizarNombreClienteAlPerderFoco(borrador.value.nombre);
}

function alPerderFocoDireccion(): void {
  borrador.value.direccion = normalizarDireccionClienteAlPerderFoco(borrador.value.direccion);
}

function alEscribirRedSocial(campo: 'instagram' | 'twitter' | 'tiktok', texto: string): void {
  borrador.value[campo] = normalizarRedSocialAlEscribir(texto);
}

function alPerderFocoRedSocial(campo: 'instagram' | 'twitter' | 'tiktok'): void {
  borrador.value[campo] = normalizarRedSocialAlPerderFoco(borrador.value[campo]);
}

function redSocialHabilitada(mostrar: boolean): boolean {
  return modoEdicion.value && mostrar && !guardando.value;
}

function iniciarEdicion(): void {
  mensajeExito.value = '';
  mensajeError.value = '';
  aplicarNegocioAlBorrador();
  modoEdicion.value = true;
  void nextTick(() => document.getElementById('neg-nombre')?.focus());
}

function manejarAccionPie(): void {
  if (guardando.value || !puedeEditarConfiguracionNegocio.value) return;
  if (!modoEdicion.value) {
    iniciarEdicion();
    return;
  }
  void guardarNegocio();
}

async function guardarNegocio(): Promise<void> {
  mensajeExito.value = '';
  mensajeError.value = '';

  const nombre = normalizarNombreClienteAlPerderFoco(borrador.value.nombre);
  if (!nombre) {
    mensajeError.value = 'El nombre del negocio es obligatorio.';
    document.getElementById('neg-nombre')?.focus();
    return;
  }

  const datos: DatosNegocioEditable = {
    ...borrador.value,
    nombre,
    cuit: formatearDocumentoClienteAlEscribir(borrador.value.cuit).trim(),
    correoElectronico: normalizarCorreoClienteAlPerderFoco(borrador.value.correoElectronico),
    telefono: formatearTelefonoClienteAlPerderFoco(borrador.value.telefono),
    direccion: normalizarDireccionClienteAlPerderFoco(borrador.value.direccion),
    ciudad: borrador.value.ciudad.trim(),
    provincia: borrador.value.provincia.trim(),
    codigoPostal: borrador.value.codigoPostal.trim(),
    instagram: normalizarRedSocialAlPerderFoco(borrador.value.instagram),
    mostrarInstagram: borrador.value.mostrarInstagram,
    twitter: normalizarRedSocialAlPerderFoco(borrador.value.twitter),
    mostrarTwitter: borrador.value.mostrarTwitter,
    tiktok: normalizarRedSocialAlPerderFoco(borrador.value.tiktok),
    mostrarTiktok: borrador.value.mostrarTiktok,
    ...(() => {
      const tema = normalizarTemaClaroNegocio(borrador.value);
      return {
        temaClaroColorAcento: tema.colorAcento,
        temaClaroColorFondo: tema.colorFondo,
        temaClaroColorSuperficie: tema.colorSuperficie,
        temaClaroColorCabecera: tema.colorCabecera,
        temaClaroColorTexto: tema.colorTexto,
        temaClaroColorBorde: tema.colorBorde,
      };
    })(),
  };

  guardando.value = true;
  try {
    await negocioStore.actualizar(datos);
    aplicarNegocioAlBorrador();
    modoEdicion.value = false;
    mensajeExito.value = 'Datos del negocio guardados correctamente.';
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudieron guardar los datos del negocio.');
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-config-negocio">
    <div class="pg-marco pg-marco--permisos">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Store :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Configuración · Negocio</p>
              <h1 id="titulo-config-negocio" class="pg-titulo">Datos de la tienda</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
        <div class="pg-kpis" aria-label="Resumen del negocio">
          <div class="pg-kpi pg-kpi--acento">
            <span class="pg-kpi-etiq">Logo</span>
            <span class="pg-kpi-valor perm-kpi-estado">{{ tieneLogo ? 'Cargado' : 'Sin logo' }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Redes visibles</span>
            <span class="pg-kpi-valor pg-mono">{{ cantidadRedesVisibles }}/3</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Modo</span>
            <span class="pg-kpi-valor perm-kpi-estado">{{ modoEdicion ? 'Edición' : 'Consulta' }}</span>
          </div>
        </div>
      </header>

      <form id="form-negocio" @submit.prevent="manejarAccionPie">
        <div class="pg-barra">
          <div class="pg-barra-fila">
            <div class="pg-barra-col pg-barra-col--accion">
              <span class="pg-filtro-etiq pg-sr">Acción</span>
              <button
                v-if="puedeEditarConfiguracionNegocio"
                type="submit"
                class="pg-btn-primario"
                :disabled="guardando || cargandoInicial"
              >
                {{
                  guardando
                    ? 'Guardando…'
                    : modoEdicion
                      ? 'Guardar configuración'
                      : 'Editar configuración'
                }}
              </button>
            </div>
          </div>
          <p
            v-if="mensajeExito"
            class="perm-aviso perm-aviso--ok"
            role="status"
          >
            {{ mensajeExito }}
          </p>
          <p
            v-if="mensajeError"
            class="perm-aviso perm-aviso--error"
            role="alert"
          >
            {{ mensajeError }}
          </p>
        </div>

        <div v-if="!cargandoInicial" class="perm-ficha" aria-label="Vista previa del negocio">
          <div class="perm-ficha-ident">
            <p class="perm-ficha-nombre">
              {{ vistaPreviaNombre || 'Nombre del negocio' }}
            </p>
            <p v-if="vistaPreviaCuit" class="perm-ficha-login pg-mono">{{ vistaPreviaCuit }}</p>
          </div>
          <div class="perm-ficha-chips">
            <span class="perm-chip perm-chip--rol">Datos fiscales y contacto</span>
            <span v-if="modoEdicion" class="perm-chip perm-chip--edicion">Modo edición</span>
            <span
              class="perm-chip"
              :class="tieneLogo ? 'perm-chip--habilitado' : 'perm-chip--inhabilitado'"
            >
              {{ tieneLogo ? 'Logo activo' : 'Sin logo' }}
            </span>
          </div>
        </div>

        <div v-if="cargandoInicial" class="cfg-ficha-carga" role="status">
          <div class="cfg-ficha-carga-pulso" />
          <p>Cargando ficha del negocio…</p>
        </div>

        <fieldset
          v-else
          class="perm-cuerpo perm-cuerpo--negocio"
          :class="{ 'perm-cuerpo--solo-lectura': !modoEdicion }"
          :disabled="!modoEdicion || guardando"
        >
          <section class="perm-bloque" aria-labelledby="cfg-neg-sec-ident">
            <header class="perm-bloque-enc">
              <span class="perm-bloque-ico" aria-hidden="true">
                <IdCard :size="16" stroke-width="2" />
              </span>
              <h2 id="cfg-neg-sec-ident" class="perm-bloque-tit">Identificación</h2>
            </header>
            <div class="perm-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--vertical">
              <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="neg-nombre">Nombre o razón social</label>
                    <input
                      id="neg-nombre"
                      v-model="borrador.nombre"
                      type="text"
                      class="cfg-ficha-inp"
                      required
                      maxlength="200"
                      autocomplete="organization"
                      placeholder="Nombre comercial de la tienda"
                      :disabled="!modoEdicion || guardando"
                      @blur="alPerderFocoNombre"
                    />
                  </div>
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="neg-cuit">CUIT</label>
                    <input
                      id="neg-cuit"
                      :value="borrador.cuit"
                      type="text"
                      class="cfg-ficha-inp cfg-ficha-inp-mono"
                      inputmode="text"
                      placeholder="20-12345678-9"
                      autocomplete="off"
                      :disabled="!modoEdicion || guardando"
                      @input="alEscribirCuit(($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoCuit"
                    />
                  </div>
                </div>
              </section>

              <section class="perm-bloque" aria-labelledby="cfg-neg-sec-contacto">
                <header class="perm-bloque-enc">
                  <span class="perm-bloque-ico" aria-hidden="true">
                    <Phone :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-contacto" class="perm-bloque-tit">Contacto</h2>
                </header>
                <div class="perm-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--vertical">
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="neg-tel">Teléfono</label>
                    <input
                      id="neg-tel"
                      :value="borrador.telefono"
                      type="tel"
                      class="cfg-ficha-inp cfg-ficha-inp-mono"
                      inputmode="tel"
                      autocomplete="tel"
                      placeholder="11 2345-6789"
                      :disabled="!modoEdicion || guardando"
                      @input="alEscribirTelefono(($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoTelefono"
                    />
                  </div>
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="neg-correo">Correo electrónico</label>
                    <input
                      id="neg-correo"
                      :value="borrador.correoElectronico"
                      type="email"
                      class="cfg-ficha-inp"
                      inputmode="email"
                      autocomplete="email"
                      placeholder="contacto@mitienda.com"
                      :disabled="!modoEdicion || guardando"
                      @input="alEscribirCorreo(($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoCorreo"
                    />
                  </div>
                </div>
              </section>

              <section class="perm-bloque" aria-labelledby="cfg-neg-sec-ubicacion">
                <header class="perm-bloque-enc">
                  <span class="perm-bloque-ico" aria-hidden="true">
                    <MapPin :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-ubicacion" class="perm-bloque-tit">Ubicación</h2>
                </header>
                <div class="perm-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--tres">
                  <div class="cfg-ficha-campo cfg-ficha-campo--ancho">
                    <label class="cfg-ficha-etiq" for="neg-dir">Dirección</label>
                    <input
                      id="neg-dir"
                      v-model="borrador.direccion"
                      type="text"
                      class="cfg-ficha-inp"
                      maxlength="500"
                      autocomplete="street-address"
                      placeholder="Calle y número"
                      :disabled="!modoEdicion || guardando"
                      @blur="alPerderFocoDireccion"
                    />
                  </div>
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="neg-ciudad">Ciudad</label>
                    <input
                      id="neg-ciudad"
                      v-model="borrador.ciudad"
                      type="text"
                      class="cfg-ficha-inp"
                      maxlength="120"
                      autocomplete="address-level2"
                      :disabled="!modoEdicion || guardando"
                    />
                  </div>
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="neg-prov">Provincia</label>
                    <input
                      id="neg-prov"
                      v-model="borrador.provincia"
                      type="text"
                      class="cfg-ficha-inp"
                      maxlength="120"
                      autocomplete="address-level1"
                      :disabled="!modoEdicion || guardando"
                    />
                  </div>
                  <div class="cfg-ficha-campo">
                    <label class="cfg-ficha-etiq" for="neg-cp">Código postal</label>
                    <input
                      id="neg-cp"
                      v-model="borrador.codigoPostal"
                      type="text"
                      class="cfg-ficha-inp cfg-ficha-inp-mono"
                      maxlength="16"
                      autocomplete="postal-code"
                      :disabled="!modoEdicion || guardando"
                    />
                  </div>
                </div>
              </section>

              <div class="cfg-neg-columna-izq">
              <section class="perm-bloque" aria-labelledby="cfg-neg-sec-redes">
                <header class="perm-bloque-enc">
                  <span class="perm-bloque-ico" aria-hidden="true">
                    <Share2 :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-redes" class="perm-bloque-tit">Redes sociales</h2>
                  <span class="perm-bloque-badge">{{ cantidadRedesVisibles }}/3</span>
                </header>
                <div class="perm-bloque-cuerpo cfg-ficha-redes">
                  <div class="cfg-ficha-red">
                    <div class="cfg-ficha-red-cab">
                      <label class="cfg-ficha-red-nom" for="neg-instagram">Instagram</label>
                      <div class="cfg-ficha-red-sw">
                        <span
                          class="cfg-ficha-red-sw-txt"
                          :class="{ 'cfg-ficha-red-sw-txt--activa': borrador.mostrarInstagram }"
                        >
                          {{ borrador.mostrarInstagram ? 'Visible' : 'Oculta' }}
                        </span>
                        <label class="perm-sw">
                          <input
                            v-model="borrador.mostrarInstagram"
                            type="checkbox"
                            class="perm-sw-input"
                            role="switch"
                            aria-label="Mostrar Instagram"
                            :disabled="!modoEdicion || guardando"
                          />
                          <span class="perm-sw-ui" aria-hidden="true" />
                        </label>
                      </div>
                    </div>
                    <input
                      id="neg-instagram"
                      :value="borrador.instagram"
                      type="text"
                      class="cfg-ficha-inp"
                      maxlength="120"
                      autocomplete="off"
                      placeholder="usuario o enlace"
                      :disabled="!redSocialHabilitada(borrador.mostrarInstagram)"
                      :class="{ 'cfg-ficha-inp--red-oculta': !borrador.mostrarInstagram }"
                      @input="alEscribirRedSocial('instagram', ($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoRedSocial('instagram')"
                    />
                  </div>

                  <div class="cfg-ficha-red">
                    <div class="cfg-ficha-red-cab">
                      <label class="cfg-ficha-red-nom" for="neg-twitter">Twitter / X</label>
                      <div class="cfg-ficha-red-sw">
                        <span
                          class="cfg-ficha-red-sw-txt"
                          :class="{ 'cfg-ficha-red-sw-txt--activa': borrador.mostrarTwitter }"
                        >
                          {{ borrador.mostrarTwitter ? 'Visible' : 'Oculta' }}
                        </span>
                        <label class="perm-sw">
                          <input
                            v-model="borrador.mostrarTwitter"
                            type="checkbox"
                            class="perm-sw-input"
                            role="switch"
                            aria-label="Mostrar Twitter"
                            :disabled="!modoEdicion || guardando"
                          />
                          <span class="perm-sw-ui" aria-hidden="true" />
                        </label>
                      </div>
                    </div>
                    <input
                      id="neg-twitter"
                      :value="borrador.twitter"
                      type="text"
                      class="cfg-ficha-inp"
                      maxlength="120"
                      autocomplete="off"
                      placeholder="usuario o enlace"
                      :disabled="!redSocialHabilitada(borrador.mostrarTwitter)"
                      :class="{ 'cfg-ficha-inp--red-oculta': !borrador.mostrarTwitter }"
                      @input="alEscribirRedSocial('twitter', ($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoRedSocial('twitter')"
                    />
                  </div>

                  <div class="cfg-ficha-red">
                    <div class="cfg-ficha-red-cab">
                      <label class="cfg-ficha-red-nom" for="neg-tiktok">TikTok</label>
                      <div class="cfg-ficha-red-sw">
                        <span
                          class="cfg-ficha-red-sw-txt"
                          :class="{ 'cfg-ficha-red-sw-txt--activa': borrador.mostrarTiktok }"
                        >
                          {{ borrador.mostrarTiktok ? 'Visible' : 'Oculta' }}
                        </span>
                        <label class="perm-sw">
                          <input
                            v-model="borrador.mostrarTiktok"
                            type="checkbox"
                            class="perm-sw-input"
                            role="switch"
                            aria-label="Mostrar TikTok"
                            :disabled="!modoEdicion || guardando"
                          />
                          <span class="perm-sw-ui" aria-hidden="true" />
                        </label>
                      </div>
                    </div>
                    <input
                      id="neg-tiktok"
                      :value="borrador.tiktok"
                      type="text"
                      class="cfg-ficha-inp"
                      maxlength="120"
                      autocomplete="off"
                      placeholder="usuario o enlace"
                      :disabled="!redSocialHabilitada(borrador.mostrarTiktok)"
                      :class="{ 'cfg-ficha-inp--red-oculta': !borrador.mostrarTiktok }"
                      @input="alEscribirRedSocial('tiktok', ($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoRedSocial('tiktok')"
                    />
                  </div>
                </div>
              </section>

              <section class="perm-bloque" aria-labelledby="cfg-neg-sec-logo">
                <header class="perm-bloque-enc">
                  <span class="perm-bloque-ico" aria-hidden="true">
                    <Image :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-logo" class="perm-bloque-tit">Logo de la tienda</h2>
                </header>
                <div class="perm-bloque-cuerpo cfg-neg-logo-cuerpo">
                  <p class="cfg-neg-logo-ayuda">
                    Imagen de marca para la barra superior, reportes y comprobantes.
                    Debe ser una imagen sin fondo (fondo transparente).
                    Formatos admitidos: PNG, JPG, WEBP o SVG. Tamaño máximo: 2 MB.
                    Al importar un archivo nuevo, reemplaza al actual.
                  </p>

                  <div class="cfg-neg-logo-panel">
                    <div
                      class="cfg-neg-logo-previa"
                      :class="{
                        'cfg-neg-logo-previa--vacia': !urlVistaPreviaLogo,
                        'cfg-neg-logo-previa--con-logo superficie-logo-transparente': !!urlVistaPreviaLogo,
                      }"
                    >
                      <img
                        v-if="urlVistaPreviaLogo"
                        :src="urlVistaPreviaLogo"
                        alt="Logo actual del negocio"
                        class="cfg-neg-logo-img img-logo-transparente"
                      />
                      <span v-else class="cfg-neg-logo-placeholder">Sin logo cargado</span>
                    </div>

                    <div class="cfg-neg-logo-datos">
                      <p v-if="nombreArchivoLogo" class="cfg-neg-logo-archivo cfg-mono">
                        {{ nombreArchivoLogo }}
                      </p>
                      <p v-else class="cfg-neg-logo-archivo cfg-neg-logo-archivo--vacio">
                        Ningún archivo importado
                      </p>

                      <input
                        ref="refInputLogo"
                        type="file"
                        class="pg-sr"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        :disabled="
                          !puedeEditarConfiguracionNegocio ||
                          !modoEdicion ||
                          guardando ||
                          subiendoLogo ||
                          eliminandoLogo
                        "
                        @change="alSeleccionarLogo"
                      />

                      <p
                        v-if="puedeEditarConfiguracionNegocio && !modoEdicion"
                        class="cfg-neg-logo-lectura"
                      >
                        Para importar o quitar el logo, use «Editar configuración».
                      </p>

                      <div
                        v-else-if="puedeEditarConfiguracionNegocio && modoEdicion"
                        class="cfg-neg-logo-acciones"
                      >
                        <button
                          type="button"
                          class="pg-btn-primario cfg-neg-logo-btn-importar"
                          :disabled="guardando || subiendoLogo || eliminandoLogo"
                          :aria-busy="subiendoLogo"
                          @click="abrirSelectorLogo"
                        >
                          <Upload :size="15" aria-hidden="true" />
                          {{
                            subiendoLogo
                              ? 'Importando…'
                              : tieneLogo
                                ? 'Reemplazar logo'
                                : 'Importar logo'
                          }}
                        </button>
                        <button
                          v-if="tieneLogo"
                          type="button"
                          class="pg-btn cfg-neg-logo-quitar"
                          :disabled="guardando || subiendoLogo || eliminandoLogo"
                          @click="quitarLogoNegocio"
                        >
                          <Trash2 :size="15" aria-hidden="true" />
                          Quitar logo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              </div>

              <section class="perm-bloque perm-bloque--apariencia" aria-labelledby="cfg-neg-sec-apariencia">
                <header class="perm-bloque-enc">
                  <span class="perm-bloque-ico" aria-hidden="true">
                    <Palette :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-apariencia" class="perm-bloque-tit">Apariencia · modo claro</h2>
                </header>
                <div class="perm-bloque-cuerpo cfg-tema-apariencia">
                  <div class="cfg-tema-acciones">
                    <p class="cfg-tema-paleta-nombre">
                      Paleta <strong>Horizonte</strong> · índigo suave sobre fondo claro
                    </p>
                    <button
                      type="button"
                      class="pg-btn-reset-filtros cfg-tema-btn-restaurar"
                      :disabled="!modoEdicion || guardando || temaClaroEsPorDefecto"
                      @click="restablecerTemaClaroPorDefecto"
                    >
                      <RotateCcw :size="15" stroke-width="2" aria-hidden="true" />
                      Volver a configuración por defecto
                    </button>
                  </div>

                  <div class="cfg-tema-panel">
                    <div
                      class="cfg-tema-colores cfg-tema-colores--principales"
                      role="group"
                      aria-label="Colores principales del modo claro"
                    >
                        <div
                          v-for="color in definicionesColoresTemaClaroPrincipales"
                          :key="color.campo"
                          class="cfg-tema-color"
                        >
                          <div class="cfg-tema-color-info">
                            <label class="cfg-tema-color-etiq" :for="color.id">
                              {{ color.etiqueta }}
                            </label>
                            <p class="cfg-tema-color-ayuda">{{ color.ayuda }}</p>
                          </div>
                          <div class="cfg-tema-color-control">
                            <label
                              class="cfg-tema-color-muestra"
                              :for="`${color.id}-picker`"
                              :style="{ backgroundColor: borrador[color.campo] }"
                            >
                              <input
                                :id="`${color.id}-picker`"
                                v-model="borrador[color.campo]"
                                type="color"
                                class="cfg-tema-color-input"
                                :aria-labelledby="color.id"
                                :disabled="!modoEdicion || guardando"
                              />
                            </label>
                            <div class="cfg-tema-color-hex-wrap">
                              <label class="pg-sr" :for="color.id">Código hexadecimal</label>
                              <input
                                :id="color.id"
                                :value="borrador[color.campo]"
                                type="text"
                                class="cfg-tema-color-hex cfg-ficha-inp-mono"
                                maxlength="7"
                                spellcheck="false"
                                autocomplete="off"
                                inputmode="text"
                                placeholder="#000000"
                                :disabled="!modoEdicion || guardando"
                                @input="alEscribirColorHex(color.campo, ($event.target as HTMLInputElement).value)"
                                @blur="alPerderFocoColorHex(color.campo, color.porDefecto)"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    <div
                      class="cfg-tema-colores cfg-tema-colores--superficie"
                      role="group"
                      aria-label="Colores de superficie del modo claro"
                    >
                        <div
                          v-for="color in definicionesColoresTemaClaroSuperficie"
                          :key="color.campo"
                          class="cfg-tema-color"
                        >
                          <div class="cfg-tema-color-info">
                            <label class="cfg-tema-color-etiq" :for="color.id">
                              {{ color.etiqueta }}
                            </label>
                            <p class="cfg-tema-color-ayuda">{{ color.ayuda }}</p>
                          </div>
                          <div class="cfg-tema-color-control">
                            <label
                              class="cfg-tema-color-muestra"
                              :for="`${color.id}-picker`"
                              :style="{ backgroundColor: borrador[color.campo] }"
                            >
                              <input
                                :id="`${color.id}-picker`"
                                v-model="borrador[color.campo]"
                                type="color"
                                class="cfg-tema-color-input"
                                :aria-labelledby="color.id"
                                :disabled="!modoEdicion || guardando"
                              />
                            </label>
                            <div class="cfg-tema-color-hex-wrap">
                              <label class="pg-sr" :for="color.id">Código hexadecimal</label>
                              <input
                                :id="color.id"
                                :value="borrador[color.campo]"
                                type="text"
                                class="cfg-tema-color-hex cfg-ficha-inp-mono"
                                maxlength="7"
                                spellcheck="false"
                                autocomplete="off"
                                inputmode="text"
                                placeholder="#000000"
                                :disabled="!modoEdicion || guardando"
                                @input="alEscribirColorHex(color.campo, ($event.target as HTMLInputElement).value)"
                                @blur="alPerderFocoColorHex(color.campo, color.porDefecto)"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    <aside class="cfg-tema-previa-wrap" aria-labelledby="cfg-tema-previa-titulo">
                      <div class="cfg-tema-previa-encabezado">
                        <h3 id="cfg-tema-previa-titulo" class="cfg-tema-previa-titulo">Vista previa</h3>
                        <p class="cfg-tema-previa-subtitulo">
                          Simulación de la interfaz al guardar con modo oscuro desactivado.
                        </p>
                      </div>

                      <div class="cfg-tema-previa" :style="estilosVistaPreviaTemaClaro">
                        <div class="cfg-tema-previa-shell">
                          <header class="cfg-tema-previa-nav" aria-hidden="true">
                            <div class="cfg-tema-previa-nav-marca">
                              <span
                                v-if="urlVistaPreviaLogo"
                                class="cfg-tema-previa-nav-logo superficie-logo-transparente"
                              >
                                <img
                                  :src="urlVistaPreviaLogo"
                                  alt=""
                                  class="cfg-tema-previa-nav-logo-img img-logo-transparente"
                                />
                              </span>
                              <span v-else class="cfg-tema-previa-nav-iniciales">
                                {{ inicialesVistaPreviaNegocio }}
                              </span>
                              <span class="cfg-tema-previa-nav-nombre">
                                {{ vistaPreviaNombre || 'Mi tienda' }}
                              </span>
                            </div>
                            <span class="cfg-tema-previa-nav-usuario">Usuario</span>
                          </header>

                          <div class="cfg-tema-previa-vista">
                            <div class="cfg-tema-previa-pg-cab">
                              <span class="cfg-tema-previa-pg-eyebrow">Ventas · POS</span>
                              <span class="cfg-tema-previa-pg-titulo">Centro de ventas</span>
                              <span class="cfg-tema-previa-pg-sub">
                                Texto secundario sobre el fondo general.
                              </span>
                            </div>

                            <div class="cfg-tema-previa-marco">
                              <div class="cfg-tema-previa-seccion-enc">Sección · ejemplo</div>
                              <div class="cfg-tema-previa-seccion-cuerpo">
                                <div class="cfg-tema-previa-campo">
                                  <span class="cfg-tema-previa-campo-etiq">Campo de formulario</span>
                                  <span class="cfg-tema-previa-campo-inp">Valor de ejemplo</span>
                                </div>
                                <div class="cfg-tema-previa-acciones">
                                  <button type="button" class="cfg-tema-previa-btn cfg-tema-previa-btn--sec">
                                    Secundario
                                  </button>
                                  <button type="button" class="cfg-tema-previa-btn">Primario</button>
                                </div>
                              </div>
                            </div>

                            <div class="cfg-tema-previa-tabla" role="presentation">
                              <div class="cfg-tema-previa-tabla-enc">
                                <span>Producto</span>
                                <span>Stock</span>
                              </div>
                              <div class="cfg-tema-previa-tabla-fila">
                                <span>Artículo A</span>
                                <span class="cfg-tema-previa-tabla-num">12</span>
                              </div>
                              <div class="cfg-tema-previa-tabla-fila cfg-tema-previa-tabla-fila--alt">
                                <span>Artículo B</span>
                                <span class="cfg-tema-previa-tabla-num">5</span>
                              </div>
                            </div>

                            <p class="cfg-tema-previa-pie">
                              <span class="cfg-tema-previa-chip">Etiqueta acento</span>
                              Texto apagado para descripciones y ayudas.
                            </p>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>

                  <p class="cfg-tema-nota">
                    El modo oscuro es fijo para todos. Cada usuario elige si lo usa desde su menú
                    de cuenta; si lo desactiva, ve estos colores personalizados.
                  </p>
                </div>
              </section>
        </fieldset>
      </form>
    </div>
  </section>
</template>

<style scoped>
.cfg-neg-logo-btn-importar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  font-size: 0.84rem;
}

.cfg-neg-logo-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cfg-neg-logo-ayuda {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.cfg-neg-logo-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  align-items: stretch;
}

@media (min-width: 640px) {
  .cfg-neg-logo-panel {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }
}

@media (min-width: 1024px) {
  .perm-cuerpo--negocio .cfg-neg-logo-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .perm-cuerpo--negocio .cfg-neg-logo-previa {
    width: 100%;
    max-width: none;
  }
}

.cfg-neg-logo-previa {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 11.5rem);
  min-height: 7rem;
  padding: 0.85rem;
  border-radius: 12px;
}

.cfg-neg-logo-previa--vacia {
  border: 1px dashed var(--color-borde);
  background: var(--color-fondo);
}

.cfg-neg-logo-previa--con-logo {
  border: 1px solid var(--color-borde);
}

.cfg-neg-logo-img {
  max-width: 100%;
  max-height: 6rem;
}

.cfg-neg-logo-placeholder {
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
  text-align: center;
}

.cfg-neg-logo-datos {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.65rem;
  min-width: min(100%, 14rem);
}

.cfg-neg-logo-archivo {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-texto-suave);
}

.cfg-neg-logo-archivo--vacio {
  color: var(--color-texto-apagado);
}

.cfg-neg-logo-lectura {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--color-texto-apagado);
}

.cfg-neg-logo-acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.cfg-neg-logo-acciones .pg-btn,
.cfg-neg-logo-acciones .pg-btn-primario {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.cfg-neg-logo-quitar {
  border-color: rgba(251, 113, 133, 0.4);
  color: var(--color-peligro);
}
</style>
