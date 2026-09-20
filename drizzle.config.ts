import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? '';

// `generate` solo lee el schema y no se conecta a nada, así que no exigimos
// la URL acá: si faltara, quien falla es `db:migrate` o `db:studio`, con un
// mensaje que explica qué hacer.
const isPglite = url.startsWith('pglite:');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  ...(isPglite
    ? { driver: 'pglite' as const, dbCredentials: { url: url.replace(/^pglite:\/\//, '') } }
    : { dbCredentials: { url } }),
  strict: true,
  verbose: true,
});
