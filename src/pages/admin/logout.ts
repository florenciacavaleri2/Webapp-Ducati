import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../../lib/session';

export const prerender = false;

// POST y no GET: así un <img src="/admin/logout"> en cualquier página no
// puede desloguear a quien esté viendo el panel.
export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/admin/login', 302);
};
