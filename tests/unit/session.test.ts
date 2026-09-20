import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * La sesión del panel: lo único que separa los leads de cualquiera que
 * escriba /admin en la barra de direcciones.
 *
 * El módulo lee las variables de entorno en cada llamada, así que se puede
 * reimportar limpio en cada caso.
 */

const SECRET = 'secreto-de-prueba-muy-largo-para-hmac';
const PASSWORD = 'contrasena-de-prueba';

async function loadSession() {
  vi.resetModules();
  return import('../../src/lib/session');
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.ADMIN_PASSWORD = PASSWORD;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('verifyPassword', () => {
  it('acepta la contraseña correcta', async () => {
    const { verifyPassword } = await loadSession();
    expect(verifyPassword(PASSWORD)).toBe(true);
  });

  it.each([
    ['una distinta', 'otra-cosa'],
    ['vacía', ''],
    ['con un carácter de más', PASSWORD + 'x'],
    ['con un carácter de menos', PASSWORD.slice(0, -1)],
    ['con distinta capitalización', PASSWORD.toUpperCase()],
  ])('rechaza la contraseña %s', async (_caso, intento) => {
    const { verifyPassword } = await loadSession();
    expect(verifyPassword(intento)).toBe(false);
  });

  it('falla si no hay ADMIN_PASSWORD configurada', async () => {
    delete process.env.ADMIN_PASSWORD;
    const { verifyPassword } = await loadSession();
    expect(() => verifyPassword('lo-que-sea')).toThrow(/ADMIN_PASSWORD/);
  });
});

describe('token de sesión', () => {
  it('acepta un token recién emitido', async () => {
    const { createSessionToken, isValidSessionToken } = await loadSession();
    const token = await createSessionToken();
    expect(await isValidSessionToken(token)).toBe(true);
  });

  it('el token lleva vencimiento y firma', async () => {
    const { createSessionToken } = await loadSession();
    const token = await createSessionToken();
    const [vencimiento, firma] = token.split('.');
    expect(Number(vencimiento)).toBeGreaterThan(Date.now());
    expect(firma).toBeTruthy();
  });

  it.each([
    ['vacío', ''],
    ['indefinido', undefined],
    ['sin punto', '123456789'],
    ['solo firma', '.abc'],
    ['vencimiento no numérico', 'mañana.abc'],
  ])('rechaza un token %s', async (_caso, token) => {
    const { isValidSessionToken } = await loadSession();
    expect(await isValidSessionToken(token as string | undefined)).toBe(false);
  });

  it('rechaza un token con la firma alterada', async () => {
    const { createSessionToken, isValidSessionToken } = await loadSession();
    const token = await createSessionToken();
    const [vencimiento] = token.split('.');
    expect(await isValidSessionToken(`${vencimiento}.firmaInventada`)).toBe(false);
  });

  it('rechaza un token al que le estiraron el vencimiento', async () => {
    // El ataque obvio: agarrar una cookie vencida y cambiarle la fecha.
    const { createSessionToken, isValidSessionToken } = await loadSession();
    const token = await createSessionToken();
    const [, firma] = token.split('.');
    const futuro = Date.now() + 999 * 24 * 3600_000;
    expect(await isValidSessionToken(`${futuro}.${firma}`)).toBe(false);
  });

  it('rechaza un token firmado con otra clave', async () => {
    const primera = await loadSession();
    const token = await primera.createSessionToken();

    process.env.SESSION_SECRET = 'otra-clave-distinta';
    const segunda = await loadSession();

    expect(await segunda.isValidSessionToken(token)).toBe(false);
  });

  it('rechaza el token una vez vencido', async () => {
    const { createSessionToken, isValidSessionToken } = await loadSession();
    const token = await createSessionToken();

    // 8 horas y un minuto después.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 8 * 3600_000 + 60_000);

    expect(await isValidSessionToken(token)).toBe(false);
  });

  it('sigue válido justo antes de vencer', async () => {
    const { createSessionToken, isValidSessionToken } = await loadSession();
    const token = await createSessionToken();

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 7 * 3600_000);

    expect(await isValidSessionToken(token)).toBe(true);
  });

  it('falla si no hay SESSION_SECRET configurada', async () => {
    delete process.env.SESSION_SECRET;
    const { createSessionToken } = await loadSession();
    await expect(createSessionToken()).rejects.toThrow(/SESSION_SECRET/);
  });
});

describe('opciones de la cookie', () => {
  it('es HttpOnly, SameSite=Lax y de alcance raíz', async () => {
    const { SESSION_COOKIE_OPTIONS, SESSION_COOKIE } = await loadSession();
    expect(SESSION_COOKIE).toBe('ducati_admin');
    expect(SESSION_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(SESSION_COOKIE_OPTIONS.sameSite).toBe('lax');
    expect(SESSION_COOKIE_OPTIONS.path).toBe('/');
    expect(SESSION_COOKIE_OPTIONS.maxAge).toBe(8 * 3600);
  });
});
