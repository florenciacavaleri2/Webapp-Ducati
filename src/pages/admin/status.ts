import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb, leads, LEAD_STATUSES } from '../../db';

export const prerender = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cambia el estado de un lead y vuelve a la tabla con los filtros intactos. */
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();

  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '');

  // El destino viene del formulario, así que solo aceptamos un query string
  // nuestro: sin esto sería un redirector abierto.
  const backRaw = String(form.get('back') ?? '');
  const back = backRaw.startsWith('?') ? `/admin${backRaw}` : '/admin';

  if (!UUID.test(id) || !(LEAD_STATUSES as readonly string[]).includes(status)) {
    return redirect(back, 303);
  }

  const db = await getDb();
  await db.update(leads).set({ status }).where(eq(leads.id, id));

  return redirect(back, 303);
};
