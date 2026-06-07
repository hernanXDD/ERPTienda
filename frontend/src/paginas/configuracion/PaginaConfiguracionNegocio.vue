<script setup lang="ts">
import { IdCard, MapPin, Phone, Share2, Store } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';
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
import { useNegocioStore } from '../../stores/negocio';
import type { DatosNegocioEditable } from '../../tipos/negocio';

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

const cargandoInicial = ref(true);
const guardando = ref(false);
const modoEdicion = ref(false);
const mensajeExito = ref('');
const mensajeError = ref('');

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

onMounted(async () => {
  mensajeExito.value = '';
  mensajeError.value = '';
  try {
    await negocioStore.cargar();
    aplicarNegocioAlBorrador();
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudieron cargar los datos del negocio.');
  } finally {
    cargandoInicial.value = false;
  }
});

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
  if (guardando.value) return;
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
            <button type="submit" class="pg-btn-primario" :disabled="guardando">
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
  min-height: 0;
  overflow: hidden;
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
</style>

<style src="../../estilos/formularioConfiguracion.css"></style>
