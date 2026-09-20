/**
 * Sesión del panel de administración.
 *
 * Una sola contraseña compartida (ADMIN_PASSWORD) y una cookie firmada con
 * HMAC-SHA256. No guardamos sesiones en base: la cookie lleva su propia
 * fecha de vencimiento y la firma impide que alguien la fabrique.
 *
 * Usa Web Crypto, que existe tanto en Node como en el runtime de Vercel.
 */

export const SESSION_COOKIE = 'ducati_admin';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function env(name: string): string {
  const value = import.meta.env[name] ?? process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiá .env.example a .env y completala.`
    );
  }
  return value;
}

// TextEncoder siempre devuelve un Uint8Array sobre un ArrayBuffer común, pero
// su tipo es el genérico ArrayBufferLike, que Web Crypto no acepta. La
// afirmación reduce el tipo a lo que el valor ya es en tiempo de ejecución.
function bytes(input: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(input) as Uint8Array<ArrayBuffer>;
}

function toBase64Url(data: ArrayBuffer | Uint8Array): string {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (const b of view) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    bytes(env('SESSION_SECRET')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toBase64Url(await crypto.subtle.sign('HMAC', key, bytes(payload)));
}

/**
 * Comparación en tiempo constante.
 *
 * Con `===` el tiempo de respuesta filtra cuántos caracteres acertó quien
 * prueba, lo que permite adivinar la contraseña carácter por carácter.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = bytes(a);
  const bBytes = bytes(b);
  // Comparamos siempre la misma cantidad de bytes para no filtrar la longitud.
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

export function verifyPassword(candidate: string): boolean {
  return timingSafeEqual(candidate, env('ADMIN_PASSWORD'));
}

/** Devuelve el valor de la cookie de sesión: "<vencimiento>.<firma>". */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = await hmac(String(expiresAt));
  return `${expiresAt}.${signature}`;
}

export async function isValidSessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const expiresAtRaw = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  // Verificamos la firma incluso si ya venció, para no tener dos caminos
  // de salida con tiempos distintos.
  return timingSafeEqual(signature, await hmac(expiresAtRaw));
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
  secure: import.meta.env.PROD,
} as const;
