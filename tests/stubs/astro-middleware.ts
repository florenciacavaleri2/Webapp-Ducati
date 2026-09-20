/**
 * Stub de `astro:middleware`.
 *
 * Ese módulo virtual solo existe cuando corre Astro, así que sin esto no se
 * puede importar `src/middleware.ts` desde un test. `defineMiddleware` en
 * Astro es únicamente una ayuda de tipos: devuelve la función tal cual. El
 * stub hace lo mismo, así que el middleware que se prueba es el real.
 */

export function defineMiddleware<T>(fn: T): T {
  return fn;
}

export function sequence(...handlers: unknown[]): unknown[] {
  return handlers;
}
