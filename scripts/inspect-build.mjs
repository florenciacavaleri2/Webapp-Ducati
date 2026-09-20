import { readFileSync, statSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

/**
 * Radiografía del build: verifica lo que hace rápida a la landing.
 *
 *   npm run build && node scripts/inspect-build.mjs
 */

const html = readFileSync('dist/client/index.html', 'utf8');

const count = (re) => (html.match(re) ?? []).length;

console.log('\n--- HTML estático (funciona sin JavaScript) ---');
console.log('form:', (html.match(/<form[^>]*>/) ?? ['(ninguno)'])[0]);
console.log('opciones del select:', count(/<option/g), 'en', count(/<optgroup/g), 'grupos');
console.log('honeypot presente:', html.includes('name="company"'));

console.log('\n--- Imágenes ---');
const imgs = count(/<img/g);
console.log('total:', imgs);
console.log('con width y height:', count(/<img[^>]*width="[^"]*"[^>]*height="/g), '(previene CLS)');
console.log('con srcset:', count(/<img[^>]*srcset=/g));
console.log('lazy:', count(/loading="lazy"/g), '| eager:', count(/loading="eager"/g));

console.log('\n--- SEO ---');
console.log('JSON-LD:', html.includes('application/ld+json'));
console.log('canonical:', /<link rel="canonical"/.test(html));
console.log('og:title:', /property="og:title"/.test(html));

console.log('\n--- Peso ---');
const inlineJs = [
  ...html.matchAll(/<script(?![^>]*src)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g),
].reduce((a, m) => a + m[1].length, 0);

const externalJs = readdirSync('dist/client/_astro')
  .filter((f) => f.endsWith('.js'))
  .reduce((a, f) => a + statSync(join('dist/client/_astro', f)).size, 0);

const cssLinked = [...html.matchAll(/href="\/_astro\/([^"]+\.css)"/g)].map((m) => m[1]);
const cssBytes = cssLinked.reduce(
  (a, f) => a + statSync(join('dist/client/_astro', f)).size,
  0
);
const cssGzip = cssLinked.reduce(
  (a, f) => a + gzipSync(readFileSync(join('dist/client/_astro', f))).length,
  0
);

const htmlGzip = gzipSync(Buffer.from(html)).length;

console.log(`HTML:               ${html.length} B  (${htmlGzip} B gzip)`);
console.log(`  JavaScript inline:  ${inlineJs} B  (incluido arriba)`);
console.log(`JavaScript externo: ${externalJs} B`);
console.log(`CSS (${cssLinked.length} archivos):     ${cssBytes} B  (${cssGzip} B gzip)`);
console.log(`\nTotal de texto:     ${htmlGzip + cssGzip} B gzip`);

const jsTotal = inlineJs + externalJs;
const BUDGET = 20 * 1024;
console.log(
  `\nJavaScript total: ${jsTotal} B / presupuesto ${BUDGET} B — ${
    jsTotal <= BUDGET ? 'OK' : 'EXCEDIDO'
  }\n`
);

if (jsTotal > BUDGET) process.exitCode = 1;
