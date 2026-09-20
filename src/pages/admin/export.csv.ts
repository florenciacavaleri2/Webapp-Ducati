import type { APIRoute } from 'astro';
import { and, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { getDb, leads, LEAD_STATUSES } from '../../db';
import { FAMILIES, bikes } from '../../data/bikes';
import { getCountry } from '../../data/countries';
import { csvFile } from '../../lib/csv';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  const status = url.searchParams.get('status') ?? '';
  const family = url.searchParams.get('family') ?? '';

  const conditions: SQL[] = [];

  if (q) {
    const pattern = `%${q}%`;
    const search = or(ilike(leads.fullName, pattern), ilike(leads.email, pattern));
    if (search) conditions.push(search);
  }

  if ((LEAD_STATUSES as readonly string[]).includes(status)) {
    conditions.push(eq(leads.status, status));
  }

  if ((FAMILIES as readonly string[]).includes(family)) {
    const slugs = bikes.filter((b) => b.family === family).map((b) => b.slug);
    conditions.push(inArray(leads.bikeSlug, slugs));
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(leads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(leads.createdAt));

  const header = [
    'fecha',
    'nombre',
    'email',
    'pais',
    'codigo_pais',
    'moto',
    'estado',
    'origen',
  ];

  const body = csvFile(
    header,
    rows.map((lead) => [
      lead.createdAt.toISOString(),
      lead.fullName,
      lead.email,
      getCountry(lead.country)?.name ?? lead.country,
      lead.country,
      lead.bikeName,
      lead.status,
      lead.utmSource,
    ])
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="leads-${stamp}.csv"`,
      'cache-control': 'no-store',
    },
  });
};
