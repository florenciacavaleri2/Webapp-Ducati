/**
 * Aplica las migraciones de ./drizzle a la base configurada.
 *
 * Funciona contra Neon (producción) y contra PGlite (desarrollo local),
 * según cómo empiece DATABASE_URL. Se corre con `npm run db:migrate`, que
 * carga .env con --env-file.
 *
 * Generar las migraciones es otro paso: `npm run db:generate`.
 */

const url = process.env.DATABASE_URL;

if (!url) {
  console.error(
    'Falta DATABASE_URL. Copiá .env.example a .env.\n' +
      'Para desarrollo local podés usar: DATABASE_URL="pglite://.data/dev"'
  );
  process.exit(1);
}

const isPglite = url.startsWith('pglite:');

try {
  if (isPglite) {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');

    const { mkdirSync } = await import('node:fs');
    const { dirname } = await import('node:path');

    const path = url.replace(/^pglite:\/\//, '');
    // PGlite crea su propia carpeta, pero no la carpeta que la contiene.
    mkdirSync(dirname(path), { recursive: true });

    const db = drizzle(new PGlite(path));
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log(`Migraciones aplicadas sobre PGlite en ./${path}`);
  } else {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { migrate } = await import('drizzle-orm/neon-http/migrator');

    const db = drizzle(neon(url));
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migraciones aplicadas sobre Neon.');
  }
} catch (error) {
  console.error('Falló la migración:', error);
  process.exit(1);
}
