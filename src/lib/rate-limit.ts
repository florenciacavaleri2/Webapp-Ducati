/**
 * Rate limit en memoria por IP.
 *
 * Alcanza para frenar el spam básico del formulario. En serverless cada
 * instancia tiene su propio contador, así que el límite real es por
 * instancia, no global: es una primera barrera, no una garantía. Si el
 * volumen lo pide, esto se reemplaza por Upstash Redis sin tocar los
 * llamadores.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const MAX_REQUESTS = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();

  // Barrido perezoso: sin esto el Map crece sin techo en un proceso largo.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: 0 };
  }

  bucket.count++;

  if (bucket.count > MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - bucket.count,
    retryAfterSeconds: 0,
  };
}

/**
 * IP del visitante.
 *
 * El orden importa. `x-forwarded-for` lo puede escribir cualquiera que mande
 * la petición, así que si lo miráramos primero bastaría con inventar una IP
 * distinta en cada intento para saltarse el límite. `x-vercel-forwarded-for`
 * y `x-real-ip` los pone la plataforma y no se pueden falsificar desde afuera;
 * el forwarded queda como último recurso, para desarrollo local.
 */
export function clientIp(request: Request): string {
  const trusted =
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-real-ip');

  if (trusted) return trusted.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  // El primer valor es el cliente original; el resto son proxies.
  const first = forwarded?.split(',')[0]?.trim();

  return first || 'desconocida';
}
