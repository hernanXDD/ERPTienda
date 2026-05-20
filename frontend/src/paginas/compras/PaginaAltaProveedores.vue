<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  recolectarErroresFormatoCliente,
  type CampoValidacionFormatoCliente,
  type ErroresFormatoCliente,
} from '../../modulos/clientes/validadoresCliente';
import { formatearDocumentoClienteAlEscribir } from '../../modulos/clientes/formateadorDocumentoCliente';
import { useProveedoresStore } from '../../stores/proveedores';
import type { Proveedor } from '../../tipos/proveedor';
import { ClipboardCheck, Landmark, MapPin, Phone } from 'lucide-vue-next';

type ModoDialogoProveedor = 'alta' | 'edicion';

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const proveedoresStore = useProveedoresStore();
const { proveedores } = storeToRefs(proveedoresStore);

const busquedaNombre = ref('');
const refDialog = useTemplateRef<HTMLDialogElement>('refDialog');
const refCuadroDetalleProveedor = useTemplateRef<HTMLDialogElement>('refCuadroDetalleProveedor');
const borrador = ref<Proveedor | null>(null);
/** Proveedor mostrado sólo en lectura en el cuadro Detalle. */
const proveedorDetalle = ref<Proveedor | null>(null);
const modoDialogoProveedor = ref<ModoDialogoProveedor>('edicion');
const erroresValidacionProveedor = ref<ErroresFormatoCliente>({});
const mensajeErrorGeneralProveedorGuardar = ref('');

function huellaCamposValidablesProveedor(existente: Proveedor | null): string {
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

function crearProveedorVacio(): Proveedor {
  return {
    id: crypto.randomUUID(),
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
  borrador.value = crearProveedorVacio();
  refDialog.value?.showModal();
}

function abrirEditar(p: Proveedor) {
  erroresValidacionProveedor.value = {};
  mensajeErrorGeneralProveedorGuardar.value = '';
  modoDialogoProveedor.value = 'edicion';
  borrador.value = {
    ...p,
    documento: formatearDocumentoClienteAlEscribir(p.documento),
  };
  refDialog.value?.showModal();
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

  const proveedor: Proveedor = { ...datos, id };
  let guardadoOk = false;
  if (modoDialogoProveedor.value === 'alta') {
    guardadoOk = proveedoresStore.agregarProveedor(proveedor);
  } else {
    guardadoOk = proveedoresStore.actualizarProveedor(id, datos);
  }

  if (!guardadoOk) {
    const duplicado = proveedoresStore.documentoUsadoPorOtroProveedor(
      datos.documento,
      modoDialogoProveedor.value === 'edicion' ? id : undefined
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

  cerrarDialogo();
}

function alCerrarDialogo() {
  borrador.value = null;
}

function onToggleHabilitado(p: Proveedor, habilitado: boolean) {
  proveedoresStore.setHabilitado(p.id, habilitado);
}

function textoDetalleOVacio(texto: string): string {
  const normalizado = texto.trim();
  return normalizado.length > 0 ? normalizado : '—';
}

function abrirCuadroDetalleProveedor(p: Proveedor): void {
  proveedorDetalle.value = p;
  refCuadroDetalleProveedor.value?.showModal();
}

function cerrarCuadroDetalleProveedor(): void {
  refCuadroDetalleProveedor.value?.close();
}

function alCerrarCuadroDetalleProveedor(): void {
  proveedorDetalle.value = null;
}

function irAEditarDesdeDetalle(): void {
  const copia = proveedorDetalle.value;
  if (!copia) return;
  cerrarCuadroDetalleProveedor();
  abrirEditar(copia);
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-alta-proveedores">
    <div class="pg-marco pg-marco--tarjetas pg-marco--proveedores">
    <header class="pg-cab">
      <div class="pg-cab-txt">
        <h1 id="titulo-alta-proveedores" class="pg-titulo">Proveedores</h1>
      </div>
    </header>

    <div class="pg-barra">
      <div class="pg-barra-fila">
        <div class="prv-busq">
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
        <div class="prv-acciones">
          <button type="button" class="pg-btn-primario" @click="abrirAltaProveedor">Nuevo proveedor</button>
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
            <div class="prv-card-fila-estado" aria-label="Compras a crédito">
              <span class="prv-card-etiq-cc">Créd.</span>
              <span
                :class="p.comprasCreditoHabilitadas ? 'prv-chip prv-chip--si' : 'prv-chip prv-chip--no'"
              >
                {{ p.comprasCreditoHabilitadas ? 'Sí' : 'No' }}
              </span>
            </div>

            <footer class="prv-card-pie">
              <div class="prv-card-sw">
                <span class="prv-card-sw-lbl">Compras</span>
                <label class="prv-sw prv-sw--compacto">
                  <input
                    type="checkbox"
                    class="prv-sw-input"
                    role="switch"
                    :aria-label="`Habilitar o deshabilitar a ${p.nombre} para compras`"
                    :checked="p.habilitado"
                    @change="
                      onToggleHabilitado(p, ($event.target as HTMLInputElement).checked)
                    "
                  />
                  <span class="prv-sw-ui" aria-hidden="true" />
                </label>
              </div>
              <div class="prv-card-acciones">
                <button
                  type="button"
                  class="prv-btn-detalle"
                  @click="abrirCuadroDetalleProveedor(p)"
                >
                  Detalle
                </button>
                <button type="button" class="prv-btn-ed" @click="abrirEditar(p)">Editar</button>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
    <p v-else class="pg-vacio--grilla">No hay proveedores que coincidan con la búsqueda.</p>
    </section>

    </div>

    <dialog
      ref="refDialog"
      class="prv-modal"
      aria-labelledby="prv-dlg-tit"
      @close="alCerrarDialogo"
    >
      <div v-if="borrador" class="prv-modal-panel" @click.stop>
        <div class="prv-modal-sticky">
          <header class="prv-modal-cab">
            <div class="prv-modal-cab-txt">
              <h2 id="prv-dlg-tit" class="prv-modal-tit">
                {{ modoDialogoProveedor === 'alta' ? 'Nuevo proveedor' : 'Editar proveedor' }}
              </h2>
              <p id="prv-dlg-sub" class="prv-modal-sub">
                <template v-if="modoDialogoProveedor === 'alta'">
                  Datos maestros para compras y facturación. Podés inhibir el proveedor o el crédito desde la grilla cuando termines.
                </template>
                <template v-else>
                  Actualizá identificación, contacto y condiciones de compra a crédito con este proveedor.
                </template>
              </p>
            </div>
            <button type="button" class="prv-modal-x" aria-label="Cerrar" @click="cerrarDialogo">
              ×
            </button>
          </header>

          <hr class="prv-modal-line" aria-hidden="true" />
        </div>

        <form
          class="prv-form prv-form--modal"
          aria-describedby="prv-dlg-sub"
          @submit.prevent="guardarProveedor"
        >
          <section class="prv-modal-bloque" aria-labelledby="prv-sec-ident">
            <h3 id="prv-sec-ident" class="prv-modal-seccion-tit">Identificación</h3>
            <div class="prv-fila">
              <label class="pg-filtro-etiq" for="ed-nombre">Nombre o razón social</label>
              <input id="ed-nombre" v-model="borrador.nombre" type="text" class="pg-filtro-inp" required />
            </div>
            <div class="prv-fila">
              <label class="pg-filtro-etiq" for="ed-doc">Documento / CUIT</label>
              <p id="prv-tip-doc-ident" class="pg-filtro-etiq-tip">
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
                :class="{ 'pg-filtro-inp--dato-invalido': erroresValidacionProveedor.documento }"
                placeholder="Ej. DNI o CUIT (se formatea al escribir)…"
                autocomplete="off"
                :aria-invalid="erroresValidacionProveedor.documento ? true : undefined"
                :aria-describedby="
                  erroresValidacionProveedor.documento
                    ? 'prv-tip-doc-ident ed-doc-err'
                    : 'prv-tip-doc-ident'
                "
                @input="alEscribirDocumentoProveedor(($event.target as HTMLInputElement).value)"
                @paste="alPegarDocumentoProveedor"
              />
              <p
                v-if="erroresValidacionProveedor.documento"
                id="ed-doc-err"
                class="prv-campo-error"
                role="alert"
              >
                {{ erroresValidacionProveedor.documento }}
              </p>
            </div>
          </section>

          <section class="prv-modal-bloque" aria-labelledby="prv-sec-contacto">
            <h3 id="prv-sec-contacto" class="prv-modal-seccion-tit">Contacto y ubicación</h3>
            <div class="prv-modal-grid-duo">
              <div class="prv-fila">
                <label class="pg-filtro-etiq" for="ed-tel-p">Teléfono principal</label>
                <input
                  id="ed-tel-p"
                  v-model="borrador.telefonoPrincipal"
                  type="tel"
                  class="pg-filtro-inp"
                  autocomplete="tel"
                  :class="{ 'pg-filtro-inp--dato-invalido': erroresValidacionProveedor.telefonoPrincipal }"
                  :aria-invalid="erroresValidacionProveedor.telefonoPrincipal ? true : undefined"
                />
                <p
                  v-if="erroresValidacionProveedor.telefonoPrincipal"
                  class="prv-campo-error"
                  role="alert"
                >
                  {{ erroresValidacionProveedor.telefonoPrincipal }}
                </p>
              </div>
              <div class="prv-fila">
                <label class="pg-filtro-etiq" for="ed-tel-alt">Teléfono alternativo</label>
                <input
                  id="ed-tel-alt"
                  v-model="borrador.telefonoAlternativo"
                  type="tel"
                  class="pg-filtro-inp"
                  autocomplete="tel"
                  placeholder="Opcional"
                  :class="{ 'pg-filtro-inp--dato-invalido': erroresValidacionProveedor.telefonoAlternativo }"
                  :aria-invalid="erroresValidacionProveedor.telefonoAlternativo ? true : undefined"
                />
                <p
                  v-if="erroresValidacionProveedor.telefonoAlternativo"
                  class="prv-campo-error"
                  role="alert"
                >
                  {{ erroresValidacionProveedor.telefonoAlternativo }}
                </p>
              </div>
            </div>
            <div class="prv-fila">
              <label class="pg-filtro-etiq" for="ed-correo">Correo electrónico</label>
              <p id="prv-tip-correo" class="pg-filtro-etiq-tip">
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
                :class="{ 'pg-filtro-inp--dato-invalido': erroresValidacionProveedor.correoElectronico }"
                :aria-invalid="erroresValidacionProveedor.correoElectronico ? true : undefined"
                :aria-describedby="
                  erroresValidacionProveedor.correoElectronico
                    ? 'prv-tip-correo ed-correo-err'
                    : 'prv-tip-correo'
                "
              />
              <p
                v-if="erroresValidacionProveedor.correoElectronico"
                id="ed-correo-err"
                class="prv-campo-error"
                role="alert"
              >
                {{ erroresValidacionProveedor.correoElectronico }}
              </p>
            </div>
            <div class="prv-fila">
              <label class="pg-filtro-etiq" for="ed-dir">Dirección</label>
              <textarea
                id="ed-dir"
                v-model="borrador.direccion"
                class="prv-ta"
                rows="2"
                placeholder="Calle, localidad, código postal…"
              />
            </div>
          </section>

          <section
            class="prv-modal-bloque prv-modal-bloque--cc"
            aria-labelledby="prv-sec-cc"
          >
            <h3 id="prv-sec-cc" class="prv-modal-seccion-tit">Compras a crédito</h3>
            <p class="prv-modal-bloque-intro">
              Define si esta tienda puede dejar pendiente el pago de compras a este proveedor y hasta qué tope estimado en pesos (no reemplaza el contrato jurídico).
            </p>
            <div class="prv-fila prv-fila--chk prv-fila--cc">
              <label class="pg-filtro-etiq pg-filtro-etiq--inline">
                <input v-model="borrador.comprasCreditoHabilitadas" type="checkbox" />
                Permitir compras a crédito con este proveedor
              </label>
            </div>
            <div v-if="borrador.comprasCreditoHabilitadas" class="prv-fila prv-fila-limite-cc">
              <label class="pg-filtro-etiq" for="ed-lim">Límite estimado de crédito de compras (ARS)</label>
              <input
                id="ed-lim"
                v-model.number="borrador.limiteCreditoCompras"
                type="number"
                min="0"
                step="1000"
                class="pg-filtro-inp pg-filtro-inp-mono"
                inputmode="numeric"
              />
            </div>
          </section>

          <p
            v-if="mensajeErrorGeneralProveedorGuardar"
            class="prv-error-general-modal"
            role="alert"
          >
            {{ mensajeErrorGeneralProveedorGuardar }}
          </p>

          <p class="prv-ayuda prv-ayuda--modal">
            <template v-if="modoDialogoProveedor === 'alta'">
              El campo <strong>Nombre</strong> es obligatorio. El estado <strong>Habilitado</strong> para compras lo definís con el interruptor en la lista.
            </template>
            <template v-else>
              El estado <strong>Habilitado</strong> para compras solo se cambia con el interruptor en la tarjeta del listado.
            </template>
          </p>

          <div class="prv-modal-acc">
            <button type="button" class="prv-btn-sec" @click="cerrarDialogo">Cancelar</button>
            <button type="submit" class="prv-btn-pri">
              {{ modoDialogoProveedor === 'alta' ? 'Crear proveedor' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <dialog
      ref="refCuadroDetalleProveedor"
      class="prv-modal prv-modal-detalle-proveedor"
      aria-labelledby="prv-det-cli-tit"
      aria-modal="true"
      @close="alCerrarCuadroDetalleProveedor"
    >
      <div v-if="proveedorDetalle" class="prv-det-cli-panel" @click.stop>
        <header class="prv-det-cli-cab">
          <div class="prv-det-cli-cab-marca">
            <p class="prv-det-cli-eyebrow">Ficha maestra</p>
            <h2 id="prv-det-cli-tit" class="prv-det-cli-tit">{{ proveedorDetalle.nombre }}</h2>
            <p class="prv-det-cli-metadatos">
              <span class="prv-det-cli-chip-doc prv-mono" :title="proveedorDetalle.documento">
                {{ proveedorDetalle.documento }}
              </span>
            </p>
          </div>
          <button
            type="button"
            class="prv-modal-x"
            aria-label="Cerrar detalle"
            @click="cerrarCuadroDetalleProveedor"
          >
            ×
          </button>
        </header>
        <div class="prv-det-cli-bandera" aria-hidden="true" />
        <hr class="prv-det-cli-line-top" aria-hidden="true" />
        <div class="prv-det-cli-cuerpo">
          <section class="prv-det-cli-panel-seccion" aria-labelledby="prv-det-sec-contacto">
            <div class="prv-det-cli-sec-cab">
              <Phone class="prv-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="prv-det-sec-contacto" class="prv-det-cli-sec-tit">Contacto</h3>
            </div>
            <div class="prv-det-cli-sec-cuerpo">
              <dl class="prv-det-cli-spec">
                <div class="prv-det-cli-spec-fila">
                  <dt>Teléfono principal</dt>
                  <dd class="prv-mono">{{ textoDetalleOVacio(proveedorDetalle.telefonoPrincipal) }}</dd>
                </div>
                <div class="prv-det-cli-spec-fila">
                  <dt>Teléfono alternativo</dt>
                  <dd class="prv-mono">{{ textoDetalleOVacio(proveedorDetalle.telefonoAlternativo) }}</dd>
                </div>
                <div class="prv-det-cli-spec-fila">
                  <dt>Correo electrónico</dt>
                  <dd>{{ textoDetalleOVacio(proveedorDetalle.correoElectronico) }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="prv-det-cli-panel-seccion" aria-labelledby="prv-det-sec-dir">
            <div class="prv-det-cli-sec-cab">
              <MapPin class="prv-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="prv-det-sec-dir" class="prv-det-cli-sec-tit">Ubicación</h3>
            </div>
            <div class="prv-det-cli-sec-cuerpo">
              <p class="prv-det-cli-texto-multilinea">{{ textoDetalleOVacio(proveedorDetalle.direccion) }}</p>
            </div>
          </section>

          <section
            class="prv-det-cli-panel-seccion prv-det-cli-panel-seccion--finanza"
            aria-labelledby="prv-det-sec-cc"
          >
            <div class="prv-det-cli-sec-cab prv-det-cli-sec-cab--finanza">
              <Landmark class="prv-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="prv-det-sec-cc" class="prv-det-cli-sec-tit">Compras a crédito</h3>
            </div>
            <div class="prv-det-cli-sec-cuerpo">
              <dl class="prv-det-cli-spec">
                <div class="prv-det-cli-spec-fila">
                  <dt>Permite crédito de compras</dt>
                  <dd>
                    <span v-if="proveedorDetalle.comprasCreditoHabilitadas" class="prv-chip prv-chip--si">
                      Sí
                    </span>
                    <span v-else class="prv-chip prv-chip--no">No</span>
                  </dd>
                </div>
                <div class="prv-det-cli-spec-fila prv-det-cli-spec-fila--destacado">
                  <dt>Tope estimado crédito</dt>
                  <dd class="prv-det-cli-valor-cc prv-mono">
                    {{
                      proveedorDetalle.comprasCreditoHabilitadas
                        ? formatoPeso.format(proveedorDetalle.limiteCreditoCompras)
                        : '—'
                    }}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="prv-det-cli-panel-seccion" aria-labelledby="prv-det-sec-estado">
            <div class="prv-det-cli-sec-cab">
              <ClipboardCheck class="prv-det-cli-ico" aria-hidden="true" :size="17" stroke-width="2.1" />
              <h3 id="prv-det-sec-estado" class="prv-det-cli-sec-tit">Estado comercial</h3>
            </div>
            <div class="prv-det-cli-sec-cuerpo">
              <dl class="prv-det-cli-spec">
                <div class="prv-det-cli-spec-fila">
                  <dt>Habilitado para compras</dt>
                  <dd>
                    <span v-if="proveedorDetalle.habilitado" class="prv-chip prv-chip--si">Sí</span>
                    <span v-else class="prv-chip prv-chip--no">No</span>
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
        <footer class="prv-det-cli-pie">
          <button type="button" class="prv-btn-sec" @click="cerrarCuadroDetalleProveedor">
            Cerrar
          </button>
          <button type="button" class="prv-btn-pri" @click="irAEditarDesdeDetalle">
            Editar proveedor
          </button>
        </footer>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.pg-marco--proveedores {
  --pg-grilla-altura-fila: 9.4rem;
  --pg-reserva-vertical-vista: clamp(12.5rem, 24dvh, 18rem);
}

.pg-barra-fila {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

@media (min-width: 720px) {
  .pg-barra-fila {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .prv-busq {
    flex: 1;
    max-width: none;
    min-width: 14rem;
  }

  .prv-acciones {
    margin-left: auto;
  }
}

.prv-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
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

.prv-form--modal .pg-filtro-inp:hover,
.prv-form--modal .prv-ta:hover {
  border-color: rgba(124, 140, 240, 0.28);
}

.prv-form--modal .pg-filtro-inp:focus,
.prv-form--modal .prv-ta:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow: 0 0 0 2px rgba(124, 140, 240, 0.22);
}

.prv-form--modal .pg-filtro-inp--dato-invalido:hover {
  border-color: rgba(251, 113, 133, 0.45);
}

.prv-form--modal .pg-filtro-inp--dato-invalido:focus {
  outline: none;
  border-color: var(--color-peligro);
  box-shadow: 0 0 0 2px rgba(251, 113, 133, 0.22);
}

.prv-ta {
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

.prv-busq {
  max-width: 24rem;
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
  justify-content: space-between;
  gap: 0.45rem 0.65rem;
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

  .prv-card-acciones .prv-btn-detalle,
  .prv-card-acciones .prv-btn-ed {
    flex: 1;
    justify-content: center;
  }
}

.prv-card-sw {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
}

.prv-card-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-left: auto;
  justify-content: flex-end;
}

.prv-card-sw-lbl {
  font-size: 0.6275rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  max-width: 10rem;
}

.prv-mono {
  font-variant-numeric: tabular-nums;
}

.prv-btn-detalle,
.prv-btn-ed {
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

.prv-btn-detalle {
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

.prv-btn-ed {
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.08);
  color: var(--color-texto);
}

.prv-btn-ed:hover {
  border-color: rgba(124, 140, 240, 0.45);
  background: rgba(124, 140, 240, 0.14);
}

.prv-btn-ed:focus-visible {
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

.prv-vacio {
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
}

.prv-modal {
  margin: auto;
  padding: 0;
  width: min(36rem, calc(100vw - 1.5rem));
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.06),
    0 24px 56px rgba(0, 0, 0, 0.55);
}

.prv-modal::backdrop {
  background: rgba(0, 0, 0, 0.55);
}

.prv-modal-panel {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.prv-modal-detalle-proveedor {
  width: min(34rem, calc(100vw - 1.25rem));
  overflow: hidden;
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.1),
    0 28px 64px rgba(0, 0, 0, 0.58);
}

.prv-det-cli-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  background:
    radial-gradient(
      ellipse 120% 80% at 100% -20%,
      rgba(124, 140, 240, 0.14),
      transparent 52%
    ),
    var(--color-fondo-elevado);
}

.prv-det-cli-cab {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  flex-shrink: 0;
  padding: 1rem clamp(1.05rem, 3.2vw, 1.4rem) 0.35rem;
}

.prv-det-cli-cab-marca {
  min-width: 0;
  flex: 1;
  padding-right: 0.35rem;
}

.prv-det-cli-eyebrow {
  margin: 0 0 0.32rem;
  font-size: 0.645rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(139, 156, 179, 0.95);
}

.prv-det-cli-tit {
  margin: 0;
  font-size: 1.22rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.22;
  color: var(--color-texto);
}

.prv-det-cli-metadatos {
  margin: 0.55rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.prv-det-cli-chip-doc {
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

.prv-det-cli-bandera {
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

.prv-det-cli-line-top {
  margin: 0 clamp(1.05rem, 3.2vw, 1.4rem) 0;
  border: none;
  border-top: 1px solid rgba(42, 58, 84, 0.75);
}

.prv-det-cli-cuerpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.65rem clamp(1.05rem, 3.2vw, 1.4rem) 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.58rem;
}

.prv-det-cli-panel-seccion {
  border-radius: 12px;
  border: 1px solid rgba(42, 58, 84, 0.85);
  background: rgba(7, 11, 20, 0.38);
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.prv-det-cli-panel-seccion--finanza {
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

.prv-det-cli-sec-cab {
  display: flex;
  align-items: center;
  gap: 0.48rem;
  padding: 0.48rem 0.78rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.75);
  background: rgba(21, 29, 46, 0.55);
}

.prv-det-cli-sec-cab--finanza {
  background: rgba(124, 140, 240, 0.08);
  border-bottom-color: rgba(124, 140, 240, 0.18);
}

.prv-det-cli-ico {
  flex-shrink: 0;
  color: var(--color-acento-hover);
  opacity: 0.92;
}

.prv-det-cli-sec-tit {
  margin: 0;
  font-size: 0.69rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-texto);
}

.prv-det-cli-sec-cuerpo {
  padding: 0.15rem 0.78rem 0.72rem;
}

.prv-det-cli-spec {
  margin: 0;
}

.prv-det-cli-spec-fila {
  display: grid;
  grid-template-columns: minmax(6.75rem, 34%) minmax(0, 1fr);
  align-items: start;
  column-gap: 1rem;
  padding: 0.42rem 0;
  border-bottom: 1px solid rgba(42, 58, 84, 0.55);
}

.prv-det-cli-spec-fila:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.prv-det-cli-spec-fila:first-child {
  padding-top: 0.38rem;
}

.prv-det-cli-spec-fila--destacado dd {
  font-weight: 700;
  font-size: 0.94rem;
  letter-spacing: -0.025em;
  color: var(--color-texto);
}

.prv-det-cli-valor-cc {
  color: var(--color-texto) !important;
}

.prv-det-cli-spec-fila dt {
  margin: 0;
  padding-top: 0.12rem;
  font-size: 0.6425rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  line-height: 1.25;
}

.prv-det-cli-spec-fila dd {
  margin: 0;
  font-size: 0.8675rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
  word-break: break-word;
}

.prv-det-cli-texto-multilinea {
  margin: 0.35rem 0 0.12rem;
  font-size: 0.8675rem;
  line-height: 1.55;
  color: var(--color-texto-suave);
  white-space: pre-wrap;
}

.prv-det-cli-pie {
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
  .prv-det-cli-spec-fila {
    grid-template-columns: 1fr;
    row-gap: 0.08rem;
    padding: 0.48rem 0;
  }

  .prv-det-cli-spec-fila dt {
    padding-top: 0;
    font-size: 0.6rem;
  }

  .prv-det-cli-spec-fila dd {
    font-size: 0.8375rem;
  }
}

.prv-modal-sticky {
  position: sticky;
  top: 0;
  z-index: 2;
  flex-shrink: 0;
  background: var(--color-fondo-elevado);
}

.prv-modal-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 1.25rem 1.25rem 0.85rem;
  flex-shrink: 0;
}

.prv-modal-cab-txt {
  min-width: 0;
  flex: 1;
}

.prv-modal-tit {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.prv-modal-sub {
  margin: 0.4rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
  max-width: 46ch;
}

.prv-modal-line {
  margin: 0 1.25rem 0;
  border: none;
  border-top: 1px solid var(--color-borde);
}

.prv-modal-x {
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

.prv-modal-x:hover {
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.06);
}

.prv-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.prv-form--modal {
  gap: 0;
  padding: 0 1.25rem 1.25rem;
}

.prv-modal-bloque {
  padding: 0.95rem 0 1rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.65);
}

.prv-modal-bloque:last-of-type {
  border-bottom: none;
  padding-bottom: 0.35rem;
}

.prv-modal-bloque--cc {
  margin-top: 0.15rem;
  padding: 0.95rem 0.95rem 1rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: rgba(7, 11, 20, 0.55);
  border-bottom: 1px solid var(--color-borde);
}

.prv-modal-bloque--cc:last-of-type {
  margin-bottom: 0.85rem;
}

.prv-modal-bloque-intro {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.prv-modal-seccion-tit {
  margin: 0 0 0.72rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-acento-hover);
}

.prv-modal-bloque--cc .prv-modal-seccion-tit {
  margin-bottom: 0.5rem;
}

.prv-modal-grid-duo {
  display: grid;
  gap: 0.85rem;
}

@media (min-width: 520px) {
  .prv-modal-grid-duo {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem 1rem;
  }
}

.prv-fila-limite-cc {
  margin-top: 0.35rem;
  padding-top: 0.5rem;
}

.prv-fila--chk.prv-fila--cc {
  padding-top: 0;
}

.pg-filtro-inp-mono {
  font-variant-numeric: tabular-nums;
}

.prv-ayuda--modal {
  margin-top: 0.25rem;
  padding: 0.65rem 0.72rem;
  border-radius: 8px;
  background: rgba(124, 140, 240, 0.06);
  border: 1px solid rgba(124, 140, 240, 0.12);
  font-size: 0.75rem;
  line-height: 1.45;
}

.prv-fila {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.prv-fila--chk {
  padding-top: 0.15rem;
}

.prv-ayuda {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
  line-height: 1.4;
}

.prv-modal-acc {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-borde);
  flex-shrink: 0;
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
