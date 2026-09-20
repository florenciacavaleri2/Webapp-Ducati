import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { ADMIN_PASSWORD, ORIGIN, applyMigrations, setupEnv } from './helpers';

/**
 * El panel: el guard de /admin, el cambio de estado y la exportación.
 *
 * Se llaman los handlers reales; lo único que se arma a mano es el contexto
 * mínimo de Astro que cada uno consume.
 */

setupEnv();

let db: Awaited<ReturnType<typeof import('../../src/db').getDb>>;
let leads: typeof import('../../src/db').leads;
let onRequest: typeof import('../../src/middleware').onRequest;
let statusPOST: typeof import('../../src/pages/admin/status').POST;
let exportGET: typeof import('../../src/pages/admin/export.csv').GET;
let sesion: typeof import('../../src/lib/session');

beforeAll(async () => {
  const dbModule = await import('../../src/db');
  db = await dbModule.getDb();
  leads = dbModule.leads;
  await applyMigrations(db);

  onRequest = (await import('../../src/middleware')).onRequest;
  statusPOST = (await import('../../src/pages/admin/status')).POST;
  exportGET = (await import('../../src/pages/admin/export.csv')).GET;
  sesion = await import('../../src/lib/session');
});

beforeEach(async () => {
  await db.execute(sql`DELETE FROM leads`);
});

/** Contexto mínimo de Astro para el middleware. */
function contexto(path: string, cookie?: string) {
  const redirecciones: Array<{ to: string; status?: number }> = [];
  return {
    ctx: {
      url: new URL(`${ORIGIN}${path}`),
      cookies: {
        get: (name: string) =>
          name === sesion.SESSION_COOKIE && cookie ? { value: cookie } : undefined,
      },
      redirect: (to: string, status?: number) => {
        redirecciones.push({ to, status });
        return new Response(null, { status: status ?? 302, headers: { location: to } });
      },
    },
    redirecciones,
  };
}

const siguiente = () => Promise.resolve(new Response('contenido del panel'));

/**
 * Corre el middleware y garantiza que haya respondido algo.
 *
 * El tipo de Astro admite `void | Response`; si alguna vez devolviera void
 * para una ruta de /admin, la petición seguiría de largo sin guard y el
 * panel quedaría abierto. Por eso esto es una aserción y no un cast.
 */
async function correrMiddleware(
  ctx: ReturnType<typeof contexto>['ctx']
): Promise<Response> {
  const res = await onRequest(ctx as never, siguiente);
  if (!(res instanceof Response)) {
    throw new Error('El middleware no devolvió una Response');
  }
  return res;
}

async function insertarLead(overrides: Partial<typeof leads.$inferInsert> = {}) {
  const [fila] = await db
    .insert(leads)
    .values({
      fullName: 'Ana Pérez',
      email: 'ana@ejemplo.com',
      country: 'AR',
      bikeSlug: 'monster',
      bikeName: 'Monster',
      ...overrides,
    })
    .returning();
  return fila!;
}

describe('middleware — guard de /admin', () => {
  it('deja pasar las rutas públicas sin sesión', async () => {
    const { ctx } = contexto('/');
    const res = await correrMiddleware(ctx);
    expect(res.status).toBe(200);
  });

  it.each(['/admin', '/admin/', '/admin/export.csv', '/admin/cualquier-cosa'])(
    'redirige %s al login cuando no hay sesión',
    async (path) => {
      const { ctx } = contexto(path);
      const res = await correrMiddleware(ctx);

      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toContain('/admin/login');
    }
  );

  it('deja entrar al login sin sesión', async () => {
    const { ctx } = contexto('/admin/login');
    const res = await correrMiddleware(ctx);
    expect(res.status).toBe(200);
  });

  it('recuerda a dónde quería ir', async () => {
    const { ctx } = contexto('/admin?status=nuevo');
    const res = await correrMiddleware(ctx);

    const location = res.headers.get('location')!;
    expect(location).toContain(encodeURIComponent('/admin?status=nuevo'));
  });

  it('deja pasar con una sesión válida', async () => {
    const token = await sesion.createSessionToken();
    const { ctx } = contexto('/admin', token);

    const res = await correrMiddleware(ctx);
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe('contenido del panel');
  });

  it.each([
    ['con la firma alterada', `${Date.now() + 3600_000}.firmaFalsa`],
    ['vencida pero bien firmada en apariencia', '1000000000000.abc'],
    ['basura', 'no-es-un-token'],
  ])('rechaza una cookie %s', async (_caso, token) => {
    const { ctx } = contexto('/admin', token);
    const res = await correrMiddleware(ctx);
    expect(res.status).toBe(302);
  });

  it('una ruta nueva bajo /admin nace protegida', async () => {
    // El guard mira el prefijo, no una lista de rutas: por eso no hay
    // forma de agregar una página al panel y olvidarse de protegerla.
    const { ctx } = contexto('/admin/reportes/nuevo-tablero');
    const res = await correrMiddleware(ctx);
    expect(res.status).toBe(302);
  });
});

describe('POST /admin/status', () => {
  function pedido(campos: Record<string, string>) {
    const redirecciones: string[] = [];
    const request = new Request(`${ORIGIN}/admin/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN },
      body: new URLSearchParams(campos),
    });
    const redirect = (to: string, status?: number) => {
      redirecciones.push(to);
      return new Response(null, { status: status ?? 303, headers: { location: to } });
    };
    return { request, redirect, redirecciones };
  }

  it('cambia el estado', async () => {
    const lead = await insertarLead();
    const { request, redirect } = pedido({ id: lead.id, status: 'contactado', back: '' });

    await statusPOST({ request, redirect } as never);

    const [actualizado] = await db.select().from(leads);
    expect(actualizado!.status).toBe('contactado');
  });

  it('conserva los filtros al volver', async () => {
    const lead = await insertarLead();
    const { request, redirect, redirecciones } = pedido({
      id: lead.id,
      status: 'descartado',
      back: '?status=nuevo&family=Panigale',
    });

    await statusPOST({ request, redirect } as never);
    expect(redirecciones[0]).toBe('/admin?status=nuevo&family=Panigale');
  });

  it('ignora un estado que no existe', async () => {
    const lead = await insertarLead();
    const { request, redirect } = pedido({ id: lead.id, status: 'inventado', back: '' });

    await statusPOST({ request, redirect } as never);

    const [sinCambios] = await db.select().from(leads);
    expect(sinCambios!.status).toBe('nuevo');
  });

  it('ignora un id que no es UUID', async () => {
    await insertarLead();
    const { request, redirect } = pedido({
      id: "1 OR 1=1; DROP TABLE leads;--",
      status: 'contactado',
      back: '',
    });

    await statusPOST({ request, redirect } as never);

    const filas = await db.select().from(leads);
    expect(filas).toHaveLength(1);
    expect(filas[0]!.status).toBe('nuevo');
  });

  it.each([
    ['absoluto', 'https://sitio-malicioso.com'],
    ['protocol-relative', '//sitio-malicioso.com'],
    ['con ruta', '/otra/cosa'],
  ])('no redirige a un destino %s', async (_caso, back) => {
    const lead = await insertarLead();
    const { request, redirect, redirecciones } = pedido({
      id: lead.id,
      status: 'contactado',
      back,
    });

    await statusPOST({ request, redirect } as never);
    expect(redirecciones[0]).toBe('/admin');
  });
});

describe('GET /admin/export.csv', () => {
  async function exportar(query = '') {
    return exportGET({ url: new URL(`${ORIGIN}/admin/export.csv${query}`) } as never);
  }

  it('devuelve un CSV descargable', async () => {
    await insertarLead();
    const res = await exportar();

    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('attachment');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('arranca con BOM para que Excel lea los acentos', async () => {
    await insertarLead();
    const bytes = new Uint8Array(await (await exportar()).arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it('incluye encabezado y una fila por lead', async () => {
    await insertarLead({ email: 'uno@ejemplo.com' });
    await insertarLead({ email: 'dos@ejemplo.com' });

    const texto = await (await exportar()).text();
    const lineas = texto.trim().split('\r\n');

    expect(lineas[0]).toBe('fecha,nombre,email,pais,codigo_pais,moto,estado,origen');
    expect(lineas).toHaveLength(3);
  });

  it('traduce el país a español', async () => {
    await insertarLead({ country: 'BR' });
    const texto = await (await exportar()).text();
    expect(texto).toContain('"Brasil","BR"');
  });

  it('respeta el filtro por estado', async () => {
    await insertarLead({ email: 'nuevo@ejemplo.com' });
    await insertarLead({ email: 'contactado@ejemplo.com', status: 'contactado' });

    const texto = await (await exportar('?status=contactado')).text();
    expect(texto).toContain('contactado@ejemplo.com');
    expect(texto).not.toContain('nuevo@ejemplo.com');
  });

  it('respeta el filtro por familia', async () => {
    await insertarLead({
      email: 'pani@ejemplo.com',
      bikeSlug: 'panigale-v4',
      bikeName: 'Panigale V4',
    });
    await insertarLead({ email: 'monster@ejemplo.com' });

    const texto = await (await exportar('?family=Panigale')).text();
    expect(texto).toContain('pani@ejemplo.com');
    expect(texto).not.toContain('monster@ejemplo.com');
  });

  it('respeta la búsqueda por nombre o email', async () => {
    await insertarLead({ fullName: 'Ana Pérez', email: 'ana@ejemplo.com' });
    await insertarLead({ fullName: 'Juan Gómez', email: 'juan@ejemplo.com' });

    const texto = await (await exportar('?q=juan')).text();
    expect(texto).toContain('Juan Gómez');
    expect(texto).not.toContain('Ana Pérez');
  });

  it('ignora un filtro de estado inventado en vez de romper', async () => {
    await insertarLead();
    const texto = await (await exportar('?status=inventado')).text();
    expect(texto.trim().split('\r\n')).toHaveLength(2);
  });

  it('neutraliza una fórmula escondida en el nombre', async () => {
    await insertarLead({ fullName: '=SUM(1+1) Malicioso' });
    const texto = await (await exportar()).text();
    expect(texto).toContain(`"'=SUM(1+1) Malicioso"`);
  });

  it('devuelve solo el encabezado cuando no hay leads', async () => {
    const texto = await (await exportar()).text();
    expect(texto.trim().split('\r\n')).toHaveLength(1);
  });
});

describe('login del panel', () => {
  it('la contraseña correcta pasa', () => {
    expect(sesion.verifyPassword(ADMIN_PASSWORD)).toBe(true);
  });

  it('el token emitido abre el panel', async () => {
    const token = await sesion.createSessionToken();
    const { ctx } = contexto('/admin', token);
    const res = await correrMiddleware(ctx);
    expect(res.status).toBe(200);
  });
});
