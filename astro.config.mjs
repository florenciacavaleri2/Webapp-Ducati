// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

/**
 * URL pública del sitio, para el canonical, el sitemap y los datos
 * estructurados.
 *
 * Astro exige una URL absoluta y válida: si no lo es, **falla todo el build**
 * con un escueto "Invalid URL". Dos errores fáciles la rompen —dejar la
 * variable vacía (que `??` no atrapa, porque solo cubre null y undefined) o
 * escribirla sin `https://`—, así que acá se valida de verdad y se cae a la
 * siguiente opción en vez de tumbar el despliegue.
 *
 * En Vercel no hace falta configurar nada: `VERCEL_PROJECT_PRODUCTION_URL` la
 * pone la plataforma sola.
 */
function resolverSite() {
  const candidatos = [
    process.env.PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    'http://localhost:4321',
  ];

  for (const candidato of candidatos) {
    if (!candidato) continue;
    try {
      return new URL(candidato).href;
    } catch {
      console.warn(`[config] PUBLIC_SITE_URL inválida: ${JSON.stringify(candidato)}`);
    }
  }
}

// https://astro.build/config
export default defineConfig({
  site: resolverSite(),

  // 'static' prerenderiza todo por defecto. Las rutas que necesitan servidor
  // (/api/* y /admin/*) se marcan una por una con `export const prerender = false`.
  // Así la landing se sirve como HTML plano desde el CDN.
  output: 'static',
  adapter: vercel(),

  // Sin integración de framework a propósito: la única parte interactiva del
  // sitio es el formulario, y React + react-dom cuestan ~45 KB gzip. Se
  // resuelve con mejora progresiva en ~1 KB. Ver AGENTS.md.
  integrations: [
    sitemap({
      // El panel no se indexa.
      filter: (page) => !page.includes('/admin'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    // Un solo archivo CSS en vez de uno por página: menos requests.
    inlineStylesheets: 'auto',
  },
});
