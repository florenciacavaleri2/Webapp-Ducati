import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import {
  applyMigrations,
  leadBody,
  peticionLead,
  setupEnv,
} from './helpers';

/**
 * El endpoint del formulario, contra una base de verdad.
 *
 * Se invoca el handler real con un Request real: lo único simulado es el
 * motor de Postgres, que corre en memoria en vez de en Neon.
 */

setupEnv();

let POST: typeof import('../../src/pages/api/leads').POST;
let db: Awaited<ReturnType<typeof import('../../src/db').getDb>>;
let leads: typeof import('../../src/db').leads;

beforeAll(async () => {
  const dbModule = await import('../../src/db');
  db = await dbModule.getDb();
  leads = dbModule.leads;
  await applyMigrations(db);

  POST = (await import('../../src/pages/api/leads')).POST;
});

beforeEach(async () => {
  await db.execute(sql`DELETE FROM leads`);
});

async function contarLeads() {
  const r = await db.execute<{ total: number }>(
    sql`SELECT COUNT(*)::int AS total FROM leads`
  );
  return r.rows[0]!.total;
}

async function primerLead() {
  const r = await db.select().from(leads).limit(1);
  return r[0];
}

function llamar(request: Request) {
  // El handler solo usa `request`; el resto del contexto de Astro no le hace falta.
  return POST({ request } as Parameters<typeof POST>[0]) as Promise<Response>;
}

describe('POST /api/leads — camino feliz', () => {
  it('guarda el lead y responde ok', async () => {
    const res = await llamar(peticionLead(leadBody()));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(await contarLeads()).toBe(1);
  });

  it('guarda los datos normalizados', async () => {
    await llamar(
      peticionLead(
        leadBody({
          fullName: '  Ana Pérez  ',
          email: '  Ana.Perez@Ejemplo.COM ',
          country: 'ar',
        })
      )
    );

    const lead = await primerLead();
    expect(lead?.fullName).toBe('Ana Pérez');
    expect(lead?.email).toBe('ana.perez@ejemplo.com');
    expect(lead?.country).toBe('AR');
  });

  it('guarda el nombre del modelo, no solo el slug', async () => {
    // Congelar el nombre hace que el lead siga siendo legible aunque el
    // catálogo cambie más adelante.
    await llamar(peticionLead(leadBody({ bikeSlug: 'panigale-v4-s' })));

    const lead = await primerLead();
    expect(lead?.bikeSlug).toBe('panigale-v4-s');
    expect(lead?.bikeName).toBe('Panigale V4 S');
  });

  it('arranca en estado "nuevo"', async () => {
    await llamar(peticionLead(leadBody()));
    expect((await primerLead())?.status).toBe('nuevo');
  });

  it('guarda la fecha de creación', async () => {
    const antes = Date.now();
    await llamar(peticionLead(leadBody()));
    const lead = await primerLead();

    expect(lead?.createdAt).toBeInstanceOf(Date);
    expect(lead!.createdAt.getTime()).toBeGreaterThanOrEqual(antes - 1000);
  });

  it('guarda el origen de la campaña cuando viene', async () => {
    await llamar(peticionLead(leadBody({ utmSource: 'instagram' })));
    expect((await primerLead())?.utmSource).toBe('instagram');
  });

  it('deja el origen en null cuando no viene', async () => {
    await llamar(peticionLead(leadBody()));
    expect((await primerLead())?.utmSource).toBeNull();
  });

  it('permite que la misma persona consulte por dos motos', async () => {
    await llamar(peticionLead(leadBody({ bikeSlug: 'monster' })));
    await llamar(peticionLead(leadBody({ bikeSlug: 'desert-x' })));
    expect(await contarLeads()).toBe(2);
  });
});

describe('POST /api/leads — sin JavaScript', () => {
  it('redirige a la página de gracias', async () => {
    const res = await llamar(peticionLead(leadBody(), { json: false }));

    // 303 y no 302: así el refresh del navegador no reenvía el formulario.
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/gracias');
    expect(await contarLeads()).toBe(1);
  });

  it('ante un error vuelve al formulario con el mensaje', async () => {
    const res = await llamar(
      peticionLead(leadBody({ email: 'roto' }), { json: false })
    );

    expect(res.status).toBe(303);
    const location = res.headers.get('location')!;
    expect(location).toContain('#contacto');
    expect(location).toContain('error=');
  });
});

describe('POST /api/leads — validación', () => {
  it.each([
    ['nombre sin apellido', { fullName: 'Ana' }],
    ['email inválido', { email: 'no-es-email' }],
    ['país inexistente', { country: 'XX' }],
    ['moto inexistente', { bikeSlug: 'ducati-inventada' }],
    ['nombre vacío', { fullName: '' }],
  ])('rechaza con 422 un %s', async (_caso, override) => {
    const res = await llamar(peticionLead(leadBody(override)));

    expect(res.status).toBe(422);
    expect(await contarLeads()).toBe(0);
  });

  it('devuelve el error por campo', async () => {
    const res = await llamar(peticionLead(leadBody({ email: 'roto', country: 'XX' })));
    const body = (await res.json()) as { errors: Record<string, string> };

    expect(body.errors.email).toBeTruthy();
    expect(body.errors.country).toBeTruthy();
    expect(body.errors.fullName).toBeUndefined();
  });

  it('no confía en el cliente: valida contra el catálogo real', async () => {
    // Un slug con forma válida pero que no existe tiene que morir en el
    // servidor, aunque el navegador lo haya dejado pasar.
    const res = await llamar(peticionLead(leadBody({ bikeSlug: 'panigale-v9' })));
    expect(res.status).toBe(422);
  });
});

describe('POST /api/leads — anti-spam', () => {
  it('descarta el honeypot y responde éxito falso', async () => {
    // Responder un error le diría al bot que lo detectamos, y ajustaría
    // el envío hasta pasar. Mejor que crea que funcionó.
    const res = await llamar(peticionLead(leadBody({ company: 'Bot S.A.' })));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(await contarLeads()).toBe(0);
  });

  it('descarta los envíos instantáneos', async () => {
    const res = await llamar(
      peticionLead(leadBody({ renderedAt: String(Date.now()) }))
    );

    expect(res.status).toBe(200);
    expect(await contarLeads()).toBe(0);
  });

  it('acepta un envío que tardó más de dos segundos', async () => {
    await llamar(peticionLead(leadBody({ renderedAt: String(Date.now() - 2500) })));
    expect(await contarLeads()).toBe(1);
  });

  it('acepta el envío si no viene renderedAt', async () => {
    // Un navegador con JavaScript desactivado no lo completa; no podemos
    // castigar a esa persona.
    const body = leadBody();
    body.delete('renderedAt');
    await llamar(peticionLead(body));
    expect(await contarLeads()).toBe(1);
  });
});

describe('POST /api/leads — rate limit', () => {
  it('frena a partir del sexto envío desde la misma IP', async () => {
    const ip = '198.51.100.42';
    const codigos: number[] = [];

    for (let i = 0; i < 7; i++) {
      const res = await llamar(
        peticionLead(leadBody({ email: `tope${i}@ejemplo.com` }), { ip })
      );
      codigos.push(res.status);
    }

    expect(codigos.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(codigos.slice(5)).toEqual([429, 429]);
    expect(await contarLeads()).toBe(5);
  });

  it('el 429 indica cuánto esperar', async () => {
    const ip = '198.51.100.43';
    for (let i = 0; i < 6; i++) {
      await llamar(peticionLead(leadBody(), { ip }));
    }
    const res = await llamar(peticionLead(leadBody(), { ip }));

    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('no afecta a otra IP', async () => {
    const ip = '198.51.100.44';
    for (let i = 0; i < 7; i++) {
      await llamar(peticionLead(leadBody(), { ip }));
    }

    const res = await llamar(peticionLead(leadBody(), { ip: '198.51.100.99' }));
    expect(res.status).toBe(200);
  });
});
