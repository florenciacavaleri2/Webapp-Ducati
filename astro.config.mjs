// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://ducati-leads.vercel.app',

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
