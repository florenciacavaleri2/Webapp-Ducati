import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

/**
 * Descarga una vez las fotos de los modelos desde el CDN de Ducati (Contentful)
 * a src/assets/bikes/, para que Astro pueda optimizarlas en build.
 *
 * Hotlinkear el CDN metería un dominio externo en el critical path y empeoraría
 * el LCP, así que las servimos nosotros.
 *
 * Contentful acepta parámetros de transformación en la URL, así que pedimos
 * WebP al ancho que necesitamos en lugar del PNG original.
 *
 * Es idempotente: si el archivo ya existe, lo saltea. Forzar con --force.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = join(root, 'src', 'assets', 'bikes');

const FORCE = process.argv.includes('--force');

/** Ancho de las tarjetas de modelo (2x para pantallas retina). */
const CARD_WIDTH = 1260;
/** Ancho del hero. */
const HERO_WIDTH = 1600;

const HERO = {
  slug: '_hero-panigale-v4',
  imageSource:
    'https://images.ctfassets.net/x7j9qwvpvr5s/2kT0kWOWmAsCzRornEwfuJ/a7873eae139508dda9509397dac72c82/Ducati-MY25-Panigale-V4-overview-hero-1600x1000.01.jpg',
  width: HERO_WIDTH,
};

function transformUrl(source, width) {
  const url = new URL(source);
  url.searchParams.set('fm', 'webp');
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', '85');
  return url.toString();
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function download(slug, source, width) {
  const dest = join(outDir, `${slug}.webp`);

  if (!FORCE && (await exists(dest))) {
    return { slug, status: 'skip' };
  }

  const url = transformUrl(source, width);
  const res = await fetch(url, {
    headers: {
      // Contentful responde 403 a clientes sin User-Agent.
      'User-Agent': 'ducati-leads-build/1.0',
      Accept: 'image/webp,image/*',
    },
  });

  if (!res.ok) {
    throw new Error(`${slug}: HTTP ${res.status} ${res.statusText} — ${url}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 1024) {
    throw new Error(`${slug}: respuesta sospechosamente chica (${buf.byteLength} bytes)`);
  }

  await writeFile(dest, buf);
  return { slug, status: 'ok', bytes: buf.byteLength };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const { default: bikes } = await import('../src/data/bikes.json', {
    with: { type: 'json' },
  });

  const jobs = [
    HERO,
    ...bikes.map((b) => ({ slug: b.slug, imageSource: b.imageSource, width: CARD_WIDTH })),
  ];

  let ok = 0;
  let skipped = 0;
  const failures = [];

  // De a 4 en paralelo, para no castigar al CDN.
  for (let i = 0; i < jobs.length; i += 4) {
    const batch = jobs.slice(i, i + 4);
    const results = await Promise.allSettled(
      batch.map((j) => download(j.slug, j.imageSource, j.width))
    );
    for (const [idx, r] of results.entries()) {
      if (r.status === 'rejected') {
        failures.push(r.reason.message);
        console.error(`  ✗ ${batch[idx].slug}: ${r.reason.message}`);
      } else if (r.value.status === 'skip') {
        skipped++;
      } else {
        ok++;
        console.log(`  ✓ ${r.value.slug}.webp (${Math.round(r.value.bytes / 1024)} KB)`);
      }
    }
  }

  console.log(
    `\n${ok} descargadas, ${skipped} ya estaban, ${failures.length} fallaron → ${outDir}`
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
