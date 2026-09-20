import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

/**
 * Sirve dist/client como archivos estáticos.
 *
 * `astro preview` no funciona con el adaptador de Vercel, así que esto es lo
 * que permite ver el build real en el navegador. Solo sirve la parte
 * estática: las rutas de servidor (la API y el panel) devuelven 404, porque
 * en producción las atiende una función de Vercel.
 *
 * Es lo que hay que levantar para el escenario E16: en `npm run dev`, Vite
 * sirve cada módulo suelto y Astro inyecta su barra de herramientas, así que
 * ahí es imposible medir cuánto JavaScript llega de verdad.
 *
 *   node scripts/serve-build.mjs [puerto]
 */

const PORT = Number(process.argv[2] ?? 4331);
const ROOT = 'dist/client';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolver(urlPath) {
  // normalize() colapsa los `..`, así que no se puede salir de dist/client.
  const limpio = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidatos = [
    join(ROOT, limpio),
    join(ROOT, limpio, 'index.html'),
    join(ROOT, `${limpio}.html`),
  ];

  for (const ruta of candidatos) {
    try {
      const info = await stat(ruta);
      if (info.isFile()) return ruta;
    } catch {
      // seguimos con el siguiente candidato
    }
  }
  return null;
}

createServer(async (req, res) => {
  const ruta = await resolver(req.url ?? '/');

  if (!ruta) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(
      'No está en el build estático. Las rutas de servidor (API y panel) ' +
        'solo corren con `npm run dev` o desplegadas en Vercel.'
    );
    return;
  }

  res.writeHead(200, {
    'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(await readFile(ruta));
}).listen(PORT, () => {
  console.log(`Build estático en http://localhost:${PORT}`);
});
