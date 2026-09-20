import type { APIRoute } from 'astro';
import { getDb, leads } from '../../db';
import { getBike } from '../../data/bikes';
import { leadSchema, leadMetaSchema, toFieldErrors } from '../../lib/lead-schema';
import { checkRateLimit, clientIp } from '../../lib/rate-limit';

export const prerender = false;

/** Un humano no completa cuatro campos en menos de dos segundos. */
const MIN_FILL_MS = 2000;

function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json');
}

function json(body: unknown, status: number, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

/**
 * Respuesta de éxito.
 *
 * Con JavaScript devolvemos JSON y la página no recarga. Sin JavaScript
 * el navegador mandó un POST normal, así que respondemos 303 para que el
 * refresh no reenvíe el formulario.
 */
function success(request: Request) {
  if (wantsJson(request)) return json({ ok: true }, 200);
  return new Response(null, { status: 303, headers: { Location: '/gracias' } });
}

function failure(
  request: Request,
  status: number,
  message: string,
  errors?: Record<string, string>,
  headers?: HeadersInit
) {
  if (wantsJson(request)) {
    return json({ ok: false, message, errors }, status, headers);
  }
  const params = new URLSearchParams({ error: message });
  return new Response(null, {
    status: 303,
    headers: { Location: `/?${params}#contacto`, ...headers },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const limit = checkRateLimit(clientIp(request));
  if (!limit.allowed) {
    return failure(
      request,
      429,
      'Recibimos varias consultas desde tu conexión. Esperá unos minutos y volvé a intentar.',
      undefined,
      { 'retry-after': String(limit.retryAfterSeconds) }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure(request, 400, 'No pudimos leer el formulario.');
  }

  const raw = Object.fromEntries(form);

  const meta = leadMetaSchema.safeParse(raw);
  if (!meta.success) {
    return failure(request, 400, 'No pudimos procesar la consulta.');
  }

  // Trampas anti-spam. Devolvemos éxito a propósito: si el bot supiera que
  // lo detectamos, ajustaría el envío hasta pasar.
  const filledTooFast =
    meta.data.renderedAt !== undefined &&
    Date.now() - meta.data.renderedAt < MIN_FILL_MS;

  if (meta.data.company !== '' || filledTooFast) {
    return success(request);
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return failure(
      request,
      422,
      'Revisá los campos marcados.',
      toFieldErrors(parsed.error)
    );
  }

  // El slug ya se validó contra el catálogo, así que el modelo existe.
  const bike = getBike(parsed.data.bikeSlug)!;

  try {
    const db = await getDb();
    await db
      .insert(leads)
      .values({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        country: parsed.data.country,
        bikeSlug: bike.slug,
        bikeName: bike.name,
        utmSource: meta.data.utmSource || null,
      });
  } catch (error) {
    // El detalle va al log del servidor; al visitante solo qué puede hacer.
    console.error('[leads] fallo al guardar el lead', error);
    return failure(
      request,
      500,
      'No pudimos guardar tu consulta. Probá de nuevo en un minuto.'
    );
  }

  return success(request);
};

/** Cualquier otro método sobre esta ruta. */
export const ALL: APIRoute = () =>
  new Response('Method Not Allowed', {
    status: 405,
    headers: { allow: 'POST' },
  });
