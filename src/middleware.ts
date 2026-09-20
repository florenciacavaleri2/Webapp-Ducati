import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, isValidSessionToken } from './lib/session';

/**
 * Guard del panel.
 *
 * Todo lo que cuelga de /admin exige sesión, salvo el propio login. Poner
 * el control acá y no en cada página evita que una ruta nueva nazca abierta
 * por olvido.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/admin')) {
    return next();
  }

  if (pathname === '/admin/login') {
    return next();
  }

  const token = context.cookies.get(SESSION_COOKIE)?.value;

  if (!(await isValidSessionToken(token))) {
    // Guardamos a dónde quería ir para devolverlo ahí después del login.
    const next_ = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/admin/login?next=${next_}`, 302);
  }

  return next();
});
