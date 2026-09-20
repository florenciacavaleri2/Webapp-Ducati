import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Dos suites, las dos en Node:
 *
 * - `unit`        funciones puras. Sin base, sin red, sin servidor.
 * - `integration` los handlers reales contra un Postgres de verdad
 *                 (PGlite en memoria, que se crea y se tira en cada archivo).
 *
 * El end-to-end no vive acá: lo maneja el MCP de Playwright sobre el sitio
 * levantado. Ver tests/e2e/.
 */
export default defineConfig({
  resolve: {
    alias: {
      // Módulo virtual de Astro: fuera del framework no existe.
      'astro:middleware': fileURLToPath(
        new URL('./tests/stubs/astro-middleware.ts', import.meta.url)
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          // Cada archivo levanta su propia base en memoria; correrlos en
          // paralelo dentro del mismo proceso los haría pisarse.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
