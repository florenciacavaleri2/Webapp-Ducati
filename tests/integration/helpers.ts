import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';

/**
 * Infraestructura común de los tests de integración.
 *
 * Levanta un Postgres real en memoria (PGlite) y le aplica las migraciones
 * de verdad, las mismas que corren en producción. Así lo que se prueba es
 * el SQL que Drizzle genera, no una imitación: si una columna cambia de
 * tipo o falta un índice, acá se nota.
 */

export const ADMIN_PASSWORD = 'contrasena-de-prueba-integracion';
export const SESSION_SECRET = 'clave-de-firma-de-prueba-para-integracion';
export const ORIGIN = 'http://localhost:4321';

/**
 * Configura el entorno. Hay que llamarlo ANTES de importar cualquier módulo
 * que lea process.env, porque `src/db` cachea el cliente en el primer uso.
 */
export function setupEnv() {
  process.env.DATABASE_URL = 'pglite://:memory:';
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.SESSION_SECRET = SESSION_SECRET;
  process.env.PUBLIC_SITE_URL = ORIGIN;
}

const drizzleDir = fileURLToPath(new URL('../../drizzle/', import.meta.url));

/** Aplica los .sql de ./drizzle sobre la base que le pasen. */
export async function applyMigrations(db: {
  execute: (q: ReturnType<typeof sql.raw>) => Promise<unknown>;
}) {
  const archivos = readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (archivos.length === 0) {
    throw new Error('No hay migraciones en ./drizzle. Corré: npm run db:generate');
  }

  for (const archivo of archivos) {
    const contenido = readFileSync(drizzleDir + archivo, 'utf8');
    // drizzle-kit separa las sentencias con este marcador.
    for (const sentencia of contenido.split('--> statement-breakpoint')) {
      const limpia = sentencia.trim();
      if (limpia) await db.execute(sql.raw(limpia));
    }
  }
}

/** Cuerpo de formulario válido, con los campos anti-spam ya en orden. */
export function leadBody(overrides: Record<string, string> = {}) {
  return new URLSearchParams({
    fullName: 'Ana Pérez',
    email: 'ana@ejemplo.com',
    country: 'AR',
    bikeSlug: 'monster',
    company: '',
    renderedAt: String(Date.now() - 10_000),
    ...overrides,
  });
}

let ipCounter = 0;

/** Una IP distinta por llamada, para que el rate limit no tape otros casos. */
export function nuevaIp() {
  return `203.0.113.${++ipCounter % 250}`;
}

interface PeticionOpciones {
  json?: boolean;
  ip?: string;
  cookie?: string;
}

export function peticionLead(
  body: URLSearchParams,
  { json = true, ip = nuevaIp() }: PeticionOpciones = {}
) {
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
    origin: ORIGIN,
    'x-forwarded-for': ip,
  };
  if (json) headers.accept = 'application/json';

  return new Request(`${ORIGIN}/api/leads`, { method: 'POST', headers, body });
}
