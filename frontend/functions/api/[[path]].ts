/**
 * Proxy de /api/* hacia el backend en Easypanel.
 * El navegador llama al mismo origen (Pages); Cloudflare reenvía al VPS.
 * Evita CORS y problemas de conectividad móvil hacia easypanel.host.
 *
 * Variable en Cloudflare Pages → Settings → Environment variables (Production):
 *   API_ORIGIN=https://erptienda-erp-api.wz995r.easypanel.host
 *
 * Dejar VITE_API_BASE_URL sin definir (el frontend usa /api relativo).
 */

interface EntornoProxyApi {
  API_ORIGIN?: string;
}

export async function onRequest(context: {
  request: Request;
  env: EntornoProxyApi;
}): Promise<Response> {
  const origen = context.env.API_ORIGIN?.trim().replace(/\/+$/, '');
  if (!origen) {
    return new Response(
      JSON.stringify({
        ok: false,
        mensaje: 'API_ORIGIN no configurado en Cloudflare Pages.',
        datos: null,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const url = new URL(context.request.url);
  const destino = `${origen}${url.pathname}${url.search}`;

  const encabezados = new Headers(context.request.headers);
  encabezados.delete('host');

  const init: RequestInit = {
    method: context.request.method,
    headers: encabezados,
    redirect: 'manual',
  };

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body;
  }

  const respuesta = await fetch(destino, init);
  const cuerpo = respuesta.body;

  const respuestaProxy = new Response(cuerpo, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: respuesta.headers,
  });

  return respuestaProxy;
}
