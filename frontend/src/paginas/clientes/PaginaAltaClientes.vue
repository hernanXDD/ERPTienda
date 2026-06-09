<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  errorFormatoCampoCliente,
  recolectarErroresFormatoCliente,
  type CampoValidacionFormatoCliente,
  type ErroresFormatoCliente,
} from '../../modulos/clientes/validadoresCliente';
import { formatearDocumentoClienteAlEscribir } from '../../modulos/clientes/formateadorDocumentoCliente';
import {
  formatearCorreoClienteAlEscribir,
  formatearTelefonoClienteAlEscribir,
  formatearTelefonoClienteAlPerderFoco,
  normalizarCorreoClienteAlPerderFoco,
  normalizarDireccionClienteAlPerderFoco,
  normalizarLimiteCuentaCorriente,
  normalizarNombreClienteAlPerderFoco,
} from '../../modulos/clientes/formateadorEntradaCliente';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useClientesStore } from '../../stores/clientes';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import type { Cliente } from '../../tipos/cliente';
import { CONDICION_IVA_POR_DEFECTO } from '../../tipos/condicionIva';
import { CONDICIONES_IVA } from '../../datos/condicionesIva';
import { IdCard, Landmark, MapPin, Phone, Users } from 'lucide-vue-next';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import { usePermisosOperador } from '../../composables/usePermisosOperador';

const descripcionPagina = obtenerDescripcionPagina('clientes-alta');
const { tienePermiso } = usePermisosOperador();
const puedeGestionarClientes = computed(() => tienePermiso('puedeGestionarClientes'));

type ModoDialogoCliente = 'alta' | 'detalle';

const clientesStore = useClientesStore();
const configuracionSistemaStore = useConfiguracionSistemaStore();
const { clientes } = storeToRefs(clientesStore);
const { parametros: parametrosSistema } = storeToRefs(configuracionSistemaStore);

const busquedaNombre = ref('');
const refDialog = useTemplateRef<HTMLDialogElement>('refDialog');
const borrador = ref<(Omit<Cliente, 'id'> & { id?: string }) | null>(null);
const borradorPersistido = ref<(Omit<Cliente, 'id'> & { id?: string }) | null>(null);
const modoDialogoCliente = ref<ModoDialogoCliente>('detalle');
const edicionClienteActiva = ref(false);
const erroresValidacionCliente = ref<ErroresFormatoCliente>({});
const mensajeErrorGeneralClienteGuardar = ref('');

const formularioClienteEditable = computed(
  () => modoDialogoCliente.value === 'alta' || edicionClienteActiva.value,
);

const tituloModalCliente = computed(() => {
  if (modoDialogoCliente.value === 'alta') return 'Nuevo cliente';
  return edicionClienteActiva.value ? 'Editar cliente' : 'Detalle del cliente';
});

const textoBotonPieSecundario = computed(() => {
  if (modoDialogoCliente.value === 'alta') return 'Cancelar';
  return edicionClienteActiva.value ? 'Cancelar' : 'Cerrar';
});

function clonarBorradorCliente(
  origen: Omit<Cliente, 'id'> & { id?: string },
): Omit<Cliente, 'id'> & { id?: string } {
  return { ...origen };
}

function crearBorradorDesdeCliente(c: Cliente): Omit<Cliente, 'id'> & { id?: string } {
  return {
    ...c,
    nombre: normalizarNombreClienteAlPerderFoco(c.nombre),
    documento: formatearDocumentoClienteAlEscribir(c.documento),
    correoElectronico: normalizarCorreoClienteAlPerderFoco(c.correoElectronico),
    telefonoPrincipal: formatearTelefonoClienteAlPerderFoco(c.telefonoPrincipal),
    telefonoAlternativo: formatearTelefonoClienteAlPerderFoco(c.telefonoAlternativo),
    direccion: normalizarDireccionClienteAlPerderFoco(c.direccion),
    limiteCompraCuentaCorriente: normalizarLimiteCuentaCorriente(c.limiteCompraCuentaCorriente),
  };
}

function limpiarErrorCampo(campo: CampoValidacionFormatoCliente): void {
  if (!erroresValidacionCliente.value[campo]) return;
  const { [campo]: _omitido, ...resto } = erroresValidacionCliente.value;
  erroresValidacionCliente.value = resto;
}

function valorCampoFormatoCliente(campo: CampoValidacionFormatoCliente): string {
  if (!borrador.value) return '';
  switch (campo) {
    case 'documento':
      return borrador.value.documento;
    case 'correoElectronico':
      return borrador.value.correoElectronico;
    case 'telefonoPrincipal':
      return borrador.value.telefonoPrincipal;
    case 'telefonoAlternativo':
      return borrador.value.telefonoAlternativo;
  }
}

function validarCampoClienteAlPerderFoco(campo: CampoValidacionFormatoCliente): void {
  if (!borrador.value) return;
  const mensaje = errorFormatoCampoCliente(campo, valorCampoFormatoCliente(campo));
  if (mensaje) {
    erroresValidacionCliente.value = { ...erroresValidacionCliente.value, [campo]: mensaje };
  } else {
    limpiarErrorCampo(campo);
  }
}

function crearClienteVacio(): Omit<Cliente, 'id'> & { id?: string } {
  return {
    nombre: '',
    documento: '',
    correoElectronico: '',
    telefonoPrincipal: '',
    telefonoAlternativo: '',
    direccion: '',
    condicionIva: CONDICION_IVA_POR_DEFECTO,
    limiteCompraCuentaCorriente: 0,
    cuentaCorrienteHabilitada: false,
    habilitado: true,
  };
}

watch(
  () => borrador.value?.cuentaCorrienteHabilitada,
  (habilitada) => {
    if (!borrador.value || !habilitada) return;
    if (borrador.value.limiteCompraCuentaCorriente <= 0) {
      borrador.value.limiteCompraCuentaCorriente = parametrosSistema.value.maximoCuentaCorriente;
    }
  },
);

const clientesFiltrados = computed(() => {
  const q = busquedaNombre.value.trim().toLowerCase();
  return [...clientes.value]
    .filter((c) => {
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.documento.toLowerCase().includes(q) ||
        c.correoElectronico.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
});

function abrirAltaCliente() {
  erroresValidacionCliente.value = {};
  mensajeErrorGeneralClienteGuardar.value = '';
  modoDialogoCliente.value = 'alta';
  edicionClienteActiva.value = true;
  borradorPersistido.value = null;
  borrador.value = crearClienteVacio();
  refDialog.value?.showModal();
}

function abrirDetalleCliente(c: Cliente) {
  erroresValidacionCliente.value = {};
  mensajeErrorGeneralClienteGuardar.value = '';
  modoDialogoCliente.value = 'detalle';
  edicionClienteActiva.value = false;
  const copia = crearBorradorDesdeCliente(c);
  borrador.value = clonarBorradorCliente(copia);
  borradorPersistido.value = clonarBorradorCliente(copia);
  refDialog.value?.showModal();
}

function activarEdicionCliente() {
  if (!borrador.value || modoDialogoCliente.value !== 'detalle') return;
  erroresValidacionCliente.value = {};
  mensajeErrorGeneralClienteGuardar.value = '';
  edicionClienteActiva.value = true;
}

function cancelarEdicionCliente() {
  if (modoDialogoCliente.value === 'alta') {
    cerrarDialogo();
    return;
  }
  if (!borradorPersistido.value) {
    cerrarDialogo();
    return;
  }
  erroresValidacionCliente.value = {};
  mensajeErrorGeneralClienteGuardar.value = '';
  borrador.value = clonarBorradorCliente(borradorPersistido.value);
  edicionClienteActiva.value = false;
}

function alPieSecundarioCliente() {
  if (modoDialogoCliente.value === 'detalle' && edicionClienteActiva.value) {
    cancelarEdicionCliente();
    return;
  }
  cerrarDialogo();
}

function alEscribirDocumentoCliente(textoUsuario: string) {
  if (!borrador.value) return;
  borrador.value.documento = formatearDocumentoClienteAlEscribir(textoUsuario);
  limpiarErrorCampo('documento');
}

function alPerderFocoDocumentoCliente() {
  if (!borrador.value) return;
  borrador.value.documento = formatearDocumentoClienteAlEscribir(borrador.value.documento);
  validarCampoClienteAlPerderFoco('documento');
}

function alEscribirTelefonoCliente(
  campo: 'telefonoPrincipal' | 'telefonoAlternativo',
  textoUsuario: string,
) {
  if (!borrador.value) return;
  borrador.value[campo] = formatearTelefonoClienteAlEscribir(textoUsuario);
  limpiarErrorCampo(campo);
}

function alPerderFocoTelefonoCliente(campo: 'telefonoPrincipal' | 'telefonoAlternativo') {
  if (!borrador.value) return;
  borrador.value[campo] = formatearTelefonoClienteAlPerderFoco(borrador.value[campo]);
  validarCampoClienteAlPerderFoco(campo);
}

function alEscribirCorreoCliente(textoUsuario: string) {
  if (!borrador.value) return;
  borrador.value.correoElectronico = formatearCorreoClienteAlEscribir(textoUsuario);
  limpiarErrorCampo('correoElectronico');
}

function alPerderFocoCorreoCliente() {
  if (!borrador.value) return;
  borrador.value.correoElectronico = normalizarCorreoClienteAlPerderFoco(borrador.value.correoElectronico);
  validarCampoClienteAlPerderFoco('correoElectronico');
}

function alPerderFocoNombreCliente() {
  if (!borrador.value) return;
  borrador.value.nombre = normalizarNombreClienteAlPerderFoco(borrador.value.nombre);
}

function alPerderFocoDireccionCliente() {
  if (!borrador.value) return;
  borrador.value.direccion = normalizarDireccionClienteAlPerderFoco(borrador.value.direccion);
}

function alPerderFocoLimiteCuentaCorriente() {
  if (!borrador.value) return;
  borrador.value.limiteCompraCuentaCorriente = normalizarLimiteCuentaCorriente(
    borrador.value.limiteCompraCuentaCorriente,
  );
}

function alPegarDocumentoCliente(event: Event) {
  event.preventDefault();
  const clipboard = event as ClipboardEvent;
  const pegado = clipboard.clipboardData?.getData('text') ?? '';
  alEscribirDocumentoCliente(pegado);
}

function cerrarDialogo() {
  refDialog.value?.close();
  borrador.value = null;
  borradorPersistido.value = null;
  edicionClienteActiva.value = false;
}

const enfocablesValidacionCliente: Partial<
  Record<CampoValidacionFormatoCliente, string>
> = {
  documento: 'ed-doc',
  correoElectronico: 'ed-correo',
  telefonoPrincipal: 'ed-tel-p',
  telefonoAlternativo: 'ed-tel-alt',
};

async function enfocarPrimerCampoConError(errores: ErroresFormatoCliente): Promise<void> {
  const ordenPrioridad: CampoValidacionFormatoCliente[] = [
    'documento',
    'correoElectronico',
    'telefonoPrincipal',
    'telefonoAlternativo',
  ];
  await nextTick();
  for (const nombreCampo of ordenPrioridad) {
    if (!errores[nombreCampo]) continue;
    const idDom = enfocablesValidacionCliente[nombreCampo];
    if (idDom) document.getElementById(idDom)?.focus();
    return;
  }
}

async function guardarCliente() {
  if (!borrador.value) return;
  erroresValidacionCliente.value = {};
  mensajeErrorGeneralClienteGuardar.value = '';

  const { id, ...rest } = borrador.value;
  const datos: Omit<Cliente, 'id'> = {
    ...rest,
    nombre: normalizarNombreClienteAlPerderFoco(rest.nombre),
    documento: formatearDocumentoClienteAlEscribir(rest.documento).trim(),
    correoElectronico: normalizarCorreoClienteAlPerderFoco(rest.correoElectronico),
    telefonoPrincipal: formatearTelefonoClienteAlPerderFoco(rest.telefonoPrincipal),
    telefonoAlternativo: formatearTelefonoClienteAlPerderFoco(rest.telefonoAlternativo),
    direccion: normalizarDireccionClienteAlPerderFoco(rest.direccion),
    limiteCompraCuentaCorriente: rest.cuentaCorrienteHabilitada
      ? normalizarLimiteCuentaCorriente(rest.limiteCompraCuentaCorriente)
      : 0,
  };

  const erroresFormato = recolectarErroresFormatoCliente({
    documento: datos.documento,
    correoElectronico: datos.correoElectronico,
    telefonoPrincipal: datos.telefonoPrincipal,
    telefonoAlternativo: datos.telefonoAlternativo,
  });

  if (Object.keys(erroresFormato).length > 0) {
    erroresValidacionCliente.value = erroresFormato;
    await enfocarPrimerCampoConError(erroresFormato);
    return;
  }

  const cliente: Omit<Cliente, 'id'> = { ...datos };
  let guardadoOk = false;
  try {
    if (modoDialogoCliente.value === 'alta') {
      const creado = await clientesStore.agregarCliente(cliente);
      guardadoOk = creado != null;
    } else if (id) {
      guardadoOk = await clientesStore.actualizarCliente(id, datos);
    }
  } catch (error) {
    mensajeErrorGeneralClienteGuardar.value = mensajeErrorHttp(
      error,
      'No se pudo guardar el cliente. Intentá de nuevo.',
    );
    return;
  }

  if (!guardadoOk) {
    const duplicado = clientesStore.documentoUsadoPorOtroCliente(
      datos.documento,
      modoDialogoCliente.value === 'detalle' ? id : undefined,
    );
    if (duplicado) {
      erroresValidacionCliente.value = {
        documento:
          'Ya existe otro cliente con el mismo documento o CUIT. Revisá el dato o abrilo desde la lista.',
      };
      await nextTick();
      document.getElementById('ed-doc')?.focus();
    } else {
      mensajeErrorGeneralClienteGuardar.value =
        'No se pudo guardar el cliente. Intentá de nuevo.';
    }
    return;
  }

  if (modoDialogoCliente.value === 'alta') {
    cerrarDialogo();
    return;
  }

  const borradorGuardado = clonarBorradorCliente({
    id,
    ...datos,
    documento: formatearDocumentoClienteAlEscribir(datos.documento),
  });
  borrador.value = borradorGuardado;
  borradorPersistido.value = clonarBorradorCliente(borradorGuardado);
  edicionClienteActiva.value = false;
}

function alCerrarDialogo() {
  borrador.value = null;
  borradorPersistido.value = null;
  edicionClienteActiva.value = false;
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-alta-clientes">
    <div class="pg-marco pg-marco--tarjetas pg-marco--clientes">
    <header class="pg-cab">
      <div class="pg-cab-txt">
        <div class="pg-cab-izq">
          <Users :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
          <div>
            <p class="pg-eyebrow">Ventas · Clientes</p>
            <h1 id="titulo-alta-clientes" class="pg-titulo">Clientes</h1>
            <p class="pg-sub">{{ descripcionPagina }}</p>
          </div>
        </div>
      </div>
    </header>

    <div class="pg-barra">
      <div class="pg-barra-fila">
        <div class="pg-barra-col pg-barra-col--busq">
          <label class="pg-filtro-etiq" for="busq-nom">Buscar</label>
          <input
            id="busq-nom"
            v-model="busquedaNombre"
            type="search"
            class="pg-filtro-inp"
            placeholder="Nombre, documento o correo…"
            autocomplete="off"
          />
        </div>
        <div class="pg-barra-col pg-barra-col--accion">
          <button
            v-if="puedeGestionarClientes"
            type="button"
            class="pg-btn-primario"
            @click="abrirAltaCliente"
          >
            Nuevo cliente
          </button>
        </div>
      </div>
    </div>

    <section class="pg-cuerpo pg-cuerpo--grilla">
    <div
      v-if="clientesFiltrados.length"
      class="pg-grilla-viewport"
      aria-label="Clientes registrados"
    >
      <div class="pg-grilla-wrap">
        <article
          v-for="c in clientesFiltrados"
          :key="c.id"
          class="lc-card"
          :class="{ 'lc-card--inhabil': !c.habilitado }"
        >
          <div class="lc-card-afilado" aria-hidden="true" />
          <div class="lc-card-cuerpo lc-card-cuerpo--resumida">
            <header class="lc-card-cab">
              <h2 class="lc-card-nom">{{ c.nombre }}</h2>
              <span v-if="!c.habilitado" class="lc-badge">Inhabilitado</span>
            </header>
            <p class="lc-card-doc lc-mono" :title="c.documento">{{ c.documento }}</p>
            <div class="lc-card-estados">
              <div class="lc-card-fila-estado" aria-label="Estado para ventas">
                <span class="lc-card-etiq-cc">Ventas</span>
                <span
                  :class="c.habilitado ? 'lc-chip lc-chip--si' : 'lc-chip lc-chip--no'"
                >
                  {{ c.habilitado ? 'Habilitado' : 'Inhabilitado' }}
                </span>
              </div>
              <div class="lc-card-fila-estado" aria-label="Cuenta corriente">
                <span class="lc-card-etiq-cc">C. corr.</span>
                <span
                  :class="c.cuentaCorrienteHabilitada ? 'lc-chip lc-chip--si' : 'lc-chip lc-chip--no'"
                >
                  {{ c.cuentaCorrienteHabilitada ? 'Sí' : 'No' }}
                </span>
              </div>
            </div>

            <footer class="lc-card-pie">
              <div class="lc-card-acciones">
                <button type="button" class="lc-btn-detalle" @click="abrirDetalleCliente(c)">
                  Detalle
                </button>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
    <p v-else-if="clientes.length" class="pg-vacio--grilla" role="status">
      No hay clientes que coincidan con la búsqueda.
    </p>
    <div v-else class="pg-vacio--grilla" role="status">
      <span class="pg-vacio--grilla-tit">No hay clientes</span>
      <span>
        Creá la primera ficha con «Nuevo cliente».
      </span>
    </div>

    </section>

    </div>

    <Teleport to="body">
      <dialog
        ref="refDialog"
        class="lc-modal lc-modal-edicion-cliente"
        aria-labelledby="lc-dlg-tit"
        @close="alCerrarDialogo"
        @cancel.prevent="cerrarDialogo"
      >
        <div v-if="borrador" class="lc-ed-panel" @click.stop>
          <header class="lc-ed-cab">
            <div class="lc-ed-cab-marca">
              <p class="lc-ed-eyebrow">Clientes · datos maestros</p>
              <h2 id="lc-dlg-tit" class="lc-ed-tit">
                {{ tituloModalCliente }}
              </h2>
              <p v-if="modoDialogoCliente === 'alta'" id="lc-dlg-sub" class="lc-ed-sub">
                Registre los datos para ventas, facturación y seguimiento del cliente.
              </p>
              <p
                v-else-if="borrador.nombre.trim()"
                id="lc-dlg-sub"
                class="lc-ed-contexto"
              >
                <span class="lc-ed-contexto-nombre">{{ borrador.nombre.trim() }}</span>
                <span v-if="borrador.documento" class="lc-ed-chip-doc lc-ed-inp-mono">
                  {{ borrador.documento }}
                </span>
              </p>
              <p v-else id="lc-dlg-sub" class="lc-ed-sub">
                Consulte los datos del cliente seleccionado.
              </p>
            </div>
            <div class="lc-ed-cab-acciones">
              <div class="lc-ed-hab">
                <span id="lc-ed-hab-lbl" class="lc-ed-hab-lbl">Habilitado</span>
                <label
                  class="lc-sw lc-sw--compacto lc-ed-hab-sw"
                  :class="{ 'lc-ed-hab-sw--solo-lectura': !formularioClienteEditable }"
                  aria-labelledby="lc-ed-hab-lbl"
                >
                  <input
                    id="ed-hab"
                    v-model="borrador.habilitado"
                    type="checkbox"
                    class="lc-sw-input"
                    role="switch"
                    :disabled="!formularioClienteEditable"
                    :aria-label="
                      borrador.habilitado
                        ? 'Cliente habilitado para ventas'
                        : 'Cliente inhabilitado para ventas'
                    "
                  />
                  <span class="lc-sw-ui" aria-hidden="true" />
                </label>
              </div>
              <button type="button" class="lc-modal-x" aria-label="Cerrar" @click="cerrarDialogo">
                ×
              </button>
            </div>
          </header>

          <div class="lc-ed-bandera" aria-hidden="true" />

          <form
            class="lc-ed-form"
            :class="{ 'lc-ed-form--solo-lectura': !formularioClienteEditable }"
            aria-describedby="lc-dlg-sub"
            @submit.prevent="guardarCliente"
          >
            <div class="lc-ed-cuerpo">
              <section class="lc-ed-bloque" aria-labelledby="lc-sec-ident">
                <header class="lc-ed-bloque-cab">
                  <IdCard class="lc-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="lc-ed-bloque-txt">
                    <h3 id="lc-sec-ident" class="lc-ed-bloque-tit">Identificación</h3>
                    <p class="lc-ed-bloque-desc">Nombre, documento y condición fiscal</p>
                  </div>
                </header>
                <div class="lc-ed-fila lc-ed-fila--ident">
                  <div class="lc-ed-campo lc-ed-campo--nombre">
                    <label class="lc-ed-etiq" for="ed-nombre">Nombre o razón social</label>
                    <input
                      id="ed-nombre"
                      v-model="borrador.nombre"
                      type="text"
                      class="lc-ed-inp"
                      required
                      maxlength="120"
                      autocomplete="name"
                      placeholder="Ej. Juan Pérez o Comercial Sur S.R.L."
                      :disabled="!formularioClienteEditable"
                      @blur="alPerderFocoNombreCliente"
                    />
                  </div>
                  <div class="lc-ed-campo">
                    <label class="lc-ed-etiq" for="ed-doc">Documento / CUIT</label>
                    <input
                      id="ed-doc"
                      :value="borrador.documento"
                      type="text"
                      inputmode="text"
                      class="lc-ed-inp lc-ed-inp-mono"
                      :class="{ 'lc-ed-inp--error': erroresValidacionCliente.documento }"
                      placeholder="DNI o CUIT"
                      autocomplete="off"
                      required
                      title="DNI con puntos o CUIT con guiones; se formatea al escribir."
                      :aria-invalid="erroresValidacionCliente.documento ? true : undefined"
                      :aria-describedby="
                        erroresValidacionCliente.documento ? 'ed-doc-err' : undefined
                      "
                      :disabled="!formularioClienteEditable"
                      @input="alEscribirDocumentoCliente(($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoDocumentoCliente"
                      @paste="alPegarDocumentoCliente"
                    />
                    <p
                      v-if="erroresValidacionCliente.documento"
                      id="ed-doc-err"
                      class="lc-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionCliente.documento }}
                    </p>
                  </div>
                  <div class="lc-ed-campo">
                    <label class="lc-ed-etiq" for="ed-cond-iva">Condición IVA</label>
                    <select
                      id="ed-cond-iva"
                      v-model="borrador.condicionIva"
                      class="lc-ed-inp"
                      required
                      :disabled="!formularioClienteEditable"
                    >
                      <option v-for="opcion in CONDICIONES_IVA" :key="opcion.id" :value="opcion.id">
                        {{ opcion.etiqueta }}
                      </option>
                    </select>
                  </div>
                </div>
              </section>

              <section class="lc-ed-bloque" aria-labelledby="lc-sec-contacto">
                <header class="lc-ed-bloque-cab">
                  <Phone class="lc-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="lc-ed-bloque-txt">
                    <h3 id="lc-sec-contacto" class="lc-ed-bloque-tit">Contacto</h3>
                    <p class="lc-ed-bloque-desc">Teléfonos, correo y domicilio comercial</p>
                  </div>
                </header>
                <div class="lc-ed-fila lc-ed-fila--contacto">
                  <div class="lc-ed-campo">
                    <label class="lc-ed-etiq" for="ed-tel-p">Teléfono principal</label>
                    <input
                      id="ed-tel-p"
                      :value="borrador.telefonoPrincipal"
                      type="tel"
                      class="lc-ed-inp lc-ed-inp-mono"
                      autocomplete="tel"
                      inputmode="tel"
                      placeholder="11 2345-6789"
                      :class="{ 'lc-ed-inp--error': erroresValidacionCliente.telefonoPrincipal }"
                      :aria-invalid="erroresValidacionCliente.telefonoPrincipal ? true : undefined"
                      :disabled="!formularioClienteEditable"
                      @input="
                        alEscribirTelefonoCliente(
                          'telefonoPrincipal',
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                      @blur="alPerderFocoTelefonoCliente('telefonoPrincipal')"
                    />
                    <p
                      v-if="erroresValidacionCliente.telefonoPrincipal"
                      class="lc-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionCliente.telefonoPrincipal }}
                    </p>
                  </div>
                  <div class="lc-ed-campo">
                    <label class="lc-ed-etiq" for="ed-tel-alt">Teléfono alternativo</label>
                    <input
                      id="ed-tel-alt"
                      :value="borrador.telefonoAlternativo"
                      type="tel"
                      class="lc-ed-inp lc-ed-inp-mono"
                      autocomplete="tel"
                      inputmode="tel"
                      placeholder="Opcional"
                      :class="{ 'lc-ed-inp--error': erroresValidacionCliente.telefonoAlternativo }"
                      :aria-invalid="erroresValidacionCliente.telefonoAlternativo ? true : undefined"
                      :disabled="!formularioClienteEditable"
                      @input="
                        alEscribirTelefonoCliente(
                          'telefonoAlternativo',
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                      @blur="alPerderFocoTelefonoCliente('telefonoAlternativo')"
                    />
                    <p
                      v-if="erroresValidacionCliente.telefonoAlternativo"
                      class="lc-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionCliente.telefonoAlternativo }}
                    </p>
                  </div>
                  <div class="lc-ed-campo">
                    <label class="lc-ed-etiq" for="ed-correo">Correo electrónico</label>
                    <input
                      id="ed-correo"
                      :value="borrador.correoElectronico"
                      type="email"
                      class="lc-ed-inp"
                      autocomplete="email"
                      inputmode="email"
                      placeholder="cliente@ejemplo.com"
                      :class="{ 'lc-ed-inp--error': erroresValidacionCliente.correoElectronico }"
                      :aria-invalid="erroresValidacionCliente.correoElectronico ? true : undefined"
                      :aria-describedby="
                        erroresValidacionCliente.correoElectronico ? 'ed-correo-err' : undefined
                      "
                      :disabled="!formularioClienteEditable"
                      @input="alEscribirCorreoCliente(($event.target as HTMLInputElement).value)"
                      @blur="alPerderFocoCorreoCliente"
                    />
                    <p
                      v-if="erroresValidacionCliente.correoElectronico"
                      id="ed-correo-err"
                      class="lc-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionCliente.correoElectronico }}
                    </p>
                  </div>
                </div>
                <div class="lc-ed-fila lc-ed-fila--direccion">
                  <div class="lc-ed-campo">
                    <label class="lc-ed-etiq" for="ed-dir">
                      <MapPin class="lc-ed-etiq-ico" aria-hidden="true" :size="14" stroke-width="2.2" />
                      Dirección
                    </label>
                    <input
                      id="ed-dir"
                      v-model="borrador.direccion"
                      type="text"
                      class="lc-ed-inp"
                      maxlength="500"
                      placeholder="Calle, número, localidad, código postal"
                      autocomplete="street-address"
                      :disabled="!formularioClienteEditable"
                      @blur="alPerderFocoDireccionCliente"
                    />
                  </div>
                </div>
              </section>

              <section
                class="lc-ed-bloque lc-ed-bloque--finanza"
                aria-labelledby="lc-sec-cc"
              >
                <header class="lc-ed-bloque-cab lc-ed-bloque-cab--finanza">
                  <Landmark class="lc-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="lc-ed-bloque-txt">
                    <h3 id="lc-sec-cc" class="lc-ed-bloque-tit">Cuenta corriente</h3>
                    <p class="lc-ed-bloque-desc">Condiciones para ventas sin cobro inmediato</p>
                  </div>
                </header>
                <div class="lc-ed-finanza-cuerpo">
                  <label
                    class="lc-ed-check"
                    :class="{ 'lc-ed-check--solo-lectura': !formularioClienteEditable }"
                    for="ed-cc-hab"
                  >
                    <input
                      id="ed-cc-hab"
                      v-model="borrador.cuentaCorrienteHabilitada"
                      type="checkbox"
                      :disabled="!formularioClienteEditable"
                    />
                    <span>Permitir ventas en cuenta corriente con este cliente</span>
                  </label>
                  <div
                    v-if="borrador.cuentaCorrienteHabilitada"
                    class="lc-ed-campo lc-ed-campo--limite"
                  >
                    <label class="lc-ed-etiq" for="ed-lim">Tope estimado de crédito (ARS)</label>
                    <input
                      id="ed-lim"
                      v-model.number="borrador.limiteCompraCuentaCorriente"
                      type="number"
                      min="0"
                      step="1000"
                      class="lc-ed-inp lc-ed-inp-mono lc-ed-inp--limite"
                      inputmode="numeric"
                      placeholder="0"
                      :disabled="!formularioClienteEditable"
                      @blur="alPerderFocoLimiteCuentaCorriente"
                    />
                  </div>
                  <p class="lc-ed-nota">
                    El tope aplica solo si el cliente tiene cuenta corriente activa.
                  </p>
                </div>
              </section>
            </div>

            <p
              v-if="mensajeErrorGeneralClienteGuardar"
              class="lc-error-general-modal lc-error-general-modal--ed"
              role="alert"
            >
              {{ mensajeErrorGeneralClienteGuardar }}
            </p>

            <footer class="lc-ed-pie">
              <button type="button" class="lc-btn-sec" @click="alPieSecundarioCliente">
                {{ textoBotonPieSecundario }}
              </button>
              <button
                v-if="formularioClienteEditable"
                type="submit"
                class="lc-btn-pri"
              >
                {{ modoDialogoCliente === 'alta' ? 'Crear cliente' : 'Guardar cambios' }}
              </button>
              <button
                v-else-if="puedeGestionarClientes"
                type="button"
                class="lc-btn-pri"
                @click="activarEdicionCliente"
              >
                Editar
              </button>
            </footer>
          </form>
        </div>
      </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.pg-marco--clientes {
  --pg-grilla-altura-fila: 9.4rem;
  --pg-reserva-vertical-vista: clamp(12.5rem, 24dvh, 18rem);
}

.pg-marco--clientes .pg-barra-col--accion .pg-btn-primario {
  width: 100%;
}

@media (min-width: 720px) {
  .pg-marco--clientes .pg-barra-col--accion .pg-btn-primario {
    width: auto;
    min-width: 10.5rem;
  }
}

.lc-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: var(--pg-grilla-altura-fila);
  align-self: stretch;
  overflow-x: clip;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: linear-gradient(
    165deg,
    rgba(19, 26, 40, 0.98) 0%,
    rgba(26, 33, 50, 0.92) 38%,
    rgba(26, 33, 50, 0.88) 100%
  );
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.07),
    0 12px 28px rgba(0, 0, 0, 0.32);
  transition:
    border-color 0.18s ease,
    box-shadow 0.2s ease,
    transform 0.18s ease;
}

@media (hover: hover) and (pointer: fine) {
  .lc-card:hover {
    border-color: rgba(124, 140, 240, 0.35);
    box-shadow:
      0 0 0 1px rgba(124, 140, 240, 0.12),
      0 16px 40px rgba(0, 0, 0, 0.38);
    transform: translateY(-1px);
  }
}

.lc-card--inhabil {
  opacity: 0.82;
  border-style: dashed;
  filter: saturate(0.92);
}

.lc-card--inhabil .lc-card-afilado {
  opacity: 0.45;
}

.lc-card-afilado {
  height: 3px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 140, 240, 0.55),
    rgba(154, 124, 240, 0.45),
    transparent
  );
}

.lc-card-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  flex: 1 1 auto;
  padding: 0.65rem 0.82rem 0.55rem;
  overflow: visible;
}

.lc-card-cuerpo--resumida {
  gap: 0.42rem;
  padding: 0.58rem 0.72rem 0.52rem;
}

.lc-card-doc {
  margin: 0;
  flex-shrink: 0;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--color-texto-apagado);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lc-card-fila-estado {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  min-width: 0;
}

.lc-card-estados {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  flex-shrink: 0;
}

.lc-card-etiq-cc {
  font-size: 0.54rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-texto-apagado);
}

.lc-card-cab {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.45rem;
  padding-bottom: 0.05rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.55);
}

.lc-card-nom {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: -0.025em;
  color: var(--color-texto);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.lc-badge {
  flex-shrink: 0;
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.2rem 0.42rem;
  border-radius: 6px;
  background: rgba(251, 113, 133, 0.16);
  border: 1px solid rgba(251, 113, 133, 0.35);
  color: var(--color-peligro);
}

.lc-card-pie {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: auto;
  padding-top: 0.48rem;
  border-top: 1px solid rgba(42, 58, 84, 0.55);
}

@media (max-width: 420px) {
  .lc-card-pie {
    flex-direction: column;
    align-items: stretch;
  }

  .lc-card-acciones {
    width: 100%;
    margin-left: 0;
    justify-content: stretch;
  }

  .lc-card-acciones .lc-btn-detalle {
    flex: 1;
    justify-content: center;
  }
}

.lc-card-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.lc-mono {
  font-variant-numeric: tabular-nums;
}

.lc-btn-detalle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.36rem 0.72rem;
  font-size: 0.7375rem;
  font-weight: 600;
  border-radius: 8px;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
  border: 1px solid var(--color-borde);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-texto-suave);
}

.lc-btn-detalle:hover {
  border-color: rgba(124, 140, 240, 0.35);
  color: var(--color-texto);
  background: rgba(124, 140, 240, 0.08);
}

.lc-btn-detalle:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.lc-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.17rem 0.48rem;
  border-radius: 999px;
  font-size: 0.6275rem;
  font-weight: 700;
  letter-spacing: 0.015em;
  border: 1px solid transparent;
}

.lc-chip--si {
  background: rgba(124, 140, 240, 0.22);
  border-color: rgba(124, 140, 240, 0.35);
  color: var(--color-acento-hover);
}

.lc-chip--no {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-borde);
  color: var(--color-texto-apagado);
}

.lc-error-general-modal {
  margin: 0.25rem 0 0;
  padding: 0.58rem 0.72rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.35);
}

.lc-modal {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
}

.lc-modal:not([open]) {
  display: none;
}

.lc-modal[open] {
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0;
  height: fit-content;
  max-height: calc(100dvh - 1.5rem);
  margin: auto;
  z-index: 9000;
  overflow: hidden;
  border: 1px solid var(--color-borde);
  border-radius: 16px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.08),
    0 28px 64px rgba(0, 0, 0, 0.58);
}

.lc-modal::backdrop {
  background: rgba(7, 11, 20, 0.76);
  backdrop-filter: blur(3px);
}

.lc-modal-edicion-cliente[open] {
  width: min(72rem, calc(100vw - 2rem));
  max-width: min(72rem, calc(100vw - 2rem));
  min-height: min(32rem, calc(100dvh - 2.5rem));
  max-height: calc(100dvh - 1.25rem);
}

@media (min-width: 1200px) {
  .lc-modal-edicion-cliente[open] {
    width: min(80rem, calc(100vw - 3rem));
    max-width: min(80rem, calc(100vw - 3rem));
  }
}

.lc-ed-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-height: min(32rem, calc(100dvh - 2.5rem));
  max-height: calc(100dvh - 1.25rem);
  overflow: hidden;
  background:
    radial-gradient(
      ellipse 140% 90% at 100% -30%,
      rgba(124, 140, 240, 0.11),
      transparent 55%
    ),
    radial-gradient(
      ellipse 80% 60% at 0% 100%,
      rgba(124, 140, 240, 0.05),
      transparent 50%
    ),
    var(--color-fondo-elevado);
}

.lc-ed-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.25rem;
  flex-shrink: 0;
  padding: 1.15rem clamp(1.35rem, 3.5vw, 2rem) 0.65rem;
}

.lc-ed-cab-marca {
  min-width: 0;
  flex: 1;
}

.lc-ed-cab-acciones {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.lc-ed-hab {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.38rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(42, 58, 84, 0.75);
  background: rgba(21, 29, 46, 0.55);
}

.lc-ed-hab:has(.lc-sw-input:checked) {
  border-color: rgba(124, 140, 240, 0.38);
  background: rgba(124, 140, 240, 0.1);
}

.lc-ed-hab-lbl {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  user-select: none;
}

.lc-ed-hab:has(.lc-sw-input:checked) .lc-ed-hab-lbl {
  color: var(--color-texto);
}

.lc-ed-hab-sw--solo-lectura {
  cursor: default;
  opacity: 0.88;
}

.lc-ed-hab-sw--solo-lectura .lc-sw-input:disabled {
  cursor: default;
}

.lc-sw {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  vertical-align: middle;
}

.lc-sw-input {
  position: absolute;
  inset: 0;
  width: 2.5rem;
  height: 1.45rem;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.lc-sw-input:disabled {
  cursor: default;
}

.lc-sw-ui {
  position: relative;
  display: block;
  width: 2.5rem;
  height: 1.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--color-borde);
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
}

.lc-sw-ui::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0.2rem;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  background: var(--color-texto-apagado);
  transform: translate(0, -50%);
  transition:
    transform 0.18s ease,
    background 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.lc-sw-input:focus-visible + .lc-sw-ui {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.lc-sw-input:checked + .lc-sw-ui {
  background: rgba(124, 140, 240, 0.35);
  border-color: rgba(124, 140, 240, 0.55);
}

.lc-sw-input:checked + .lc-sw-ui::after {
  transform: translate(1.05rem, -50%);
  background: var(--color-acento-hover);
}

.lc-sw.lc-sw--compacto .lc-sw-input {
  width: 2.1rem;
  height: 1.2rem;
}

.lc-sw.lc-sw--compacto .lc-sw-ui {
  width: 2.1rem;
  height: 1.2rem;
}

.lc-sw.lc-sw--compacto .lc-sw-ui::after {
  width: 0.88rem;
  height: 0.88rem;
  left: 0.16rem;
}

.lc-sw.lc-sw--compacto .lc-sw-input:checked + .lc-sw-ui::after {
  transform: translate(0.84rem, -50%);
}

.lc-ed-eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  color: rgba(139, 156, 179, 0.95);
}

.lc-ed-tit {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.2;
  color: var(--color-texto);
}

.lc-ed-sub {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
  max-width: 58ch;
}

.lc-ed-contexto {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.75rem;
  margin: 0.55rem 0 0;
}

.lc-ed-contexto-nombre {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  line-height: 1.35;
}

.lc-ed-chip-doc {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.1);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-acento-hover);
}

.lc-ed-bandera {
  height: 3px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(124, 140, 240, 0.12),
    rgba(154, 124, 240, 0.62),
    rgba(124, 140, 240, 0.18)
  );
}

.lc-ed-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.lc-ed-cuerpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.1rem clamp(1.35rem, 3.5vw, 2rem) 1.15rem;
}

@media (max-width: 899px) {
  .lc-modal-edicion-cliente[open] {
    width: min(48rem, calc(100vw - 1.25rem));
    max-width: min(48rem, calc(100vw - 1.25rem));
    min-height: 0;
  }

  .lc-ed-panel {
    min-height: 0;
  }

  .lc-ed-cuerpo {
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

.lc-ed-bloque {
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid rgba(42, 58, 84, 0.8);
  background: rgba(7, 11, 20, 0.32);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  overflow: hidden;
}

.lc-ed-bloque--finanza {
  border-color: rgba(124, 140, 240, 0.28);
  background: linear-gradient(
    160deg,
    rgba(124, 140, 240, 0.09) 0%,
    rgba(7, 11, 20, 0.42) 55%,
    rgba(7, 11, 20, 0.32) 100%
  );
}

.lc-ed-bloque-cab {
  display: flex;
  align-items: flex-start;
  gap: 0.72rem;
  padding: 0.85rem 1.1rem 0.75rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.65);
  background: rgba(21, 29, 46, 0.48);
}

.lc-ed-bloque-cab--finanza {
  background: rgba(124, 140, 240, 0.07);
  border-bottom-color: rgba(124, 140, 240, 0.16);
}

.lc-ed-bloque-ico {
  flex-shrink: 0;
  margin-top: 0.12rem;
  color: var(--color-acento-hover);
  opacity: 0.95;
}

.lc-ed-bloque-txt {
  min-width: 0;
  flex: 1;
}

.lc-ed-bloque-tit {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
  color: var(--color-texto);
}

.lc-ed-bloque-desc {
  margin: 0.22rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.lc-ed-fila {
  display: grid;
  gap: 0.85rem 1.1rem;
  padding: 1rem 1.1rem 1.1rem;
}

.lc-ed-fila--ident {
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr);
}

.lc-ed-fila--contacto {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding-bottom: 0.65rem;
}

.lc-ed-fila--direccion {
  padding-top: 0;
  border-top: 1px dashed rgba(42, 58, 84, 0.55);
}

@media (max-width: 1023px) {
  .lc-ed-fila--ident {
    grid-template-columns: 1fr 1fr;
  }

  .lc-ed-fila--ident .lc-ed-campo--nombre {
    grid-column: 1 / -1;
  }

  .lc-ed-fila--contacto {
    grid-template-columns: 1fr 1fr;
  }

  .lc-ed-fila--contacto .lc-ed-campo:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 599px) {
  .lc-ed-fila--ident,
  .lc-ed-fila--contacto {
    grid-template-columns: 1fr;
  }

  .lc-ed-fila--ident .lc-ed-campo--nombre {
    grid-column: auto;
  }

  .lc-ed-fila--contacto .lc-ed-campo:last-child {
    grid-column: auto;
  }
}

.lc-ed-finanza-cuerpo {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.85fr);
  gap: 0.85rem 1.25rem;
  align-items: start;
  padding: 1rem 1.1rem 1.05rem;
}

.lc-ed-finanza-cuerpo .lc-ed-nota {
  grid-column: 1 / -1;
  margin: 0.15rem 0 0;
}

@media (max-width: 699px) {
  .lc-ed-finanza-cuerpo {
    grid-template-columns: 1fr;
  }
}

.lc-ed-campo {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  min-width: 0;
}

.lc-ed-campo--limite {
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px dashed rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.05);
}

.lc-ed-etiq {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-texto-suave);
}

.lc-ed-etiq-ico {
  flex-shrink: 0;
  opacity: 0.75;
  color: var(--color-texto-apagado);
}

.lc-ed-inp {
  width: 100%;
  padding: 0.62rem 0.78rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.9375rem;
  line-height: 1.35;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.lc-ed-inp--limite {
  max-width: 14rem;
}

.lc-ed-inp:hover {
  border-color: rgba(124, 140, 240, 0.32);
}

.lc-ed-inp:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow: 0 0 0 3px rgba(124, 140, 240, 0.2);
}

.lc-ed-form--solo-lectura .lc-ed-inp:disabled {
  opacity: 1;
  cursor: default;
  color: var(--color-texto-suave);
  background: rgba(7, 11, 20, 0.38);
  border-color: rgba(42, 58, 84, 0.55);
  box-shadow: none;
}

.lc-ed-form--solo-lectura .lc-ed-inp:disabled::placeholder {
  color: transparent;
}

.lc-ed-check--solo-lectura {
  cursor: default;
  opacity: 0.92;
}

.lc-ed-check--solo-lectura input:disabled {
  cursor: default;
}

.lc-ed-form--solo-lectura .lc-ed-campo--limite {
  border-style: solid;
  background: rgba(7, 11, 20, 0.32);
}

.lc-ed-inp--error {
  border-color: rgba(251, 113, 133, 0.75);
}

.lc-ed-inp--error:focus {
  border-color: var(--color-peligro);
  box-shadow: 0 0 0 3px rgba(251, 113, 133, 0.2);
}

.lc-ed-inp-mono {
  font-variant-numeric: tabular-nums;
}

.lc-ed-error {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-peligro);
}

.lc-ed-check {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.72rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(42, 58, 84, 0.75);
  background: rgba(7, 11, 20, 0.42);
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.45;
  color: var(--color-texto-suave);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.lc-ed-check:has(input:checked) {
  border-color: rgba(124, 140, 240, 0.42);
  background: rgba(124, 140, 240, 0.1);
}

.lc-ed-check input {
  width: 1.05rem;
  height: 1.05rem;
  margin: 0.15rem 0 0;
  accent-color: var(--color-acento);
  flex-shrink: 0;
}

.lc-ed-nota {
  margin: 0;
  padding-top: 0.65rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
  border-top: 1px solid rgba(42, 58, 84, 0.45);
}

.lc-error-general-modal--ed {
  flex-shrink: 0;
  margin: 0 clamp(1.35rem, 3.5vw, 2rem);
}

.lc-ed-pie {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 1rem clamp(1.35rem, 3.5vw, 2rem) 1.25rem;
  border-top: 1px solid rgba(42, 58, 84, 0.85);
  background: rgba(21, 29, 46, 0.72);
  box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.2);
}

.lc-modal-x {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: -0.1rem;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.lc-modal-x:hover {
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.06);
}

.lc-btn-sec {
  padding: 0.5rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.88rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.08s ease;
}

.lc-btn-pri {
  padding: 0.52rem 1.05rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  color: var(--color-texto-sobre-acento);
  background: var(--color-acento);
  cursor: pointer;
  transition: transform 0.08s ease;
}

.lc-btn-pri:hover {
  background: var(--color-acento-hover);
}

.lc-btn-sec:active,
.lc-btn-pri:active {
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .lc-card {
    transition: none;
  }

  .lc-card:hover {
    transform: none;
  }

  .lc-btn-sec,
  .lc-btn-pri {
    transition: none;
  }

  .lc-btn-sec:active,
  .lc-btn-pri:active {
    transform: none;
  }
}
</style>
