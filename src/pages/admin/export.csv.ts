import type { APIRoute } from 'astro';
import { and, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { getDb, leads, LEAD_STATUSES } from '../../db';
import { FAMILIES, bikes } from '../../data/bikes';
import { getCountry } from '../../data/countries';

export const prerender = false;

/**
 * Escapa un valor para CSV.
 *
 * El prefijo con comilla simple cuando el texto arranca con =, +, - o @
 * evita la inyección de fórmulas: sin eso, un lead llamado `=1+1` se
 * ejecutaría al abrir el archivo en Excel.
 */
function csvCell(value: string | null | undefined): string {
  const text = value ?? '';
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

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

  const lines = [
    header.join(','),
    ...rows.map((lead) =>
      [
        csvCell(lead.createdAt.toISOString()),
        csvCell(lead.fullName),
        csvCell(lead.email),
        csvCell(getCountry(lead.country)?.name ?? lead.country),
        csvCell(lead.country),
        csvCell(lead.bikeName),
        csvCell(lead.status),
        csvCell(lead.utmSource),
      ].join(',')
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(
    // BOM al principio: sin esto Excel abre el CSV en Latin-1 y rompe las
    // tildes y las eñes.
    '﻿' + lines.join('\r\n'),
    {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="leads-${stamp}.csv"`,
        'cache-control': 'no-store',
      },
    }
  );
};
