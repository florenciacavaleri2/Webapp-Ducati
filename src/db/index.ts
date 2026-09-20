import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Cliente de base de datos.
 *
 * Producción: Neon sobre HTTP. Una petición por query, sin pool ni conexión
 * persistente, que es lo que funciona en serverless.
 *
 * Desarrollo: si DATABASE_URL arranca con `pglite:`, usa PGlite, un Postgres
 * embebido que corre en el propio proceso y guarda todo en una carpeta local.
 * Así se puede levantar el proyecto y probar el flujo completo sin crear
 * ninguna cuenta. Es la misma sintaxis SQL, así que el código no cambia.
 *
 * El cliente es perezoso a propósito: si se conectara al importar, el build
 * de la landing estática fallaría en una máquina sin DATABASE_URL, y la
 * landing no necesita base de datos para compilarse.
 */

type Db =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  // PGlite se carga dinámicamente, así que su tipo se resuelve en runtime.
  | Awaited<ReturnType<typeof createPglite>>;

let cached: Db | null = null;

function databaseUrl(): string {
  const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'Falta DATABASE_URL. Copiá .env.example a .env. Para desarrollo local ' +
        'podés usar DATABASE_URL="pglite://.data/dev" y no hace falta ninguna cuenta.'
    );
  }

  return url;
}

async function createPglite(path: string) {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');

  // PGlite crea su propia carpeta, pero no la carpeta que la contiene.
  mkdirSync(dirname(path), { recursive: true });

  return drizzle(new PGlite(path), { schema });
}

/**
 * Devuelve el cliente. Es async porque PGlite se importa bajo demanda: así
 * el bundle de producción nunca lo incluye.
 */
export async function getDb(): Promise<Db> {
  if (cached) return cached;

  const url = databaseUrl();

  cached = url.startsWith('pglite:')
    ? await createPglite(url.replace(/^pglite:\/\//, ''))
    : drizzleNeon(neon(url), { schema });

  return cached;
}

export { schema };
export * from './schema';
