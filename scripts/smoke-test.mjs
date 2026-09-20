/**
 * Pruebas de humo contra el servidor de desarrollo.
 *
 * Golpean /api/leads y /admin directamente, salteando el navegador: lo que
 * importa es que el servidor no confíe en el cliente. Requiere el servidor
 * andando (`npm run dev`) y la base local migrada.
 *
 *   node scripts/smoke-test.mjs [http://localhost:4321]
 */

const BASE = process.argv[2] ?? 'http://localhost:4321';

// Astro rechaza con 403 los POST cuyo Origin no coincide con el host: es su
// protección CSRF. El navegador lo manda solo; acá hay que ponerlo a mano.
const ORIGIN = new URL(BASE).origin;

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FALLA ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function body(fields) {
  const form = new URLSearchParams({
    fullName: 'Ana Pérez',
    email: 'ana@ejemplo.com',
    country: 'AR',
    bikeSlug: 'monster',
    company: '',
    renderedAt: String(Date.now() - 10_000),
    ...fields,
  });
  return form;
}

// El endpoint limita a 5 envíos por IP cada 10 minutos. Cada caso usa una IP
// distinta para que el límite no tape lo que queremos probar; que el límite
// funcione se verifica aparte, al final.
let fakeIp = 0;
const nextIp = () => `203.0.113.${++fakeIp}`;

async function postJson(fields, ip = nextIp()) {
  const res = await fetch(`${BASE}/api/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
      origin: ORIGIN,
      'x-forwarded-for': ip,
    },
    body: body(fields),
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

async function countLeads() {
  // El CSV nos sirve de sonda: una línea de encabezado + una por lead.
  const res = await fetch(`${BASE}/admin/export.csv`, {
    headers: { cookie: cookie ?? '' },
    redirect: 'manual',
  });
  if (!res.ok) return -1;
  // Ojo: res.text() descarta el BOM al decodificar UTF-8, así que acá no
  // aparece. Que el BOM esté en los bytes se comprueba aparte.
  const text = await res.text();
  if (!text.startsWith('fecha,')) return -1;
  return text.trim().split('\r\n').length - 1;
}

let cookie = null;

console.log(`\nProbando ${BASE}\n`);

// --- Autenticación del panel ------------------------------------------------
console.log('Panel');
{
  const res = await fetch(`${BASE}/admin`, { redirect: 'manual' });
  check(
    '/admin sin sesión redirige al login',
    res.status === 302 && (res.headers.get('location') ?? '').includes('/admin/login'),
    `status ${res.status}`
  );
}
{
  const res = await fetch(`${BASE}/admin`, {
    redirect: 'manual',
    headers: { cookie: 'ducati_admin=9999999999999.firmaInventada' },
  });
  check(
    'cookie con firma inválida se rechaza',
    res.status === 302,
    `status ${res.status}`
  );
}
{
  const res = await fetch(`${BASE}/admin/export.csv`, {
    redirect: 'manual',
  });
  check(
    '/admin/export.csv sin sesión no entrega datos',
    res.status === 302,
    `status ${res.status}`
  );
}
{
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN },
    body: new URLSearchParams({ password: process.env.ADMIN_PASSWORD ?? '' }),
    redirect: 'manual',
  });
  const setCookie = res.headers.get('set-cookie') ?? '';
  cookie = setCookie.split(';')[0];
  check('login con contraseña correcta emite sesión', setCookie.includes('ducati_admin'));
  check('la cookie es HttpOnly', /httponly/i.test(setCookie));
  check('la cookie es SameSite=Lax', /samesite=lax/i.test(setCookie));
}

const before = await countLeads();
check('el panel exporta CSV con sesión', before >= 0, `contó ${before}`);
{
  // Sin BOM, Excel abre el archivo en Latin-1 y rompe tildes y eñes.
  const res = await fetch(`${BASE}/admin/export.csv`, { headers: { cookie } });
  const bytes = new Uint8Array(await res.arrayBuffer());
  check(
    'el CSV arranca con BOM para que Excel lea bien los acentos',
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf,
    `bytes ${bytes[0]} ${bytes[1]} ${bytes[2]}`
  );
  check(
    'el CSV se descarga como archivo adjunto',
    (res.headers.get('content-disposition') ?? '').includes('attachment')
  );
}

// --- Validación del servidor ------------------------------------------------
console.log('\nValidación (el servidor no confía en el cliente)');
{
  const { res, json } = await postJson({ email: 'no-es-un-email' });
  check('email inválido → 422', res.status === 422, `status ${res.status}`);
  check('devuelve el error del campo email', Boolean(json?.errors?.email));
}
{
  const { res } = await postJson({ country: 'XX' });
  check('país inexistente → 422', res.status === 422, `status ${res.status}`);
}
{
  const { res } = await postJson({ bikeSlug: 'ducati-inventada' });
  check('modelo inexistente → 422', res.status === 422, `status ${res.status}`);
}
{
  const { res } = await postJson({ fullName: 'Ana' });
  check('nombre sin apellido → 422', res.status === 422, `status ${res.status}`);
}
{
  const res = await fetch(`${BASE}/api/leads`, { method: 'GET' });
  check('GET a /api/leads → 405', res.status === 405, `status ${res.status}`);
}

// --- Anti-spam --------------------------------------------------------------
console.log('\nAnti-spam');
{
  const { res, json } = await postJson({ company: 'Bot S.A.' });
  check('honeypot completo responde éxito falso', res.status === 200 && json?.ok === true);
}
{
  const { res, json } = await postJson({ renderedAt: String(Date.now()) });
  check('envío instantáneo responde éxito falso', res.status === 200 && json?.ok === true);
}

const afterSpam = await countLeads();
check(
  'ningún envío rechazado llegó a la base',
  afterSpam === before,
  `antes ${before}, después ${afterSpam}`
);

// --- Camino feliz sin JavaScript --------------------------------------------
console.log('\nFormulario sin JavaScript');
{
  const res = await fetch(`${BASE}/api/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: ORIGIN,
      'x-forwarded-for': nextIp(),
    },
    body: body({ fullName: 'Sin Javascript', email: 'nojs@ejemplo.com' }),
    redirect: 'manual',
  });
  check(
    'sin Accept JSON redirige 303 a /gracias',
    res.status === 303 && res.headers.get('location') === '/gracias',
    `status ${res.status} → ${res.headers.get('location')}`
  );
}

const afterHappy = await countLeads();
check('el lead válido sí se guardó', afterHappy === before + 1, `${before} → ${afterHappy}`);

// --- Inyección de fórmulas en el CSV ----------------------------------------
console.log('\nCSV');
{
  await postJson({
    fullName: '=SUM(1+1) Malicioso',
    email: 'formula@ejemplo.com',
  });
  const res = await fetch(`${BASE}/admin/export.csv?q=Malicioso`, {
    headers: { cookie },
  });
  const text = await res.text();
  check(
    'un nombre que empieza con "=" se neutraliza en el CSV',
    text.includes(`"'=SUM(1+1) Malicioso"`),
    text.split('\r\n')[1] ?? '(sin fila)'
  );
}

// --- Rate limit -------------------------------------------------------------
console.log('\nRate limit');
{
  const ip = '198.51.100.7';
  const codes = [];
  for (let i = 0; i < 7; i++) {
    const { res } = await postJson({ email: `tope${i}@ejemplo.com` }, ip);
    codes.push(res.status);
  }
  check(
    'el sexto envío desde la misma IP se frena con 429',
    codes.filter((c) => c === 429).length >= 2,
    `códigos ${codes.join(', ')}`
  );
}

// --- Redirector abierto -----------------------------------------------------
console.log('\nRedirecciones');
{
  const res = await fetch(`${BASE}/admin/login?next=https://ejemplo-malicioso.com`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN },
    body: new URLSearchParams({ password: process.env.ADMIN_PASSWORD ?? '' }),
    redirect: 'manual',
  });
  const location = res.headers.get('location') ?? '';
  check(
    'no se puede redirigir fuera del sitio tras el login',
    !location.includes('ejemplo-malicioso.com'),
    `location ${location}`
  );
}

console.log(`\n${passed} ok, ${failed} fallas\n`);
process.exit(failed > 0 ? 1 : 0);
