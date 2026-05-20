<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  recolectarErroresFormatoCliente,
  type CampoValidacionFormatoCliente,
  type ErroresFormatoCliente,
} from '../../modulos/clientes/validadoresCliente';
import { formatearDocumentoClienteAlEscribir } from '../../modulos/clientes/formateadorDocumentoCliente';
import { useClientesStore } from '../../stores/clientes';
import type { Cliente } from '../../tipos/cliente';
import { ClipboardCheck, Landmark, MapPin, Phone, Users } from 'lucide-vue-next';

type ModoDialogoCliente = 'alta' | 'edicion';

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const clientesStore = useClientesStore();
const { clientes } = storeToRefs(clientesStore);

const busquedaNombre = ref('');
const refDialog = useTemplateRef<HTMLDialogElement>('refDialog');
const refCuadroDetalleCliente = useTemplateRef<HTMLDialogElement>('refCuadroDetalleCliente');
const borrador = ref<Cliente | null>(null);
/** Cliente mostrado sólo en lectura en el cuadro Detalle. */
const clienteDetalle = ref<Cliente | null>(null);
const modoDialogoCliente = ref<ModoDialogoCliente>('edicion');
const erroresValidacionCliente = ref<ErroresFormatoCliente>({});
const mensajeErrorGeneralClienteGuardar = ref('');

function huellaCamposValidablesCliente(existente: Cliente | null): string {
  if (!existente) return '';
  return `${existente.documento}|${existente.correoElectronico}|${existente.telefonoPrincipal}|${existente.telefonoAlternativo}`;
}

watch(
  () => huellaCamposValidablesCliente(borrador.value),
  () => {
    erroresValidacionCliente.value = {};
    mensajeErrorGeneralClienteGuardar.value = '';
  }
);

function crearClienteVacio(): Cliente {
  return {
    id: crypto.randomUUID(),
    nombre: '',
    documento: '',
    correoElectronico: '',
    telefonoPrincipal: '',
    telefonoAlternativo: '',
    direccion: '',
    limiteCompraCuentaCorriente: 0,
    cuentaCorrienteHabilitada: false,
    habilitado: true,
  };
}

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
  borrador.value = crearClienteVacio();
  refDialog.value?.showModal();
}

function abrirEditar(c: Cliente) {
  erroresValidacionCliente.value = {};
  mensajeErrorGeneralClienteGuardar.value = '';
  modoDialogoCliente.value = 'edicion';
  borrador.value = {
    ...c,
    documento: formatearDocumentoClienteAlEscribir(c.documento),
  };
  refDialog.value?.showModal();
}

function alEscribirDocumentoCliente(textoUsuario: string) {
  if (!borrador.value) return;
  borrador.value.documento = formatearDocumentoClienteAlEscribir(textoUsuario);
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
    documento: rest.documento.trim(),
    correoElectronico: rest.correoElectronico.trim(),
    limiteCompraCuentaCorriente: rest.cuentaCorrienteHabilitada
      ? Math.max(0, rest.limiteCompraCuentaCorriente)
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

  const cliente: Cliente = { ...datos, id };
  let guardadoOk = false;
  if (modoDialogoCliente.value === 'alta') {
    guardadoOk = clientesStore.agregarCliente(cliente);
  } else {
    guardadoOk = clientesStore.actualizarCliente(id, datos);
  }

  if (!guardadoOk) {
    const duplicado = clientesStore.documentoUsadoPorOtroCliente(
      datos.documento,
      modoDialogoCliente.value === 'edicion' ? id : undefined
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

  cerrarDialogo();
}

function alCerrarDialogo() {
  borrador.value = null;
}

function onToggleHabilitado(c: Cliente, habilitado: boolean) {
  clientesStore.setHabilitado(c.id, habilitado);
}

function textoDetalleOVacio(texto: string): string {
  const normalizado = texto.trim();
  return normalizado.length > 0 ? normalizado : '—';
}

function textoLineaContactoTarjetaCliente(cliente: Cliente): string {
  const correo = cliente.correoElectronico.trim();
  if (correo.length > 0) return correo;
  const telefono = cliente.telefonoPrincipal.trim();
  return telefono.length > 0 ? telefono : '—';
}

function tituloTooltipContactoTarjetaCliente(cliente: Cliente): string | undefined {
  const partes: string[] = [];
  const correo = cliente.correoElectronico.trim();
  const telPrincipal = cliente.telefonoPrincipal.trim();
  const telAlternativo = cliente.telefonoAlternativo.trim();
  if (correo.length > 0) partes.push(`Correo: ${correo}`);
  if (telPrincipal.length > 0) partes.push(`Tel.: ${telPrincipal}`);
  if (telAlternativo.length > 0) partes.push(`Tel. alt.: ${telAlternativo}`);
  return partes.length > 0 ? partes.join(' · ') : undefined;
}

function abrirCuadroDetalleCliente(c: Cliente): void {
  clienteDetalle.value = c;
  refCuadroDetalleCliente.value?.showModal();
}

function cerrarCuadroDetalleCliente(): void {
  refCuadroDetalleCliente.value?.close();
}

function alCerrarCuadroDetalleCliente(): void {
  clienteDetalle.value = null;
}

function irAEditarDesdeDetalle(): void {
  const copia = clienteDetalle.value;
  if (!copia) return;
  cerrarCuadroDetalleCliente();
  abrirEditar(copia);
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
            <p class="pg-sub">
              Fichas, contacto y cuenta corriente. Buscá por nombre, documento o correo y gestioná
              ventas habilitadas por cliente.
            </p>
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
          <button type="button" class="pg-btn-primario" @click="abrirAltaCliente">
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
            <p
              class="lc-card-contacto"
              :title="tituloTooltipContactoTarjetaCliente(c)"
            >
              {{ textoLineaContactoTarjetaCliente(c) }}
            </p>
            <div class="lc-card-fila-estado" aria-label="Cuenta corriente">
              <span class="lc-card-etiq-cc">C. corr.</span>
              <span
                :class="c.cuentaCorrienteHabilitada ? 'lc-chip lc-chip--si' : 'lc-chip lc-chip--no'"
              >
                {{ c.cuentaCorrienteHabilitada ? 'Sí' : 'No' }}
              </span>
            </div>

            <footer class="lc-card-pie">
              <div class="lc-card-sw">
                <span class="lc-card-sw-lbl">Ventas</span>
                <label class="lc-sw lc-sw--compacto">
                  <input
                    type="checkbox"
                    class="lc-sw-input"
                    role="switch"
                    :aria-label="`Ventas habilitadas para ${c.nombre}`"
                    :checked="c.habilitado"
                    @change="
                      onToggleHabilitado(c, ($event.target as HTMLInputElement).checked)
                    "
                  />
                  <span class="lc-sw-ui" aria-hidden="true" />
                </label>
              </div>
              <div class="lc-card-acciones">
                <button type="button" class="lc-btn-detalle" @click="abrirCuadroDetalleCliente(c)">
                  Detalle
                </button>
                <button type="button" class="lc-btn-ed" @click="abrirEditar(c)">Editar</button>
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
        class="lc-modal"
        aria-labelledby="lc-dlg-tit"
        @close="alCerrarDialogo"
        @cancel.prevent="cerrarDialogo"
      >
        <div v-if="borrador" class="lc-modal-panel" @click.stop>
          <header class="lc-modal-cab">
            <div class="lc-modal-cab-txt">
              <h2 id="lc-dlg-tit" class="lc-modal-tit">
                {{ modoDialogoCliente === 'alta' ? 'Nuevo cliente' : 'Editar cliente' }}
              </h2>
              <p id="lc-dlg-sub" class="lc-modal-sub">
                <template v-if="modoDialogoCliente === 'alta'">
                  Datos maestros para facturación y contacto. Podés activar o inhibir ventas con el interruptor
                  «Ventas» en cada tarjeta del listado.
                </template>
                <template v-else>
                  Actualizá identificación, medios de contacto y condiciones de cuenta corriente.
                </template>
              </p>
            </div>
            <button type="button" class="lc-modal-x" aria-label="Cerrar" @click="cerrarDialogo">
              ×
            </button>
          </header>

          <hr class="lc-modal-line" aria-hidden="true" />

          <form
            class="lc-form lc-form--modal lc-modal-form-scroll"
            aria-describedby="lc-dlg-sub"
            @submit.prevent="guardarCliente"
          >
          <section class="lc-modal-bloque" aria-labelledby="lc-sec-ident">
            <h3 id="lc-sec-ident" class="lc-modal-seccion-tit">Identificación</h3>
            <div class="lc-fila">
              <label class="pg-filtro-etiq" for="ed-nombre">Nombre o razón social</label>
              <input id="ed-nombre" v-model="borrador.nombre" type="text" class="pg-filtro-inp" required />
            </div>
            <div class="lc-fila">
              <label class="pg-filtro-etiq" for="ed-doc">Documento / CUIT</label>
              <p id="lc-tip-doc-ident" class="lc-etq-tip">
                Único en el sistema. Si cargás sólo dígitos, se formatea solo: DNI con puntos
                (37.436.702) y CUIT con tipo, puntos en el medio y verificador
                (20-37.436.702-2). Comparación ignorando separadores.
              </p>
              <input
                id="ed-doc"
                :value="borrador.documento"
                type="text"
                inputmode="text"
                class="pg-filtro-inp"
                :class="{ 'lc-inp--dato-invalido': erroresValidacionCliente.documento }"
                placeholder="Ej. DNI o CUIT (se formatea al escribir)…"
                autocomplete="off"
                :aria-invalid="erroresValidacionCliente.documento ? true : undefined"
                :aria-describedby="
                  erroresValidacionCliente.documento
                    ? 'lc-tip-doc-ident ed-doc-err'
                    : 'lc-tip-doc-ident'
                "
                @input="alEscribirDocumentoCliente(($event.target as HTMLInputElement).value)"
                @paste="alPegarDocumentoCliente"
              />
              <p
                v-if="erroresValidacionCliente.documento"
                id="ed-doc-err"
                class="lc-campo-error"
                role="alert"
              >
                {{ erroresValidacionCliente.documento }}
              </p>
            </div>
          </section>

          <section class="lc-modal-bloque" aria-labelledby="lc-sec-contacto">
            <h3 id="lc-sec-contacto" class="lc-modal-seccion-tit">Contacto y ubicación</h3>
            <div class="lc-modal-grid-duo">
              <div class="lc-fila">
                <label class="pg-filtro-etiq" for="ed-tel-p">Teléfono principal</label>
                <input
                  id="ed-tel-p"
                  v-model="borrador.telefonoPrincipal"
                  type="tel"
                  class="pg-filtro-inp"
                  autocomplete="tel"
                  :class="{ 'lc-inp--dato-invalido': erroresValidacionCliente.telefonoPrincipal }"
                  :aria-invalid="erroresValidacionCliente.telefonoPrincipal ? true : undefined"
                />
                <p
                  v-if="erroresValidacionCliente.telefonoPrincipal"
                  class="lc-campo-error"
                  role="alert"
                >
                  {{ erroresValidacionCliente.telefonoPrincipal }}
                </p>
              </div>
              <div class="lc-fila">
                <label class="pg-filtro-etiq" for="ed-tel-alt">Teléfono alternativo</label>
                <input
                  id="ed-tel-alt"
                  v-model="borrador.telefonoAlternativo"
                  type="tel"
                  class="pg-filtro-inp"
                  autocomplete="tel"
                  placeholder="Opcional"
                  :class="{ 'lc-inp--dato-invalido': erroresValidacionCliente.telefonoAlternativo }"
                  :aria-invalid="erroresValidacionCliente.telefonoAlternativo ? true : undefined"
                />
                <p
                  v-if="erroresValidacionCliente.telefonoAlternativo"
                  class="lc-campo-error"
                  role="alert"
                >
                  {{ erroresValidacionCliente.telefonoAlternativo }}
                </p>
              </div>
            </div>
            <div class="lc-fila">
              <label class="pg-filtro-etiq" for="ed-correo">Correo electrónico</label>
              <p id="lc-tip-correo" class="lc-etq-tip">
                Opcional. Formato habitual: cuenta@servidor.dom
              </p>
              <input
                id="ed-correo"
                v-model="borrador.correoElectronico"
                type="email"
                class="pg-filtro-inp"
                autocomplete="email"
                inputmode="email"
                placeholder="ejemplo@sucursal.com"
                :class="{ 'lc-inp--dato-invalido': erroresValidacionCliente.correoElectronico }"
                :aria-invalid="erroresValidacionCliente.correoElectronico ? true : undefined"
                :aria-describedby="
                  erroresValidacionCliente.correoElectronico
                    ? 'lc-tip-correo ed-correo-err'
                    : 'lc-tip-correo'
                "
              />
              <p
                v-if="erroresValidacionCliente.correoElectronico"
                id="ed-correo-err"
                class="lc-campo-error"
                role="alert"
              >
                {{ erroresValidacionCliente.correoElectronico }}
              </p>
            </div>
            <div class="lc-fila">
              <label class="pg-filtro-etiq" for="ed-dir">Dirección</label>
              <textarea
                id="ed-dir"
                v-model="borrador.direccion"
                class="lc-ta"
                rows="2"
                placeholder="Calle, localidad, código postal…"
              />
            </div>
          </section>

          <section
            class="lc-modal-bloque lc-modal-bloque--cc"
            aria-labelledby="lc-sec-cc"
          >
            <h3 id="lc-sec-cc" class="lc-modal-seccion-tit">Cuenta corriente</h3>
            <p class="lc-modal-bloque-intro">
              Solo afecta ventas en cuenta corriente y el futuro saldo; no limita efectivo u otras
              formas de cobro.
            </p>
            <div class="lc-fila lc-fila--chk lc-fila--cc">
              <label class="lc-etq lc-etq--inline">
                <input v-model="borrador.cuentaCorrienteHabilitada" type="checkbox" />
                Permitir operar con cuenta corriente
              </label>
            </div>
            <div v-if="borrador.cuentaCorrienteHabilitada" class="lc-fila lc-fila-limite-cc">
              <label class="pg-filtro-etiq" for="ed-lim">Límite de compra en cuenta corriente (ARS)</label>
              <input
                id="ed-lim"
                v-model.number="borrador.limiteCompraCuentaCorriente"
                type="number"
                min="0"
                step="1000"
                class="lc-inp lc-inp-mono"
                inputmode="numeric"
              />
            </div>
          </section>

          <p
            v-if="mensajeErrorGeneralClienteGuardar"
            class="lc-error-general-modal"
            role="alert"
          >
            {{ mensajeErrorGeneralClienteGuardar }}
          </p>

          <p class="lc-ayuda lc-ayuda--modal">
            <template v-if="modoDialogoCliente === 'alta'">
              El campo <strong>Nombre</strong> es obligatorio. El estado
              <strong>Habilitado</strong> para ventas lo definís con el interruptor «Ventas» en la tarjeta.
            </template>
            <template v-else>
              El estado <strong>Habilitado</strong> para ventas solo se cambia con el interruptor «Ventas» en la tarjeta
              del listado.
            </template>
          </p>

          <div class="lc-modal-acc">
            <button type="button" class="lc-btn-sec" @click="cerrarDialogo">Cancelar</button>
            <button type="submit" class="lc-btn-pri">
              {{ modoDialogoCliente === 'alta' ? 'Crear cliente' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </dialog>
    </Teleport>

    <Teleport to="body">
      <dialog
        ref="refCuadroDetalleCliente"
        class="lc-modal lc-modal-detalle-cliente"
        aria-labelledby="lc-det-cli-tit"
        aria-modal="true"
        @close="alCerrarCuadroDetalleCliente"
        @cancel.prevent="cerrarCuadroDetalleCliente"
      >
      <div v-if="clienteDetalle" class="lc-det-cli-panel" @click.stop>
        <header class="lc-det-cli-cab">
          <div class="lc-det-cli-cab-marca">
            <p class="lc-det-cli-eyebrow">Ficha maestra</p>
            <h2 id="lc-det-cli-tit" class="lc-det-cli-tit">{{ clienteDetalle.nombre }}</h2>
            <p class="lc-det-cli-metadatos">
              <span class="lc-det-cli-chip-doc lc-mono" :title="clienteDetalle.documento">
                {{ clienteDetalle.documento }}
              </span>
            </p>
          </div>
          <button
            type="button"
            class="lc-modal-x"
            aria-label="Cerrar detalle"
            @click="cerrarCuadroDetalleCliente"
          >
            ×
          </button>
        </header>
        <div class="lc-det-cli-bandera" aria-hidden="true" />
        <hr class="lc-det-cli-line-top" aria-hidden="true" />
        <div class="lc-det-cli-cuerpo">
          <section class="lc-det-cli-panel-seccion" aria-labelledby="lc-det-sec-contacto">
            <div class="lc-det-cli-sec-cab">
              <Phone class="lc-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="lc-det-sec-contacto" class="lc-det-cli-sec-tit">Contacto</h3>
            </div>
            <div class="lc-det-cli-sec-cuerpo">
              <dl class="lc-det-cli-spec">
                <div class="lc-det-cli-spec-fila">
                  <dt>Teléfono principal</dt>
                  <dd class="lc-mono">{{ textoDetalleOVacio(clienteDetalle.telefonoPrincipal) }}</dd>
                </div>
                <div class="lc-det-cli-spec-fila">
                  <dt>Teléfono alternativo</dt>
                  <dd class="lc-mono">{{ textoDetalleOVacio(clienteDetalle.telefonoAlternativo) }}</dd>
                </div>
                <div class="lc-det-cli-spec-fila">
                  <dt>Correo electrónico</dt>
                  <dd>{{ textoDetalleOVacio(clienteDetalle.correoElectronico) }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="lc-det-cli-panel-seccion" aria-labelledby="lc-det-sec-dir">
            <div class="lc-det-cli-sec-cab">
              <MapPin class="lc-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="lc-det-sec-dir" class="lc-det-cli-sec-tit">Ubicación</h3>
            </div>
            <div class="lc-det-cli-sec-cuerpo">
              <p class="lc-det-cli-texto-multilinea">{{ textoDetalleOVacio(clienteDetalle.direccion) }}</p>
            </div>
          </section>

          <section
            class="lc-det-cli-panel-seccion lc-det-cli-panel-seccion--finanza"
            aria-labelledby="lc-det-sec-cc"
          >
            <div class="lc-det-cli-sec-cab lc-det-cli-sec-cab--finanza">
              <Landmark class="lc-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="lc-det-sec-cc" class="lc-det-cli-sec-tit">Cuenta corriente</h3>
            </div>
            <div class="lc-det-cli-sec-cuerpo">
              <dl class="lc-det-cli-spec">
                <div class="lc-det-cli-spec-fila">
                  <dt>Permite operar en CC</dt>
                  <dd>
                    <span v-if="clienteDetalle.cuentaCorrienteHabilitada" class="lc-chip lc-chip--si">
                      Sí
                    </span>
                    <span v-else class="lc-chip lc-chip--no">No</span>
                  </dd>
                </div>
                <div class="lc-det-cli-spec-fila lc-det-cli-spec-fila--destacado">
                  <dt>Límite de compra</dt>
                  <dd class="lc-det-cli-valor-cc lc-mono">
                    {{
                      clienteDetalle.cuentaCorrienteHabilitada
                        ? formatoPeso.format(clienteDetalle.limiteCompraCuentaCorriente)
                        : '—'
                    }}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="lc-det-cli-panel-seccion" aria-labelledby="lc-det-sec-estado">
            <div class="lc-det-cli-sec-cab">
              <ClipboardCheck class="lc-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="lc-det-sec-estado" class="lc-det-cli-sec-tit">Estado comercial</h3>
            </div>
            <div class="lc-det-cli-sec-cuerpo">
              <dl class="lc-det-cli-spec">
                <div class="lc-det-cli-spec-fila">
                  <dt>Habilitado para ventas</dt>
                  <dd>
                    <span v-if="clienteDetalle.habilitado" class="lc-chip lc-chip--si">Sí</span>
                    <span v-else class="lc-chip lc-chip--no">No</span>
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
        <footer class="lc-det-cli-pie">
          <button type="button" class="lc-btn-sec" @click="cerrarCuadroDetalleCliente">
            Cerrar
          </button>
          <button type="button" class="lc-btn-pri" @click="irAEditarDesdeDetalle">
            Editar cliente
          </button>
        </footer>
      </div>
    </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.pg-marco--clientes {
  --pg-grilla-altura-fila: 10.65rem;
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

.lc-card-contacto {
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
  justify-content: space-between;
  gap: 0.45rem 0.65rem;
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

  .lc-card-acciones .lc-btn-detalle,
  .lc-card-acciones .lc-btn-ed {
    flex: 1;
    justify-content: center;
  }
}

.lc-card-sw {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
}

.lc-card-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-left: auto;
  justify-content: flex-end;
}

.lc-card-sw-lbl {
  font-size: 0.6275rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  max-width: 10rem;
}

.lc-vacio {
  margin: 0;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
}

.lc-vacio-msg {
  margin: 0;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
  border: 1px dashed var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
}

.lc-vacio-msg-tit {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  margin-bottom: 0.35rem;
}

.lc-vacio-msg-det {
  display: block;
  font-size: 0.82rem;
  line-height: 1.45;
  max-width: 22rem;
  margin: 0 auto;
}

.lc-btn-nuevo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.92rem;
  font-weight: 700;
  font-family: inherit;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento));
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(91, 110, 230, 0.35);
}

.lc-btn-nuevo:hover {
  filter: brightness(1.06);
}

.lc-etq {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.lc-etq--inline {
  margin-bottom: 0;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-texto-suave);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.lc-etq-tip {
  margin: -0.1rem 0 0.4rem;
  font-size: 0.71rem;
  line-height: 1.42;
  color: var(--color-texto-apagado);
  font-weight: 500;
}

.lc-campo-error {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-peligro);
}

.lc-inp--dato-invalido {
  border-color: rgba(251, 113, 133, 0.75);
}

.lc-inp {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.9rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.lc-form--modal .lc-inp:hover,
.lc-form--modal .lc-ta:hover {
  border-color: rgba(124, 140, 240, 0.28);
}

.lc-form--modal .lc-inp:focus,
.lc-form--modal .lc-ta:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow: 0 0 0 2px rgba(124, 140, 240, 0.22);
}

.lc-form--modal .lc-inp--dato-invalido:hover {
  border-color: rgba(251, 113, 133, 0.45);
}

.lc-form--modal .lc-inp--dato-invalido:focus {
  outline: none;
  border-color: var(--color-peligro);
  box-shadow: 0 0 0 2px rgba(251, 113, 133, 0.22);
}

.lc-ta {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.88rem;
  resize: vertical;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
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

.lc-mono {
  font-variant-numeric: tabular-nums;
}

.lc-btn-detalle,
.lc-btn-ed {
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
}

.lc-btn-detalle {
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

.lc-btn-ed {
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.08);
  color: var(--color-texto);
}

.lc-btn-ed:hover {
  border-color: rgba(124, 140, 240, 0.45);
  background: rgba(124, 140, 240, 0.14);
}

.lc-btn-ed:focus-visible {
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
  z-index: 1;
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

/*
 * Sin el selector [open], «display:flex» deja el <dialog> visible aunque esté cerrado
 * (gana en cascada al display:none del agente de usuario y tapa toda la vista).
 */
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
  width: min(36rem, calc(100vw - 1.5rem));
  max-width: min(36rem, calc(100vw - 1.5rem));
  height: fit-content;
  max-height: calc(100dvh - 2rem);
  margin: auto;
  z-index: 9000;
  overflow: hidden;
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.06),
    0 24px 56px rgba(0, 0, 0, 0.55);
}

.lc-modal::backdrop {
  background: rgba(7, 11, 20, 0.76);
  backdrop-filter: blur(3px);
}

.lc-modal-panel {
  display: flex;
  flex-direction: column;
  padding: 0;
  min-height: 0;
  max-height: calc(100dvh - 2rem);
}

.lc-modal-form-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.lc-modal-detalle-cliente[open] {
  width: min(34rem, calc(100vw - 1.25rem));
  max-width: min(34rem, calc(100vw - 1.25rem));
  overflow: hidden;
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.1),
    0 28px 64px rgba(0, 0, 0, 0.58);
}

.lc-det-cli-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 2rem);
  background:
    radial-gradient(
      ellipse 120% 80% at 100% -20%,
      rgba(124, 140, 240, 0.14),
      transparent 52%
    ),
    var(--color-fondo-elevado);
}

.lc-det-cli-cab {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  flex-shrink: 0;
  padding: 1rem clamp(1.05rem, 3.2vw, 1.4rem) 0.35rem;
}

.lc-det-cli-cab-marca {
  min-width: 0;
  flex: 1;
  padding-right: 0.35rem;
}

.lc-det-cli-eyebrow {
  margin: 0 0 0.32rem;
  font-size: 0.645rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(139, 156, 179, 0.95);
}

.lc-det-cli-tit {
  margin: 0;
  font-size: 1.22rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.22;
  color: var(--color-texto);
}

.lc-det-cli-metadatos {
  margin: 0.55rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.lc-det-cli-chip-doc {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0.28rem 0.62rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  border: 1px solid rgba(124, 140, 240, 0.22);
  background: rgba(7, 11, 20, 0.45);
}

.lc-det-cli-bandera {
  height: 4px;
  margin: 0;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(124, 140, 240, 0.15),
    rgba(154, 124, 240, 0.55),
    rgba(124, 140, 240, 0.2)
  );
}

.lc-det-cli-line-top {
  margin: 0 clamp(1.05rem, 3.2vw, 1.4rem) 0;
  border: none;
  border-top: 1px solid rgba(42, 58, 84, 0.75);
}

.lc-det-cli-cuerpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.65rem clamp(1.05rem, 3.2vw, 1.4rem) 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.58rem;
}

.lc-det-cli-panel-seccion {
  border-radius: 12px;
  border: 1px solid rgba(42, 58, 84, 0.85);
  background: rgba(7, 11, 20, 0.38);
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.lc-det-cli-panel-seccion--finanza {
  border-color: rgba(124, 140, 240, 0.32);
  background: linear-gradient(
    145deg,
    rgba(124, 140, 240, 0.1) 0%,
    rgba(7, 11, 20, 0.48) 48%,
    rgba(7, 11, 20, 0.38) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 0 0 1px rgba(124, 140, 240, 0.06);
}

.lc-det-cli-sec-cab {
  display: flex;
  align-items: center;
  gap: 0.48rem;
  padding: 0.48rem 0.78rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.75);
  background: rgba(21, 29, 46, 0.55);
}

.lc-det-cli-sec-cab--finanza {
  background: rgba(124, 140, 240, 0.08);
  border-bottom-color: rgba(124, 140, 240, 0.18);
}

.lc-det-cli-ico {
  flex-shrink: 0;
  color: var(--color-acento-hover);
  opacity: 0.92;
}

.lc-det-cli-sec-tit {
  margin: 0;
  font-size: 0.69rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-texto);
}

.lc-det-cli-sec-cuerpo {
  padding: 0.15rem 0.78rem 0.72rem;
}

.lc-det-cli-spec {
  margin: 0;
}

.lc-det-cli-spec-fila {
  display: grid;
  grid-template-columns: minmax(6.75rem, 34%) minmax(0, 1fr);
  align-items: start;
  column-gap: 1rem;
  padding: 0.42rem 0;
  border-bottom: 1px solid rgba(42, 58, 84, 0.55);
}

.lc-det-cli-spec-fila:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.lc-det-cli-spec-fila:first-child {
  padding-top: 0.38rem;
}

.lc-det-cli-spec-fila--destacado dd {
  font-weight: 700;
  font-size: 0.94rem;
  letter-spacing: -0.025em;
  color: var(--color-texto);
}

.lc-det-cli-valor-cc {
  color: var(--color-texto) !important;
}

.lc-det-cli-spec-fila dt {
  margin: 0;
  padding-top: 0.12rem;
  font-size: 0.6425rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  line-height: 1.25;
}

.lc-det-cli-spec-fila dd {
  margin: 0;
  font-size: 0.8675rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
  word-break: break-word;
}

.lc-det-cli-texto-multilinea {
  margin: 0.35rem 0 0.12rem;
  font-size: 0.8675rem;
  line-height: 1.55;
  color: var(--color-texto-suave);
  white-space: pre-wrap;
}

.lc-det-cli-pie {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.92rem clamp(1.05rem, 3.2vw, 1.4rem) 1.08rem;
  border-top: 1px solid rgba(42, 58, 84, 0.85);
  background: rgba(21, 29, 46, 0.65);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.22);
}

@media (max-width: 520px) {
  .lc-det-cli-spec-fila {
    grid-template-columns: 1fr;
    row-gap: 0.08rem;
    padding: 0.48rem 0;
  }

  .lc-det-cli-spec-fila dt {
    padding-top: 0;
    font-size: 0.6rem;
  }

  .lc-det-cli-spec-fila dd {
    font-size: 0.8375rem;
  }
}

.lc-modal-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 1.25rem 1.25rem 0.85rem;
  flex-shrink: 0;
}

.lc-modal-cab-txt {
  min-width: 0;
  flex: 1;
}

.lc-modal-tit {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.lc-modal-sub {
  margin: 0.4rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
  max-width: 46ch;
}

.lc-modal-line {
  margin: 0 1.25rem 0;
  border: none;
  border-top: 1px solid var(--color-borde);
}

.lc-modal-x {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: -0.15rem;
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

.lc-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lc-form--modal {
  gap: 0;
  padding: 0 1.25rem 1.25rem;
}

.lc-modal-bloque {
  padding: 0.95rem 0 1rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.65);
}

.lc-modal-bloque:last-of-type {
  border-bottom: none;
  padding-bottom: 0.35rem;
}

.lc-modal-bloque--cc {
  margin-top: 0.15rem;
  padding: 0.95rem 0.95rem 1rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: rgba(7, 11, 20, 0.55);
  border-bottom: 1px solid var(--color-borde);
}

.lc-modal-bloque--cc:last-of-type {
  margin-bottom: 0.85rem;
}

.lc-modal-bloque-intro {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.lc-modal-seccion-tit {
  margin: 0 0 0.72rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-acento-hover);
}

.lc-modal-bloque--cc .lc-modal-seccion-tit {
  margin-bottom: 0.5rem;
}

.lc-modal-grid-duo {
  display: grid;
  gap: 0.85rem;
}

@media (min-width: 520px) {
  .lc-modal-grid-duo {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem 1rem;
  }
}

.lc-fila-limite-cc {
  margin-top: 0.35rem;
  padding-top: 0.5rem;
}

.lc-fila--chk.lc-fila--cc {
  padding-top: 0;
}

.lc-inp-mono {
  font-variant-numeric: tabular-nums;
}

.lc-ayuda--modal {
  margin-top: 0.25rem;
  padding: 0.65rem 0.72rem;
  border-radius: 8px;
  background: rgba(124, 140, 240, 0.06);
  border: 1px solid rgba(124, 140, 240, 0.12);
  font-size: 0.75rem;
  line-height: 1.45;
}

/* Solo dentro del formulario del modal (evita colisión si en el futuro se usa `.lc-fila` fuera del form). */
.lc-form .lc-fila {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.lc-form .lc-fila--chk {
  padding-top: 0.15rem;
}

.lc-ayuda {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
  line-height: 1.4;
}

.lc-modal-acc {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-borde);
  flex-shrink: 0;
}

.lc-btn-sec {
  padding: 0.5rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.08s ease;
}

.lc-btn-pri {
  padding: 0.52rem 1.05rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
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
