<script setup lang="ts">
import { IdCard, Image, MapPin, Phone, Share2, Store, Trash2, Upload } from 'lucide-vue-next';
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

const vistaPreviaNombre = computed(() => borrador.value.nombre.trim());
const vistaPreviaCuit = computed(() => borrador.value.cuit.trim());

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
  <section class="pg-wrap cfg-ficha-vista" aria-labelledby="titulo-config-negocio">
    <div class="pg-marco cfg-neg-marco cfg-ficha-marco">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Store :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Configuración · Negocio</p>
              <h1 id="titulo-config-negocio" class="pg-titulo">Datos de la tienda</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
              <p
                v-if="vistaPreviaNombre || vistaPreviaCuit"
                class="cfg-neg-vista-previa"
                aria-live="polite"
              >
                <span v-if="vistaPreviaNombre" class="cfg-neg-chip cfg-neg-chip--nom">
                  {{ vistaPreviaNombre }}
                </span>
                <span v-if="vistaPreviaCuit" class="cfg-neg-chip cfg-neg-chip--doc cfg-mono">
                  {{ vistaPreviaCuit }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div class="cfg-neg-bandera" aria-hidden="true" />

      <div class="cfg-ficha-panel">
        <div v-if="cargandoInicial" class="cfg-ficha-carga" role="status">
          <div class="cfg-ficha-carga-pulso" />
          <p>Cargando ficha del negocio…</p>
        </div>

        <form
          v-else
          id="form-negocio"
          class="cfg-ficha-form"
          :class="{ 'cfg-ficha-form--solo-lectura': !modoEdicion }"
          @submit.prevent="manejarAccionPie"
        >
          <div class="cfg-ficha-scroll">
            <div class="cfg-ficha-contenido cfg-ficha-contenido--negocio">
              <section class="cfg-ficha-bloque" aria-labelledby="cfg-neg-sec-ident">
                <div class="cfg-ficha-bloque-enc">
                  <span class="cfg-ficha-bloque-ico" aria-hidden="true">
                    <IdCard :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-ident" class="cfg-ficha-bloque-tit">Identificación</h2>
                </div>
                <div class="cfg-ficha-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--vertical">
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

              <section class="cfg-ficha-bloque" aria-labelledby="cfg-neg-sec-contacto">
                <div class="cfg-ficha-bloque-enc">
                  <span class="cfg-ficha-bloque-ico" aria-hidden="true">
                    <Phone :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-contacto" class="cfg-ficha-bloque-tit">Contacto</h2>
                </div>
                <div class="cfg-ficha-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--vertical">
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

              <section class="cfg-ficha-bloque" aria-labelledby="cfg-neg-sec-ubicacion">
                <div class="cfg-ficha-bloque-enc">
                  <span class="cfg-ficha-bloque-ico" aria-hidden="true">
                    <MapPin :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-ubicacion" class="cfg-ficha-bloque-tit">Ubicación</h2>
                </div>
                <div class="cfg-ficha-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--tres">
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

              <section class="cfg-ficha-bloque" aria-labelledby="cfg-neg-sec-redes">
                <div class="cfg-ficha-bloque-enc">
                  <span class="cfg-ficha-bloque-ico" aria-hidden="true">
                    <Share2 :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-redes" class="cfg-ficha-bloque-tit">Redes sociales</h2>
                </div>
                <div class="cfg-ficha-bloque-cuerpo cfg-ficha-redes">
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
                        <label class="cfg-ficha-sw">
                          <input
                            v-model="borrador.mostrarInstagram"
                            type="checkbox"
                            class="cfg-ficha-sw-input"
                            role="switch"
                            aria-label="Mostrar Instagram"
                            :disabled="!modoEdicion || guardando"
                          />
                          <span class="cfg-ficha-sw-ui" aria-hidden="true" />
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
                        <label class="cfg-ficha-sw">
                          <input
                            v-model="borrador.mostrarTwitter"
                            type="checkbox"
                            class="cfg-ficha-sw-input"
                            role="switch"
                            aria-label="Mostrar Twitter"
                            :disabled="!modoEdicion || guardando"
                          />
                          <span class="cfg-ficha-sw-ui" aria-hidden="true" />
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
                        <label class="cfg-ficha-sw">
                          <input
                            v-model="borrador.mostrarTiktok"
                            type="checkbox"
                            class="cfg-ficha-sw-input"
                            role="switch"
                            aria-label="Mostrar TikTok"
                            :disabled="!modoEdicion || guardando"
                          />
                          <span class="cfg-ficha-sw-ui" aria-hidden="true" />
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

              <section
                class="cfg-ficha-bloque cfg-ficha-bloque--logo"
                aria-labelledby="cfg-neg-sec-logo"
              >
                <div class="cfg-ficha-bloque-enc">
                  <span class="cfg-ficha-bloque-ico" aria-hidden="true">
                    <Image :size="18" stroke-width="2" />
                  </span>
                  <h2 id="cfg-neg-sec-logo" class="cfg-ficha-bloque-tit">Logo de la tienda</h2>
                </div>
                <div class="cfg-ficha-bloque-cuerpo cfg-neg-logo-cuerpo">
                  <p class="cfg-neg-logo-ayuda">
                    Un solo archivo en la carpeta <span class="cfg-mono">logo/</span> del servidor.
                    Formatos: PNG, JPG, WEBP o SVG. Máximo 2 MB. Al subir otro, reemplaza el anterior.
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
                        Use «Editar configuración» para importar o quitar el logo.
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

              <div v-if="mensajeError || mensajeExito" class="cfg-ficha-feedback">
                <p v-if="mensajeError" class="cfg-ficha-alerta cfg-ficha-alerta--error" role="alert">
                  {{ mensajeError }}
                </p>
                <p v-if="mensajeExito" class="cfg-ficha-alerta cfg-ficha-alerta--ok" role="status">
                  {{ mensajeExito }}
                </p>
              </div>
            </div>
          </div>

          <footer class="cfg-ficha-pie">
            <button
              v-if="puedeEditarConfiguracionNegocio"
              type="submit"
              class="pg-btn-primario"
              :disabled="guardando"
            >
              {{
                guardando
                  ? 'Guardando…'
                  : modoEdicion
                    ? 'Guardar configuración'
                    : 'Editar configuración'
              }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cfg-neg-marco {
  display: flex;
  flex-direction: column;
  min-height: auto;
}

.cfg-neg-vista-previa {
  margin: 0.48rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  align-items: center;
}

.cfg-neg-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0.22rem 0.58rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.3;
}

.cfg-neg-chip--nom {
  color: var(--color-texto);
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.1);
}

.cfg-neg-chip--doc {
  color: var(--color-texto-suave);
  border: 1px solid rgba(124, 140, 240, 0.22);
  background: rgba(7, 11, 20, 0.45);
}

.cfg-neg-bandera {
  height: 4px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(124, 140, 240, 0.15),
    rgba(154, 124, 240, 0.55),
    rgba(124, 140, 240, 0.2)
  );
}

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
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
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
  background: rgba(7, 11, 20, 0.35);
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

<style src="../../estilos/formularioConfiguracion.css"></style>
