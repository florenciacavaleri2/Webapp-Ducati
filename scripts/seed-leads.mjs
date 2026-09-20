/**
 * Carga leads de ejemplo para poder ver el panel con datos.
 *
 * SOLO PARA DESARROLLO Y DEMOSTRACIÓN. No correr contra producción.
 *
 *   npm run db:seed          agrega los leads de ejemplo
 *   npm run db:seed -- --reset   borra todo antes de cargar
 *
 * Requiere que nada más tenga la base abierta: si estás usando PGlite,
 * frená el servidor de desarrollo antes de correrlo.
 */

import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_URL. Copiá .env.example a .env.');
  process.exit(1);
}

const RESET = process.argv.includes('--reset');

const bikes = JSON.parse(readFileSync('src/data/bikes.json', 'utf8'));
const bikeBySlug = new Map(bikes.map((b) => [b.slug, b]));

/** Horas hacia atrás desde ahora, para que el orden por fecha tenga sentido. */
const SAMPLE = [
  ['Martina Sosa', 'martina.sosa@gmail.com', 'AR', 'panigale-v4', 'nuevo', 2, 'instagram'],
  ['Joaquín Beltrán', 'jbeltran@outlook.com', 'AR', 'multistrada-v4-s', 'nuevo', 5, 'google'],
  ['Camila Ferreyra', 'cami.ferreyra@gmail.com', 'UY', 'monster', 'nuevo', 8, null],
  ['Rodrigo Paz', 'rodrigo.paz@hotmail.com', 'AR', 'streetfighter-v4', 'contactado', 14, 'google'],
  ['Valentina Ríos', 'vrios@empresa.com.ar', 'AR', 'desert-x', 'nuevo', 20, null],
  ['Tomás Aguirre', 'tomas.aguirre@gmail.com', 'CL', 'panigale-v2', 'contactado', 26, 'instagram'],
  ['Lucía Medina', 'lucia.medina@gmail.com', 'AR', 'monster', 'nuevo', 31, 'google'],
  ['Federico Blanco', 'fede.blanco@gmail.com', 'AR', 'diavel-v4', 'contactado', 38, null],
  ['Sofía Navarro', 'sofia.navarro@gmail.com', 'ES', 'panigale-v4-s', 'nuevo', 44, 'youtube'],
  ['Nicolás Duarte', 'nduarte@fibertel.com.ar', 'AR', 'multistrada-v2', 'descartado', 50, null],
  ['Agustina Roldán', 'agus.roldan@gmail.com', 'AR', 'hypermotard-698-mono', 'nuevo', 56, 'instagram'],
  ['Matías Correa', 'mcorrea@gmail.com', 'BR', 'streetfighter-v2', 'contactado', 62, 'google'],
  ['Julieta Peralta', 'julieta.peralta@gmail.com', 'AR', 'scrambler-icon', 'nuevo', 68, null],
  ['Santiago Ibarra', 'santi.ibarra@gmail.com', 'AR', 'panigale-v4-r', 'contactado', 74, 'youtube'],
  ['Florencia Quiroga', 'flor.quiroga@gmail.com', 'UY', 'multistrada-v4', 'nuevo', 80, 'google'],
  ['Emiliano Vera', 'emi.vera@gmail.com', 'AR', 'monster', 'descartado', 86, null],
  ['Carolina Méndez', 'caro.mendez@gmail.com', 'AR', 'desert-x', 'contactado', 92, 'instagram'],
  ['Gonzalo Arias', 'garias@estudio.com.ar', 'AR', 'xdiavel-v4', 'nuevo', 98, null],
  ['Belén Ortiz', 'belen.ortiz@gmail.com', 'CL', 'panigale-v2', 'nuevo', 104, 'google'],
  ['Ignacio Ledesma', 'nacho.ledesma@gmail.com', 'AR', 'multistrada-v4-pikes-peak', 'contactado', 110, null],
  ['Micaela Funes', 'mica.funes@gmail.com', 'AR', 'scrambler-nightshift', 'nuevo', 116, 'instagram'],
  ['Pablo Herrera', 'pablo.herrera@gmail.com', 'US', 'panigale-v4-tricolore', 'nuevo', 122, 'youtube'],
  ['Antonella Gómez', 'anto.gomez@gmail.com', 'AR', 'hypermotard-698-mono-rve', 'contactado', 128, 'google'],
  ['Leandro Cabrera', 'lean.cabrera@gmail.com', 'AR', 'streetfighter-v4', 'descartado', 134, null],
  ['Daniela Ponce', 'dani.ponce@gmail.com', 'PY', 'monster', 'nuevo', 140, 'instagram'],
  ['Hernán Molina', 'hernan.molina@gmail.com', 'AR', 'multistrada-v2-s', 'contactado', 146, null],
  ['Rocío Benítez', 'rocio.benitez@gmail.com', 'AR', 'scrambler-full-throttle', 'nuevo', 152, 'google'],
  ['Diego Maldonado', 'diego.maldonado@gmail.com', 'AR', 'panigale-v4', 'nuevo', 158, 'youtube'],
];

async function connect() {
  if (url.startsWith('pglite:')) {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { mkdirSync } = await import('node:fs');
    const { dirname } = await import('node:path');

    const path = url.replace(/^pglite:\/\//, '');
    mkdirSync(dirname(path), { recursive: true });
    return drizzle(new PGlite(path));
  }

  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  return drizzle(neon(url));
}

const db = await connect();

if (RESET) {
  await db.execute(sql`DELETE FROM leads`);
  console.log('Tabla leads vaciada.');
}

const now = Date.now();
let inserted = 0;

for (const [fullName, email, country, slug, status, hoursAgo, utm] of SAMPLE) {
  const bike = bikeBySlug.get(slug);

  if (!bike) {
    console.error(`  ✗ ${fullName}: el modelo "${slug}" no existe en bikes.json`);
    continue;
  }

  const createdAt = new Date(now - hoursAgo * 3600_000).toISOString();

  await db.execute(sql`
    INSERT INTO leads (full_name, email, country, bike_slug, bike_name, status, utm_source, created_at)
    VALUES (${fullName}, ${email}, ${country}, ${bike.slug}, ${bike.name}, ${status}, ${utm}, ${createdAt})
  `);

  inserted++;
}

const [{ total }] = (await db.execute(sql`SELECT COUNT(*)::int AS total FROM leads`)).rows;

console.log(`\n${inserted} leads de ejemplo cargados. Total en la base: ${total}.`);

// PGlite deja abierto su worker y el proceso nunca termina solo.
process.exit(0);
