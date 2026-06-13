<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  recolectarErroresFormatoCliente,
  type CampoValidacionFormatoCliente,
  type ErroresFormatoCliente,
} from '../../modulos/clientes/validadoresCliente';
import { formatearDocumentoClienteAlEscribir } from '../../modulos/clientes/formateadorDocumentoCliente';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useProveedoresStore } from '../../stores/proveedores';
import type { Proveedor } from '../../tipos/proveedor';
import { IdCard, Landmark, MapPin, Phone, Truck } from 'lucide-vue-next';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import { usePermisosOperador } from '../../composables/usePermisosOperador';

const descripcionPagina = obtenerDescripcionPagina('compras-proveedores');
const { tienePermiso } = usePermisosOperador();
const puedeGestionarProveedores = computed(() => tienePermiso('puedeGestionarProveedores'));

type ModoDialogoProveedor = 'alta' | 'detalle';

const proveedoresStore = useProveedoresStore();
const { proveedores } = storeToRefs(proveedoresStore);

const busquedaNombre = ref('');
const refDialog = useTemplateRef<HTMLDialogElement>('refDialog');
const borrador = ref<(Omit<Proveedor, 'id'> & { id?: string }) | null>(null);
const borradorPersistido = ref<(Omit<Proveedor, 'id'> & { id?: string }) | null>(null);
const modoDialogoProveedor = ref<ModoDialogoProveedor>('detalle');
const edicionProveedorActiva = ref(false);
const erroresValidacionProveedor = ref<ErroresFormatoCliente>({});
const mensajeErrorGeneralProveedorGuardar = ref('');

const formularioProveedorEditable = computed(
  () => modoDialogoProveedor.value === 'alta' || edicionProveedorActiva.value,
);

const tituloModalProveedor = computed(() => {
  if (modoDialogoProveedor.value === 'alta') return 'Nuevo proveedor';
  return edicionProveedorActiva.value ? 'Editar proveedor' : 'Detalle del proveedor';
});

const textoBotonPieSecundario = computed(() => {
  if (modoDialogoProveedor.value === 'alta') return 'Cancelar';
  return edicionProveedorActiva.value ? 'Cancelar' : 'Cerrar';
});

function clonarBorradorProveedor(
  origen: Omit<Proveedor, 'id'> & { id?: string },
): Omit<Proveedor, 'id'> & { id?: string } {
  return { ...origen };
}

function crearBorradorDesdeProveedor(p: Proveedor): Omit<Proveedor, 'id'> & { id?: string } {
  return {
    ...p,
    documento: formatearDocumentoClienteAlEscribir(p.documento),
  };
}

function huellaCamposValidablesProveedor(
  existente: (Omit<Proveedor, 'id'> & { id?: string }) | null,
): string {
  if (!existente) return '';
  return `${existente.documento}|${existente.correoElectronico}|${existente.telefonoPrincipal}|${existente.telefonoAlternativo}`;
}

watch(
  () => huellaCamposValidablesProveedor(borrador.value),
  () => {
    erroresValidacionProveedor.value = {};
    mensajeErrorGeneralProveedorGuardar.value = '';
  }
);

function crearProveedorVacio(): Omit<Proveedor, 'id'> & { id?: string } {
  return {
    nombre: '',
    documento: '',
    correoElectronico: '',
    telefonoPrincipal: '',
    telefonoAlternativo: '',
    direccion: '',
    limiteCreditoCompras: 0,
    comprasCreditoHabilitadas: false,
    habilitado: true,
  };
}

const proveedoresFiltrados = computed(() => {
  const q = busquedaNombre.value.trim().toLowerCase();
  return [...proveedores.value]
    .filter((p) => {
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.documento.toLowerCase().includes(q) ||
        p.correoElectronico.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
});

function abrirAltaProveedor() {
  erroresValidacionProveedor.value = {};
  mensajeErrorGeneralProveedorGuardar.value = '';
  modoDialogoProveedor.value = 'alta';
  edicionProveedorActiva.value = true;
  borradorPersistido.value = null;
  borrador.value = crearProveedorVacio();
  refDialog.value?.showModal();
}

function abrirDetalleProveedor(p: Proveedor) {
  erroresValidacionProveedor.value = {};
  mensajeErrorGeneralProveedorGuardar.value = '';
  modoDialogoProveedor.value = 'detalle';
  edicionProveedorActiva.value = false;
  const copia = crearBorradorDesdeProveedor(p);
  borrador.value = clonarBorradorProveedor(copia);
  borradorPersistido.value = clonarBorradorProveedor(copia);
  refDialog.value?.showModal();
}

function activarEdicionProveedor() {
  if (!borrador.value || modoDialogoProveedor.value !== 'detalle') return;
  erroresValidacionProveedor.value = {};
  mensajeErrorGeneralProveedorGuardar.value = '';
  edicionProveedorActiva.value = true;
}

function cancelarEdicionProveedor() {
  if (modoDialogoProveedor.value === 'alta') {
    cerrarDialogo();
    return;
  }
  if (!borradorPersistido.value) {
    cerrarDialogo();
    return;
  }
  erroresValidacionProveedor.value = {};
  mensajeErrorGeneralProveedorGuardar.value = '';
  borrador.value = clonarBorradorProveedor(borradorPersistido.value);
  edicionProveedorActiva.value = false;
}

function alPieSecundarioProveedor() {
  if (modoDialogoProveedor.value === 'detalle' && edicionProveedorActiva.value) {
    cancelarEdicionProveedor();
    return;
  }
  cerrarDialogo();
}

function alEscribirDocumentoProveedor(textoUsuario: string) {
  if (!borrador.value) return;
  borrador.value.documento = formatearDocumentoClienteAlEscribir(textoUsuario);
}

function alPegarDocumentoProveedor(event: Event) {
  event.preventDefault();
  const clipboard = event as ClipboardEvent;
  const pegado = clipboard.clipboardData?.getData('text') ?? '';
  alEscribirDocumentoProveedor(pegado);
}

function cerrarDialogo() {
  refDialog.value?.close();
  borrador.value = null;
  borradorPersistido.value = null;
  edicionProveedorActiva.value = false;
}

const enfocablesValidacionProveedor: Partial<
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
    const idDom = enfocablesValidacionProveedor[nombreCampo];
    if (idDom) document.getElementById(idDom)?.focus();
    return;
  }
}

async function guardarProveedor() {
  if (!borrador.value) return;
  erroresValidacionProveedor.value = {};
  mensajeErrorGeneralProveedorGuardar.value = '';

  const { id, ...rest } = borrador.value;
  const datos: Omit<Proveedor, 'id'> = {
    ...rest,
    documento: rest.documento.trim(),
    correoElectronico: rest.correoElectronico.trim(),
    limiteCreditoCompras: rest.comprasCreditoHabilitadas
      ? Math.max(0, rest.limiteCreditoCompras)
      : 0,
  };

  const erroresFormato = recolectarErroresFormatoCliente({
    documento: datos.documento,
    correoElectronico: datos.correoElectronico,
    telefonoPrincipal: datos.telefonoPrincipal,
    telefonoAlternativo: datos.telefonoAlternativo,
  });

  if (Object.keys(erroresFormato).length > 0) {
    erroresValidacionProveedor.value = erroresFormato;
    await enfocarPrimerCampoConError(erroresFormato);
    return;
  }

  const datosProveedor: Omit<Proveedor, 'id'> = { ...datos };
  let guardadoOk = false;
  try {
    if (modoDialogoProveedor.value === 'alta') {
      const creado = await proveedoresStore.agregarProveedor(datosProveedor);
      guardadoOk = creado != null;
    } else if (id) {
      guardadoOk = await proveedoresStore.actualizarProveedor(id, datos);
    }
  } catch (error) {
    mensajeErrorGeneralProveedorGuardar.value = mensajeErrorHttp(
      error,
      'No se pudo guardar el proveedor. Intentá de nuevo.',
    );
    return;
  }

  if (!guardadoOk) {
    const duplicado = proveedoresStore.documentoUsadoPorOtroProveedor(
      datos.documento,
      modoDialogoProveedor.value === 'detalle' ? id : undefined,
    );
    if (duplicado) {
      erroresValidacionProveedor.value = {
        documento:
          'Ya existe otro proveedor con el mismo documento o CUIT. Revisá el dato o abrilo desde la lista.',
      };
      await nextTick();
      document.getElementById('ed-doc')?.focus();
    } else {
      mensajeErrorGeneralProveedorGuardar.value =
        'No se pudo guardar el proveedor. Intentá de nuevo.';
    }
    return;
  }

  if (modoDialogoProveedor.value === 'alta') {
    cerrarDialogo();
    return;
  }

  const borradorGuardado = clonarBorradorProveedor({
    id,
    ...datos,
    documento: formatearDocumentoClienteAlEscribir(datos.documento),
  });
  borrador.value = borradorGuardado;
  borradorPersistido.value = clonarBorradorProveedor(borradorGuardado);
  edicionProveedorActiva.value = false;
}

function alCerrarDialogo() {
  borrador.value = null;
  borradorPersistido.value = null;
  edicionProveedorActiva.value = false;
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-alta-proveedores">
    <div class="pg-marco pg-marco--tarjetas pg-marco--proveedores">
    <header class="pg-cab">
      <div class="pg-cab-txt">
        <div class="pg-cab-izq">
          <Truck :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
          <div>
            <p class="pg-eyebrow">Compras · Proveedores</p>
            <h1 id="titulo-alta-proveedores" class="pg-titulo">Proveedores</h1>
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
            v-if="puedeGestionarProveedores"
            type="button"
            class="pg-btn-primario"
            @click="abrirAltaProveedor"
          >
            Nuevo proveedor
          </button>
        </div>
      </div>
    </div>

    <section class="pg-cuerpo pg-cuerpo--grilla">
    <div
      v-if="proveedoresFiltrados.length"
      class="pg-grilla-viewport"
      aria-label="Proveedores"
    >
      <div class="pg-grilla-wrap">
        <article
          v-for="p in proveedoresFiltrados"
          :key="p.id"
          class="prv-card"
          :class="{ 'prv-card--inhabil': !p.habilitado }"
        >
          <div class="prv-card-afilado" aria-hidden="true" />
          <div class="prv-card-cuerpo prv-card-cuerpo--resumida">
            <header class="prv-card-cab">
              <h2 class="prv-card-nom">{{ p.nombre }}</h2>
              <span v-if="!p.habilitado" class="prv-badge">Inhabilitado</span>
            </header>
            <p class="prv-card-doc prv-mono" :title="p.documento">{{ p.documento }}</p>
            <div class="prv-card-estados">
              <div class="prv-card-fila-estado" aria-label="Estado para compras">
                <span class="prv-card-etiq-cc">Compras</span>
                <span
                  :class="p.habilitado ? 'prv-chip prv-chip--si' : 'prv-chip prv-chip--no'"
                >
                  {{ p.habilitado ? 'Habilitado' : 'Inhabilitado' }}
                </span>
              </div>
              <div class="prv-card-fila-estado" aria-label="Compras a crédito">
                <span class="prv-card-etiq-cc">Créd.</span>
                <span
                  :class="p.comprasCreditoHabilitadas ? 'prv-chip prv-chip--si' : 'prv-chip prv-chip--no'"
                >
                  {{ p.comprasCreditoHabilitadas ? 'Sí' : 'No' }}
                </span>
              </div>
            </div>

            <footer class="prv-card-pie">
              <div class="prv-card-acciones">
                <button type="button" class="prv-btn-detalle" @click="abrirDetalleProveedor(p)">
                  Detalle
                </button>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
    <p v-else class="pg-vacio--grilla">No hay proveedores que coincidan con la búsqueda.</p>
    </section>

    </div>

    <Teleport to="body">
      <dialog
        ref="refDialog"
        class="prv-modal prv-modal-edicion-proveedor"
        aria-labelledby="prv-dlg-tit"
        @close="alCerrarDialogo"
        @cancel.prevent="cerrarDialogo"
      >
        <div v-if="borrador" class="prv-ed-panel" @click.stop>
          <header class="prv-ed-cab">
            <div class="prv-ed-cab-marca">
              <p class="prv-ed-eyebrow">Proveedores · datos maestros</p>
              <div class="prv-ed-cab-titular">
                <h2 id="prv-dlg-tit" class="prv-ed-tit">
                  {{ tituloModalProveedor }}
                </h2>
                <button type="button" class="prv-modal-x" aria-label="Cerrar" @click="cerrarDialogo">
                  ×
                </button>
              </div>
              <p v-if="modoDialogoProveedor === 'alta'" id="prv-dlg-sub" class="prv-ed-sub">
                Registre los datos para compras, facturación y seguimiento del proveedor.
              </p>
              <p
                v-else-if="borrador.nombre.trim()"
                id="prv-dlg-sub"
                class="prv-ed-contexto"
              >
                <span class="prv-ed-contexto-nombre">{{ borrador.nombre.trim() }}</span>
                <span v-if="borrador.documento" class="prv-ed-chip-doc prv-ed-inp-mono">
                  {{ borrador.documento }}
                </span>
              </p>
              <p v-else id="prv-dlg-sub" class="prv-ed-sub">
                Consulte los datos del proveedor seleccionado.
              </p>
            </div>
            <div class="prv-ed-cab-acciones">
              <div class="prv-ed-hab">
                <span id="prv-ed-hab-lbl" class="prv-ed-hab-lbl">Habilitado</span>
                <label
                  class="prv-sw prv-sw--compacto prv-ed-hab-sw"
                  :class="{ 'prv-ed-hab-sw--solo-lectura': !formularioProveedorEditable }"
                  aria-labelledby="prv-ed-hab-lbl"
                >
                  <input
                    id="ed-hab"
                    v-model="borrador.habilitado"
                    type="checkbox"
                    class="prv-sw-input"
                    role="switch"
                    :disabled="!formularioProveedorEditable"
                    :aria-label="
                      borrador.habilitado
                        ? 'Proveedor habilitado para compras'
                        : 'Proveedor inhabilitado para compras'
                    "
                  />
                  <span class="prv-sw-ui" aria-hidden="true" />
                </label>
              </div>
            </div>
          </header>

          <div class="prv-ed-bandera" aria-hidden="true" />

          <form
            class="prv-ed-form"
            :class="{ 'prv-ed-form--solo-lectura': !formularioProveedorEditable }"
            aria-describedby="prv-dlg-sub"
            @submit.prevent="guardarProveedor"
          >
            <div class="prv-ed-cuerpo">
              <section class="prv-ed-bloque" aria-labelledby="prv-sec-ident">
                <header class="prv-ed-bloque-cab">
                  <IdCard class="prv-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="prv-ed-bloque-txt">
                    <h3 id="prv-sec-ident" class="prv-ed-bloque-tit">Identificación</h3>
                    <p class="prv-ed-bloque-desc">Nombre y documento único en el sistema</p>
                  </div>
                </header>
                <div class="prv-ed-fila prv-ed-fila--ident">
                  <div class="prv-ed-campo prv-ed-campo--nombre">
                    <label class="prv-ed-etiq" for="ed-nombre">Nombre o razón social</label>
                    <input
                      id="ed-nombre"
                      v-model="borrador.nombre"
                      type="text"
                      class="prv-ed-inp"
                      required
                      autocomplete="organization"
                      placeholder="Ej. Distribuidora Norte S.A."
                      :disabled="!formularioProveedorEditable"
                    />
                  </div>
                  <div class="prv-ed-campo">
                    <label class="prv-ed-etiq" for="ed-doc">Documento / CUIT</label>
                    <input
                      id="ed-doc"
                      :value="borrador.documento"
                      type="text"
                      inputmode="text"
                      class="prv-ed-inp prv-ed-inp-mono"
                      :class="{ 'prv-ed-inp--error': erroresValidacionProveedor.documento }"
                      placeholder="DNI o CUIT"
                      autocomplete="off"
                      title="DNI con puntos o CUIT con guiones; se formatea al escribir."
                      :aria-invalid="erroresValidacionProveedor.documento ? true : undefined"
                      :aria-describedby="
                        erroresValidacionProveedor.documento ? 'ed-doc-err' : undefined
                      "
                      :disabled="!formularioProveedorEditable"
                      @input="alEscribirDocumentoProveedor(($event.target as HTMLInputElement).value)"
                      @paste="alPegarDocumentoProveedor"
                    />
                    <p
                      v-if="erroresValidacionProveedor.documento"
                      id="ed-doc-err"
                      class="prv-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionProveedor.documento }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="prv-ed-bloque" aria-labelledby="prv-sec-contacto">
                <header class="prv-ed-bloque-cab">
                  <Phone class="prv-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="prv-ed-bloque-txt">
                    <h3 id="prv-sec-contacto" class="prv-ed-bloque-tit">Contacto</h3>
                    <p class="prv-ed-bloque-desc">Teléfonos, correo y domicilio comercial</p>
                  </div>
                </header>
                <div class="prv-ed-fila prv-ed-fila--contacto">
                  <div class="prv-ed-campo">
                    <label class="prv-ed-etiq" for="ed-tel-p">Teléfono principal</label>
                    <input
                      id="ed-tel-p"
                      v-model="borrador.telefonoPrincipal"
                      type="tel"
                      class="prv-ed-inp prv-ed-inp-mono"
                      autocomplete="tel"
                      placeholder="11 2345-6789"
                      :class="{ 'prv-ed-inp--error': erroresValidacionProveedor.telefonoPrincipal }"
                      :aria-invalid="erroresValidacionProveedor.telefonoPrincipal ? true : undefined"
                      :disabled="!formularioProveedorEditable"
                    />
                    <p
                      v-if="erroresValidacionProveedor.telefonoPrincipal"
                      class="prv-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionProveedor.telefonoPrincipal }}
                    </p>
                  </div>
                  <div class="prv-ed-campo">
                    <label class="prv-ed-etiq" for="ed-tel-alt">Teléfono alternativo</label>
                    <input
                      id="ed-tel-alt"
                      v-model="borrador.telefonoAlternativo"
                      type="tel"
                      class="prv-ed-inp prv-ed-inp-mono"
                      autocomplete="tel"
                      placeholder="Opcional"
                      :class="{ 'prv-ed-inp--error': erroresValidacionProveedor.telefonoAlternativo }"
                      :aria-invalid="erroresValidacionProveedor.telefonoAlternativo ? true : undefined"
                      :disabled="!formularioProveedorEditable"
                    />
                    <p
                      v-if="erroresValidacionProveedor.telefonoAlternativo"
                      class="prv-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionProveedor.telefonoAlternativo }}
                    </p>
                  </div>
                  <div class="prv-ed-campo">
                    <label class="prv-ed-etiq" for="ed-correo">Correo electrónico</label>
                    <input
                      id="ed-correo"
                      v-model="borrador.correoElectronico"
                      type="email"
                      class="prv-ed-inp"
                      autocomplete="email"
                      inputmode="email"
                      placeholder="contacto@proveedor.com"
                      :class="{ 'prv-ed-inp--error': erroresValidacionProveedor.correoElectronico }"
                      :aria-invalid="erroresValidacionProveedor.correoElectronico ? true : undefined"
                      :aria-describedby="
                        erroresValidacionProveedor.correoElectronico ? 'ed-correo-err' : undefined
                      "
                      :disabled="!formularioProveedorEditable"
                    />
                    <p
                      v-if="erroresValidacionProveedor.correoElectronico"
                      id="ed-correo-err"
                      class="prv-ed-error"
                      role="alert"
                    >
                      {{ erroresValidacionProveedor.correoElectronico }}
                    </p>
                  </div>
                </div>
                <div class="prv-ed-fila prv-ed-fila--direccion">
                  <div class="prv-ed-campo">
                    <label class="prv-ed-etiq" for="ed-dir">
                      <MapPin class="prv-ed-etiq-ico" aria-hidden="true" :size="14" stroke-width="2.2" />
                      Dirección
                    </label>
                    <input
                      id="ed-dir"
                      v-model="borrador.direccion"
                      type="text"
                      class="prv-ed-inp"
                      placeholder="Calle, número, localidad, código postal"
                      autocomplete="street-address"
                      :disabled="!formularioProveedorEditable"
                    />
                  </div>
                </div>
              </section>

              <section
                class="prv-ed-bloque prv-ed-bloque--finanza"
                aria-labelledby="prv-sec-cc"
              >
                <header class="prv-ed-bloque-cab prv-ed-bloque-cab--finanza">
                  <Landmark class="prv-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="prv-ed-bloque-txt">
                    <h3 id="prv-sec-cc" class="prv-ed-bloque-tit">Compras a crédito</h3>
                    <p class="prv-ed-bloque-desc">Condiciones para registrar compras sin pago inmediato</p>
                  </div>
                </header>
                <div class="prv-ed-finanza-cuerpo">
                  <label
                    class="prv-ed-check"
                    :class="{ 'prv-ed-check--solo-lectura': !formularioProveedorEditable }"
                    for="ed-cc-hab"
                  >
                    <input
                      id="ed-cc-hab"
                      v-model="borrador.comprasCreditoHabilitadas"
                      type="checkbox"
                      :disabled="!formularioProveedorEditable"
                    />
                    <span>Permitir compras a crédito con este proveedor</span>
                  </label>
                  <div
                    v-if="borrador.comprasCreditoHabilitadas"
                    class="prv-ed-campo prv-ed-campo--limite"
                  >
                    <label class="prv-ed-etiq" for="ed-lim">Tope estimado de crédito (ARS)</label>
                    <input
                      id="ed-lim"
                      v-model.number="borrador.limiteCreditoCompras"
                      type="number"
                      min="0"
                      step="1000"
                      class="prv-ed-inp prv-ed-inp-mono prv-ed-inp--limite"
                      inputmode="numeric"
                      placeholder="0"
                      :disabled="!formularioProveedorEditable"
                    />
                  </div>
                  <p class="prv-ed-nota">
                    El tope aplica solo si el proveedor tiene compras a crédito activas.
                  </p>
                </div>
              </section>
            </div>

            <p
              v-if="mensajeErrorGeneralProveedorGuardar"
              class="prv-error-general-modal prv-error-general-modal--ed"
              role="alert"
            >
              {{ mensajeErrorGeneralProveedorGuardar }}
            </p>

            <footer class="prv-ed-pie">
              <button type="button" class="prv-btn-sec" @click="alPieSecundarioProveedor">
                {{ textoBotonPieSecundario }}
              </button>
              <button
                v-if="formularioProveedorEditable"
                type="submit"
                class="prv-btn-pri"
              >
                {{ modoDialogoProveedor === 'alta' ? 'Crear proveedor' : 'Guardar cambios' }}
              </button>
              <button
                v-else-if="puedeGestionarProveedores"
                type="button"
                class="prv-btn-pri"
                @click="activarEdicionProveedor"
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
.pg-marco--proveedores {
  --pg-grilla-altura-fila: 9.4rem;
  --pg-reserva-vertical-vista: clamp(12.5rem, 24dvh, 18rem);
}

.pg-marco--proveedores .pg-barra-col--accion .pg-btn-primario {
  width: 100%;
}

@media (min-width: 720px) {
  .pg-marco--proveedores .pg-barra-col--accion .pg-btn-primario {
    width: auto;
    min-width: 10.5rem;
  }
}

.prv-btn-nuevo {
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

.prv-btn-nuevo:hover {
  filter: brightness(1.06);
}

.pg-filtro-etiq {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.pg-filtro-etiq--inline {
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

.pg-filtro-etiq-tip {
  margin: -0.1rem 0 0.4rem;
  font-size: 0.71rem;
  line-height: 1.42;
  color: var(--color-texto-apagado);
  font-weight: 500;
}

.prv-campo-error {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-peligro);
}

.pg-filtro-inp--dato-invalido {
  border-color: rgba(251, 113, 133, 0.75);
}

.pg-filtro-inp {
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

.prv-card {
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
  .prv-card:hover {
    border-color: rgba(124, 140, 240, 0.35);
    box-shadow:
      0 0 0 1px rgba(124, 140, 240, 0.12),
      0 16px 40px rgba(0, 0, 0, 0.38);
    transform: translateY(-1px);
  }
}

.prv-card--inhabil {
  opacity: 0.82;
  border-style: dashed;
  filter: saturate(0.92);
}

.prv-card--inhabil .prv-card-afilado {
  opacity: 0.45;
}

.prv-card-afilado {
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

.prv-card-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  flex: 1 1 auto;
  padding: 0.65rem 0.82rem 0.55rem;
  overflow: visible;
}

.prv-card-cuerpo--resumida {
  gap: 0.42rem;
  padding: 0.58rem 0.72rem 0.52rem;
}

.prv-card-doc {
  margin: 0;
  flex-shrink: 0;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--color-texto-apagado);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prv-card-fila-estado {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  min-width: 0;
}

.prv-card-estados {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  flex-shrink: 0;
}

.prv-card-etiq-cc {
  font-size: 0.54rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-texto-apagado);
}

.prv-card-cab {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.45rem;
  padding-bottom: 0.05rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.55);
}

.prv-card-nom {
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

.prv-badge {
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

.prv-error-general-modal {
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

.prv-card-pie {
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
  .prv-card-pie {
    flex-direction: column;
    align-items: stretch;
  }

  .prv-card-acciones {
    width: 100%;
    margin-left: 0;
    justify-content: stretch;
  }

  .prv-card-acciones .prv-btn-detalle {
    flex: 1;
    justify-content: center;
  }
}

.prv-card-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.prv-mono {
  font-variant-numeric: tabular-nums;
}

.prv-btn-detalle {
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

.prv-btn-detalle:hover {
  border-color: rgba(124, 140, 240, 0.35);
  color: var(--color-texto);
  background: rgba(124, 140, 240, 0.08);
}

.prv-btn-detalle:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.prv-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.17rem 0.48rem;
  border-radius: 999px;
  font-size: 0.6275rem;
  font-weight: 700;
  letter-spacing: 0.015em;
  border: 1px solid transparent;
}

.prv-chip--si {
  background: rgba(124, 140, 240, 0.22);
  border-color: rgba(124, 140, 240, 0.35);
  color: var(--color-acento-hover);
}

.prv-chip--no {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-borde);
  color: var(--color-texto-apagado);
}

.prv-vacio {
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
}

.prv-modal {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
}

.prv-modal:not([open]) {
  display: none;
}

.prv-modal[open] {
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

.prv-modal::backdrop {
  background: rgba(7, 11, 20, 0.76);
  backdrop-filter: blur(3px);
}

.prv-modal-edicion-proveedor[open] {
  width: min(72rem, calc(100vw - 2rem));
  max-width: min(72rem, calc(100vw - 2rem));
  min-height: min(32rem, calc(100dvh - 2.5rem));
  max-height: calc(100dvh - 1.25rem);
}

@media (min-width: 1200px) {
  .prv-modal-edicion-proveedor[open] {
    width: min(80rem, calc(100vw - 3rem));
    max-width: min(80rem, calc(100vw - 3rem));
  }
}

.prv-ed-panel {
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

.prv-ed-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.25rem;
  flex-shrink: 0;
  padding: 1.15rem clamp(1.35rem, 3.5vw, 2rem) 0.65rem;
}

.prv-ed-cab-marca {
  min-width: 0;
  flex: 1;
}

.prv-ed-cab-titular {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
}

.prv-ed-cab-acciones {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.prv-ed-hab {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.38rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(42, 58, 84, 0.75);
  background: rgba(21, 29, 46, 0.55);
}

.prv-ed-hab:has(.prv-sw-input:checked) {
  border-color: rgba(124, 140, 240, 0.38);
  background: rgba(124, 140, 240, 0.1);
}

.prv-ed-hab-lbl {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  user-select: none;
}

.prv-ed-hab:has(.prv-sw-input:checked) .prv-ed-hab-lbl {
  color: var(--color-texto);
}

.prv-ed-hab-sw--solo-lectura {
  cursor: default;
  opacity: 0.88;
}

.prv-ed-hab-sw--solo-lectura .prv-sw-input:disabled {
  cursor: default;
}

.prv-sw {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  vertical-align: middle;
}

.prv-sw-input {
  position: absolute;
  inset: 0;
  width: 2.5rem;
  height: 1.45rem;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.prv-sw-input:disabled {
  cursor: default;
}

.prv-sw-ui {
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

.prv-sw-ui::after {
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

.prv-sw-input:focus-visible + .prv-sw-ui {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.prv-sw-input:checked + .prv-sw-ui {
  background: rgba(124, 140, 240, 0.35);
  border-color: rgba(124, 140, 240, 0.55);
}

.prv-sw-input:checked + .prv-sw-ui::after {
  transform: translate(1.05rem, -50%);
  background: var(--color-acento-hover);
}

.prv-sw.prv-sw--compacto .prv-sw-input {
  width: 2.1rem;
  height: 1.2rem;
}

.prv-sw.prv-sw--compacto .prv-sw-ui {
  width: 2.1rem;
  height: 1.2rem;
}

.prv-sw.prv-sw--compacto .prv-sw-ui::after {
  width: 0.88rem;
  height: 0.88rem;
  left: 0.16rem;
}

.prv-sw.prv-sw--compacto .prv-sw-input:checked + .prv-sw-ui::after {
  transform: translate(0.84rem, -50%);
}

.prv-ed-eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  color: rgba(139, 156, 179, 0.95);
}

.prv-ed-tit {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.2;
  color: var(--color-texto);
}

.prv-ed-sub {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
  max-width: 58ch;
}

.prv-ed-contexto {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.75rem;
  margin: 0.55rem 0 0;
}

.prv-ed-contexto-nombre {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  line-height: 1.35;
}

.prv-ed-chip-doc {
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

.prv-ed-bandera {
  height: 3px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(124, 140, 240, 0.12),
    rgba(154, 124, 240, 0.62),
    rgba(124, 140, 240, 0.18)
  );
}

.prv-ed-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.prv-ed-cuerpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.1rem clamp(1.35rem, 3.5vw, 2rem) 1.15rem;
}

@media (max-width: 899px) {
  .prv-modal-edicion-proveedor[open] {
    width: min(48rem, calc(100vw - 1.25rem));
    max-width: min(48rem, calc(100vw - 1.25rem));
    min-height: 0;
  }

  .prv-ed-panel {
    min-height: 0;
  }

  .prv-ed-cuerpo {
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

@media (max-width: 800px) {
  .prv-ed-cab {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
    padding: 0.85rem 1rem 0.55rem;
  }

  .prv-ed-cab-acciones {
    justify-content: flex-start;
  }

  .prv-ed-eyebrow {
    margin-bottom: 0.28rem;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
  }

  .prv-ed-tit {
    font-size: 1.08rem;
    line-height: 1.25;
  }

  .prv-ed-sub {
    margin-top: 0.4rem;
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .prv-ed-contexto {
    margin-top: 0.4rem;
    gap: 0.4rem 0.55rem;
  }

  .prv-ed-contexto-nombre {
    font-size: 0.86rem;
  }

  .prv-ed-chip-doc {
    font-size: 0.75rem;
  }
}

.prv-ed-bloque {
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid rgba(42, 58, 84, 0.8);
  background: rgba(7, 11, 20, 0.32);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  overflow: hidden;
}

.prv-ed-bloque--finanza {
  border-color: rgba(124, 140, 240, 0.28);
  background: linear-gradient(
    160deg,
    rgba(124, 140, 240, 0.09) 0%,
    rgba(7, 11, 20, 0.42) 55%,
    rgba(7, 11, 20, 0.32) 100%
  );
}

.prv-ed-bloque-cab {
  display: flex;
  align-items: flex-start;
  gap: 0.72rem;
  padding: 0.85rem 1.1rem 0.75rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.65);
  background: rgba(21, 29, 46, 0.48);
}

.prv-ed-bloque-cab--finanza {
  background: rgba(124, 140, 240, 0.07);
  border-bottom-color: rgba(124, 140, 240, 0.16);
}

.prv-ed-bloque-ico {
  flex-shrink: 0;
  margin-top: 0.12rem;
  color: var(--color-acento-hover);
  opacity: 0.95;
}

.prv-ed-bloque-txt {
  min-width: 0;
  flex: 1;
}

.prv-ed-bloque-tit {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
  color: var(--color-texto);
}

.prv-ed-bloque-desc {
  margin: 0.22rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.prv-ed-fila {
  display: grid;
  gap: 0.85rem 1.1rem;
  padding: 1rem 1.1rem 1.1rem;
}

.prv-ed-fila--ident {
  grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr);
}

.prv-ed-fila--contacto {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding-bottom: 0.65rem;
}

.prv-ed-fila--direccion {
  padding-top: 0;
  border-top: 1px dashed rgba(42, 58, 84, 0.55);
}

@media (max-width: 1023px) {
  .prv-ed-fila--contacto {
    grid-template-columns: 1fr 1fr;
  }

  .prv-ed-fila--contacto .prv-ed-campo:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 599px) {
  .prv-ed-fila--ident,
  .prv-ed-fila--contacto {
    grid-template-columns: 1fr;
  }

  .prv-ed-fila--contacto .prv-ed-campo:last-child {
    grid-column: auto;
  }
}

.prv-ed-finanza-cuerpo {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.85fr);
  gap: 0.85rem 1.25rem;
  align-items: start;
  padding: 1rem 1.1rem 1.05rem;
}

.prv-ed-finanza-cuerpo .prv-ed-nota {
  grid-column: 1 / -1;
  margin: 0.15rem 0 0;
}

@media (max-width: 699px) {
  .prv-ed-finanza-cuerpo {
    grid-template-columns: 1fr;
  }
}

.prv-ed-campo {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  min-width: 0;
}

.prv-ed-campo--limite {
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px dashed rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.05);
}

.prv-ed-etiq {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-texto-suave);
}

.prv-ed-etiq-ico {
  flex-shrink: 0;
  opacity: 0.75;
  color: var(--color-texto-apagado);
}

.prv-ed-inp {
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

.prv-ed-inp--limite {
  max-width: 14rem;
}

.prv-ed-inp:hover {
  border-color: rgba(124, 140, 240, 0.32);
}

.prv-ed-inp:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow: 0 0 0 3px rgba(124, 140, 240, 0.2);
}

.prv-ed-form--solo-lectura .prv-ed-inp:disabled {
  opacity: 1;
  cursor: default;
  color: var(--color-texto-suave);
  background: rgba(7, 11, 20, 0.38);
  border-color: rgba(42, 58, 84, 0.55);
  box-shadow: none;
}

.prv-ed-form--solo-lectura .prv-ed-inp:disabled::placeholder {
  color: transparent;
}

.prv-ed-check--solo-lectura {
  cursor: default;
  opacity: 0.92;
}

.prv-ed-check--solo-lectura input:disabled {
  cursor: default;
}

.prv-ed-form--solo-lectura .prv-ed-campo--limite {
  border-style: solid;
  background: rgba(7, 11, 20, 0.32);
}

.prv-ed-inp--error {
  border-color: rgba(251, 113, 133, 0.75);
}

.prv-ed-inp--error:focus {
  border-color: var(--color-peligro);
  box-shadow: 0 0 0 3px rgba(251, 113, 133, 0.2);
}

.prv-ed-inp-mono {
  font-variant-numeric: tabular-nums;
}

.prv-ed-error {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-peligro);
}

.prv-ed-check {
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

.prv-ed-check:has(input:checked) {
  border-color: rgba(124, 140, 240, 0.42);
  background: rgba(124, 140, 240, 0.1);
}

.prv-ed-check input {
  width: 1.05rem;
  height: 1.05rem;
  margin: 0.15rem 0 0;
  accent-color: var(--color-acento);
  flex-shrink: 0;
}

.prv-ed-nota {
  margin: 0;
  padding-top: 0.65rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
  border-top: 1px solid rgba(42, 58, 84, 0.45);
}

.prv-error-general-modal--ed {
  flex-shrink: 0;
  margin: 0 clamp(1.35rem, 3.5vw, 2rem);
}

.prv-ed-pie {
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

.prv-modal-x {
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

.prv-modal-x:hover {
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.06);
}

.prv-btn-sec {
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

.prv-btn-pri {
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

.prv-btn-pri:hover {
  background: var(--color-acento-hover);
}

.prv-btn-sec:active,
.prv-btn-pri:active {
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .prv-card {
    transition: none;
  }

  .prv-card:hover {
    transform: none;
  }

  .prv-btn-sec,
  .prv-btn-pri {
    transition: none;
  }

  .prv-btn-sec:active,
  .prv-btn-pri:active {
    transform: none;
  }
}
</style>
