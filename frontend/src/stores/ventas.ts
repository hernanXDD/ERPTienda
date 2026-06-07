import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  cargarFacturacionesApi,
  listarVentasApi,
  registrarVentaApi,
  type VentaRegistradaApi,
} from '../servicios/ventas.servicio';
import type {
  IdFormaPago,
  ItemCargarFacturacion,
  LineaVentaRegistro,
  VentaRegistrada,
} from '../tipos/venta';
import type { IdCondicionIva } from '../tipos/condicionIva';
import { CONDICION_IVA_POR_DEFECTO } from '../tipos/condicionIva';
import { ESTADO_FACTURACION_PENDIENTE } from '../tipos/venta';
import type { RegistroOperador } from '../tipos/registroOperador';
import { crearRegistroOperadorDesdeSesion } from '../utilidades/registroOperadorSesion';

export interface DatosRegistrarVenta {
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar?: string;
  formaPago: IdFormaPago;
  total: number;
  lineas: LineaVentaRegistro[];
  observaciones: string;
}

function mapearVentaApi(
  venta: VentaRegistradaApi,
  registradoPor?: RegistroOperador,
): VentaRegistrada {
  return {
    id: venta.id,
    numero: venta.numero,
    fecha: venta.fecha,
    clienteId: venta.clienteId,
    nombreClienteMostrar: venta.nombreClienteMostrar,
    documentoClienteMostrar: venta.documentoClienteMostrar ?? '',
    condicionIvaCliente: (venta.condicionIvaCliente as IdCondicionIva) ?? CONDICION_IVA_POR_DEFECTO,
    formaPago: venta.formaPago as IdFormaPago,
    total: venta.total,
    facturacion: venta.facturacion ?? '',
    estadoFacturacion: venta.estadoFacturacion ?? ESTADO_FACTURACION_PENDIENTE,
    lineas: venta.lineas,
    observaciones: venta.observaciones,
    registradoPor: registradoPor ?? {
      idUsuario: null,
      etiquetaUsuario: '—',
    },
  };
}

export const useVentasStore = defineStore('ventas', () => {
  const ventas = ref<VentaRegistrada[]>([]);
  const cargandoVentas = ref(false);
  let ventasSincronizadas = false;

  async function cargarVentas(): Promise<void> {
    if (cargandoVentas.value) return;
    cargandoVentas.value = true;
    try {
      const lista = await listarVentasApi();
      ventas.value = lista.map((v) => mapearVentaApi(v));
      ventasSincronizadas = true;
    } finally {
      cargandoVentas.value = false;
    }
  }

  async function asegurarVentasCargadas(): Promise<void> {
    if (!ventasSincronizadas) await cargarVentas();
  }

  async function registrarVenta(datos: DatosRegistrarVenta): Promise<VentaRegistrada> {
    const registradaApi = await registrarVentaApi(datos);
    const registrada = mapearVentaApi(registradaApi, crearRegistroOperadorDesdeSesion());
    ventas.value = [registrada, ...ventas.value.filter((v) => v.id !== registrada.id)];
    ventasSincronizadas = true;
    return registrada;
  }

  async function cargarFacturaciones(items: ItemCargarFacturacion[]): Promise<void> {
    const actualizadasApi = await cargarFacturacionesApi(items);
    const actualizadas = actualizadasApi.map((venta) => mapearVentaApi(venta));
    const porId = new Map(actualizadas.map((venta) => [venta.id, venta]));
    ventas.value = ventas.value.map((venta) => porId.get(venta.id) ?? venta);
    ventasSincronizadas = true;
  }

  return {
    ventas,
    cargandoVentas,
    cargarVentas,
    asegurarVentasCargadas,
    registrarVenta,
    cargarFacturaciones,
  };
});
