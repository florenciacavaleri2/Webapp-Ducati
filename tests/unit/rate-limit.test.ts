import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * El contador vive en memoria del módulo, así que cada caso lo reimporta
 * limpio en vez de compartir estado con el anterior.
 */
async function loadRateLimit() {
  vi.resetModules();
  return import('../../src/lib/rate-limit');
}

const LIMITE = 5;
const VENTANA_MS = 10 * 60 * 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  it(`deja pasar los primeros ${LIMITE} intentos`, async () => {
    const { checkRateLimit } = await loadRateLimit();
    for (let i = 0; i < LIMITE; i++) {
      expect(checkRateLimit('1.2.3.4').allowed).toBe(true);
    }
  });

  it('frena el siguiente', async () => {
    const { checkRateLimit } = await loadRateLimit();
    for (let i = 0; i < LIMITE; i++) checkRateLimit('1.2.3.4');

    const r = checkRateLimit('1.2.3.4');
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('descuenta los intentos que quedan', async () => {
    const { checkRateLimit } = await loadRateLimit();
    expect(checkRateLimit('1.2.3.4').remaining).toBe(LIMITE - 1);
    expect(checkRateLimit('1.2.3.4').remaining).toBe(LIMITE - 2);
  });

  it('cuenta cada clave por separado', async () => {
    const { checkRateLimit } = await loadRateLimit();
    for (let i = 0; i < LIMITE + 2; i++) checkRateLimit('1.1.1.1');

    // Otra IP no tiene por qué pagar el consumo de la primera.
    expect(checkRateLimit('2.2.2.2').allowed).toBe(true);
  });

  it('no mezcla el login con el formulario aunque sea la misma IP', async () => {
    const { checkRateLimit } = await loadRateLimit();
    for (let i = 0; i < LIMITE + 2; i++) checkRateLimit('1.1.1.1');

    expect(checkRateLimit('login:1.1.1.1').allowed).toBe(true);
  });

  it('vuelve a permitir cuando pasa la ventana', async () => {
    vi.useFakeTimers();
    const { checkRateLimit } = await loadRateLimit();

    for (let i = 0; i < LIMITE + 1; i++) checkRateLimit('1.2.3.4');
    expect(checkRateLimit('1.2.3.4').allowed).toBe(false);

    vi.advanceTimersByTime(VENTANA_MS + 1000);

    expect(checkRateLimit('1.2.3.4').allowed).toBe(true);
  });

  it('sigue bloqueando dentro de la ventana', async () => {
    vi.useFakeTimers();
    const { checkRateLimit } = await loadRateLimit();

    for (let i = 0; i < LIMITE + 1; i++) checkRateLimit('1.2.3.4');
    vi.advanceTimersByTime(VENTANA_MS - 5000);

    expect(checkRateLimit('1.2.3.4').allowed).toBe(false);
  });
});

describe('clientIp', () => {
  function req(headers: Record<string, string>) {
    return new Request('https://ejemplo.com', { headers });
  }

  it('prefiere la cabecera que pone Vercel', async () => {
    const { clientIp } = await loadRateLimit();
    const r = req({
      'x-vercel-forwarded-for': '9.9.9.9',
      'x-real-ip': '8.8.8.8',
      'x-forwarded-for': '1.1.1.1',
    });
    expect(clientIp(r)).toBe('9.9.9.9');
  });

  it('usa x-real-ip antes que x-forwarded-for', async () => {
    const { clientIp } = await loadRateLimit();
    expect(clientIp(req({ 'x-real-ip': '8.8.8.8', 'x-forwarded-for': '1.1.1.1' }))).toBe(
      '8.8.8.8'
    );
  });

  it('ignora un x-forwarded-for falsificado si la plataforma dio la IP real', async () => {
    // Sin esta precedencia, bastaba con inventar una IP distinta por intento
    // para saltarse el límite por completo.
    const { clientIp } = await loadRateLimit();
    const r = req({ 'x-real-ip': '8.8.8.8', 'x-forwarded-for': '203.0.113.99' });
    expect(clientIp(r)).toBe('8.8.8.8');
  });

  it('cae en x-forwarded-for cuando no hay nada más (desarrollo local)', async () => {
    const { clientIp } = await loadRateLimit();
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1' }))).toBe('1.1.1.1');
  });

  it('toma el primer valor de la cadena de proxies', async () => {
    const { clientIp } = await loadRateLimit();
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' }))).toBe('1.1.1.1');
  });

  it('devuelve un valor fijo cuando no hay ninguna cabecera', async () => {
    const { clientIp } = await loadRateLimit();
    expect(clientIp(req({}))).toBe('desconocida');
  });

  it('no devuelve cadena vacía si la cabecera viene vacía', async () => {
    const { clientIp } = await loadRateLimit();
    expect(clientIp(req({ 'x-forwarded-for': '' }))).toBe('desconocida');
  });
});
